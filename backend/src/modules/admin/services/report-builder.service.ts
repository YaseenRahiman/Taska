import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PdfGeneratorService } from './pdf-generator.service';
import {
  CreateReportDto,
  UpdateReportDto,
  GenerateReportDto,
  GetReportsQueryDto,
  GetExecutionsQueryDto,
  ReportResponseDto,
  ReportExecutionResponseDto,
  ReportDataResponseDto,
  ReportDataSource,
  ReportMetric,
  ReportGroupBy,
  CronFrequency,
} from '../dto/report.dto';
import { ReportFormat, ReportExecutionStatus } from '@prisma/client';
import * as Papa from 'papaparse';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ReportBuilderService {
  private readonly logger = new Logger(ReportBuilderService.name);
  private readonly reportsDir = path.join(process.cwd(), 'storage', 'reports');

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfGenerator: PdfGeneratorService,
  ) {
    // Ensure reports directory exists
    this.initializeStorage();
  }

  /**
   * Initialize storage directory
   */
  private async initializeStorage() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      this.logger.log(`Reports storage initialized at: ${this.reportsDir}`);
    } catch (error) {
      this.logger.error('Failed to initialize reports storage', error);
    }
  }

  /**
   * Create a new report definition
   */
  async createReport(dto: CreateReportDto, createdBy: string): Promise<ReportResponseDto> {
    this.logger.log(`Creating new report: ${dto.name}`);

    // Calculate next run time if scheduled
    const nextRun = dto.schedule ? this.calculateNextRun(dto.schedule.frequency) : null;

    const report = await this.prisma.report.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        createdBy,
        config: dto.config as any,
        schedule: dto.schedule as any,
        nextRun,
        isActive: dto.isActive ?? true,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(report);
  }

  /**
   * Get all reports with pagination
   */
  async getReports(
    query: GetReportsQueryDto,
  ): Promise<{
    reports: ReportResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, isActive, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }
    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports: reports.map((r) => this.mapToResponseDto(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single report by ID
   */
  async getReportById(reportId: string): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report not found: ${reportId}`);
    }

    return this.mapToResponseDto(report);
  }

  /**
   * Update a report
   */
  async updateReport(reportId: string, dto: UpdateReportDto): Promise<ReportResponseDto> {
    this.logger.log(`Updating report: ${reportId}`);

    // Check if report exists
    await this.getReportById(reportId);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.config) updateData.config = dto.config;
    if (dto.schedule !== undefined) {
      updateData.schedule = dto.schedule;
      if (dto.schedule) {
        updateData.nextRun = this.calculateNextRun(dto.schedule.frequency);
      }
    }
    if (typeof dto.isActive === 'boolean') updateData.isActive = dto.isActive;

    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(report);
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string): Promise<void> {
    this.logger.log(`Deleting report: ${reportId}`);

    await this.getReportById(reportId); // Check existence

    await this.prisma.report.delete({
      where: { id: reportId },
    });
  }

  /**
   * Generate a report
   */
  async generateReport(reportId: string, dto: GenerateReportDto): Promise<ReportExecutionResponseDto> {
    this.logger.log(`Generating report: ${reportId} in format: ${dto.format}`);

    const report = await this.getReportById(reportId);
    const config = report.config as any;

    // Override dates if provided
    if (dto.startDate) config.startDate = dto.startDate;
    if (dto.endDate) config.endDate = dto.endDate;

    // Create execution record
    const execution = await this.prisma.reportExecution.create({
      data: {
        reportId,
        status: ReportExecutionStatus.PENDING,
        format: dto.format,
      },
    });

    // Generate report asynchronously
    this.generateReportAsync(execution.id, report.name, config, dto.format).catch((error) => {
      this.logger.error(`Failed to generate report execution ${execution.id}`, error);
    });

    return this.mapToExecutionResponseDto(execution);
  }

  /**
   * Generate report asynchronously
   */
  private async generateReportAsync(executionId: string, reportName: string, config: any, format: ReportFormat): Promise<void> {
    try {
      // Update status to generating
      await this.prisma.reportExecution.update({
        where: { id: executionId },
        data: { status: ReportExecutionStatus.GENERATING },
      });

      // Fetch report data
      const data = await this.fetchReportData(config);

      // Generate file based on format
      let fileUrl: string;
      let fileSizeMb: number;

      switch (format) {
        case ReportFormat.PDF:
          fileUrl = await this.generatePdfReport(executionId, reportName, data);
          break;
        case ReportFormat.CSV:
          fileUrl = await this.generateCsvReport(executionId, data);
          break;
        case ReportFormat.EXCEL:
          fileUrl = await this.generateExcelReport(executionId, data);
          break;
        case ReportFormat.JSON:
          fileUrl = await this.generateJsonReport(executionId, data);
          break;
        default:
          throw new BadRequestException(`Unsupported format: ${format}`);
      }

      // Get file size
      const filePath = path.join(this.reportsDir, path.basename(fileUrl));
      const stats = await fs.stat(filePath);
      fileSizeMb = stats.size / 1024 / 1024;

      // Update execution record
      await this.prisma.reportExecution.update({
        where: { id: executionId },
        data: {
          status: ReportExecutionStatus.COMPLETED,
          fileUrl,
          fileSizeMb,
          rowCount: data.totalRows,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Report execution ${executionId} completed successfully`);
    } catch (error) {
      this.logger.error(`Report execution ${executionId} failed`, error);

      await this.prisma.reportExecution.update({
        where: { id: executionId },
        data: {
          status: ReportExecutionStatus.FAILED,
          errorMessage: error.message || 'Unknown error',
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Fetch report data based on configuration
   */
  private async fetchReportData(config: any): Promise<ReportDataResponseDto> {
    this.logger.log(`Fetching report data for source: ${config.dataSource}`);

    switch (config.dataSource) {
      case ReportDataSource.USERS:
        return this.fetchUsersData(config);
      case ReportDataSource.JOBS:
        return this.fetchJobsData(config);
      case ReportDataSource.PAYMENTS:
        return this.fetchPaymentsData(config);
      case ReportDataSource.REVIEWS:
        return this.fetchReviewsData(config);
      case ReportDataSource.BIDS:
        return this.fetchBidsData(config);
      case ReportDataSource.AUDIT_LOGS:
        return this.fetchAuditLogsData(config);
      default:
        throw new BadRequestException(`Unsupported data source: ${config.dataSource}`);
    }
  }

  /**
   * Fetch users data
   */
  private async fetchUsersData(config: any): Promise<ReportDataResponseDto> {
    const where = this.buildWhereClause(config);

    const users = await this.prisma.user.findMany({
      where,
      include: {
        profile: true,
      },
      take: config.limit || 10000,
      orderBy: config.sortBy ? { [config.sortBy]: config.sortOrder || 'desc' } : { createdAt: 'desc' },
    });

    const columns = ['ID', 'Email', 'Role', 'Name', 'Phone', 'City', 'Verified', 'Created At'];
    const rows = users.map((u) => [
      u.id,
      u.email,
      u.role,
      u.profile ? `${u.profile.firstName || ''} ${u.profile.lastName || ''}`.trim() : '-',
      u.profile?.phoneNumber || '-',
      u.profile?.city || '-',
      u.verifiedAt ? 'Yes' : 'No',
      u.createdAt.toISOString(),
    ]);

    const summary = {
      total_users: users.length,
      verified_users: users.filter((u) => u.verifiedAt).length,
      clients: users.filter((u) => u.role === 'CLIENT').length,
      artisans: users.filter((u) => u.role === 'ARTISAN').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
    };

    return { columns, rows, totalRows: users.length, summary };
  }

  /**
   * Fetch jobs data
   */
  private async fetchJobsData(config: any): Promise<ReportDataResponseDto> {
    const where = this.buildWhereClause(config);

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        client: { select: { email: true } },
        category: { select: { name: true } },
        bids: true,
      },
      take: config.limit || 10000,
      orderBy: config.sortBy ? { [config.sortBy]: config.sortOrder || 'desc' } : { createdAt: 'desc' },
    });

    const columns = ['ID', 'Title', 'Client', 'Category', 'Budget', 'Status', 'Bid Count', 'Created At'];
    const rows = jobs.map((j) => [
      j.id,
      j.title,
      j.client.email,
      j.category.name,
      j.budget.toString(),
      j.status,
      j.bids.length,
      j.createdAt.toISOString(),
    ]);

    const summary = {
      total_jobs: jobs.length,
      total_budget: jobs.reduce((sum, j) => sum + Number(j.budget), 0),
      avg_budget: jobs.length > 0 ? jobs.reduce((sum, j) => sum + Number(j.budget), 0) / jobs.length : 0,
      open_jobs: jobs.filter((j) => j.status === 'OPEN').length,
      completed_jobs: jobs.filter((j) => j.status === 'COMPLETED').length,
    };

    return { columns, rows, totalRows: jobs.length, summary };
  }

  /**
   * Fetch payments data
   */
  private async fetchPaymentsData(config: any): Promise<ReportDataResponseDto> {
    const where = this.buildWhereClause(config);

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        payer: { select: { email: true } },
        payee: { select: { email: true } },
        job: { select: { title: true } },
      },
      take: config.limit || 10000,
      orderBy: config.sortBy ? { [config.sortBy]: config.sortOrder || 'desc' } : { createdAt: 'desc' },
    });

    const columns = ['ID', 'Job', 'Payer', 'Payee', 'Amount', 'Fee', 'Total', 'Status', 'Created At'];
    const rows = payments.map((p) => [
      p.id,
      p.job.title,
      p.payer.email,
      p.payee.email,
      p.amount.toString(),
      p.platformFee.toString(),
      p.totalAmount.toString(),
      p.status,
      p.createdAt.toISOString(),
    ]);

    const summary = {
      total_payments: payments.length,
      total_amount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      total_fees: payments.reduce((sum, p) => sum + Number(p.platformFee), 0),
      completed_payments: payments.filter((p) => p.status === 'COMPLETED').length,
      pending_payments: payments.filter((p) => p.status === 'PENDING').length,
    };

    return { columns, rows, totalRows: payments.length, summary };
  }

  /**
   * Fetch reviews data
   */
  private async fetchReviewsData(config: any): Promise<ReportDataResponseDto> {
    const where = this.buildWhereClause(config);

    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        reviewer: { select: { email: true } },
        reviewee: { select: { email: true } },
        job: { select: { title: true } },
      },
      take: config.limit || 10000,
      orderBy: config.sortBy ? { [config.sortBy]: config.sortOrder || 'desc' } : { createdAt: 'desc' },
    });

    const columns = ['ID', 'Job', 'Reviewer', 'Reviewee', 'Rating', 'Quality', 'Timeliness', 'Verified', 'Created At'];
    const rows = reviews.map((r) => [
      r.id,
      r.job.title,
      r.reviewer.email,
      r.reviewee.email,
      r.rating,
      r.qualityRating,
      r.timelinessRating,
      r.isVerified ? 'Yes' : 'No',
      r.createdAt.toISOString(),
    ]);

    const summary = {
      total_reviews: reviews.length,
      avg_rating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      verified_reviews: reviews.filter((r) => r.isVerified).length,
      five_star: reviews.filter((r) => r.rating === 5).length,
      one_star: reviews.filter((r) => r.rating === 1).length,
    };

    return { columns, rows, totalRows: reviews.length, summary };
  }

  /**
   * Fetch bids data
   */
  private async fetchBidsData(config: any): Promise<ReportDataResponseDto> {
    const where = this.buildWhereClause(config);

    const bids = await this.prisma.bid.findMany({
      where,
      include: {
        artisan: { select: { email: true } },
        job: { select: { title: true } },
      },
      take: config.limit || 10000,
      orderBy: config.sortBy ? { [config.sortBy]: config.sortOrder || 'desc' } : { createdAt: 'desc' },
    });

    const columns = ['ID', 'Job', 'Artisan', 'Amount', 'Days', 'Status', 'Created At'];
    const rows = bids.map((b) => [
      b.id,
      b.job.title,
      b.artisan.email,
      b.amount.toString(),
      b.estimatedDays,
      b.status,
      b.createdAt.toISOString(),
    ]);

    const summary = {
      total_bids: bids.length,
      avg_bid_amount: bids.length > 0 ? bids.reduce((sum, b) => sum + Number(b.amount), 0) / bids.length : 0,
      accepted_bids: bids.filter((b) => b.status === 'ACCEPTED').length,
      pending_bids: bids.filter((b) => b.status === 'PENDING').length,
    };

    return { columns, rows, totalRows: bids.length, summary };
  }

  /**
   * Fetch audit logs data
   */
  private async fetchAuditLogsData(config: any): Promise<ReportDataResponseDto> {
    const where = this.buildWhereClause(config);

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        admin: { select: { email: true } },
      },
      take: config.limit || 10000,
      orderBy: config.sortBy ? { [config.sortBy]: config.sortOrder || 'desc' } : { createdAt: 'desc' },
    });

    const columns = ['ID', 'Admin', 'Action', 'Entity Type', 'Entity ID', 'Success', 'IP Address', 'Created At'];
    const rows = logs.map((l) => [l.id, l.admin.email, l.action, l.entityType, l.entityId, l.success ? 'Yes' : 'No', l.ipAddress, l.createdAt.toISOString()]);

    const summary = {
      total_logs: logs.length,
      successful_actions: logs.filter((l) => l.success).length,
      failed_actions: logs.filter((l) => !l.success).length,
      unique_admins: new Set(logs.map((l) => l.adminId)).size,
    };

    return { columns, rows, totalRows: logs.length, summary };
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(config: any): any {
    const where: any = {};

    // Date range filtering
    if (config.startDate || config.endDate) {
      where.createdAt = {};
      if (config.startDate) where.createdAt.gte = new Date(config.startDate);
      if (config.endDate) where.createdAt.lte = new Date(config.endDate);
    }

    // Custom filters
    if (config.filters && Array.isArray(config.filters)) {
      for (const filter of config.filters) {
        if (filter.field && filter.operator && filter.value !== undefined) {
          switch (filter.operator) {
            case 'equals':
              where[filter.field] = filter.value;
              break;
            case 'not_equals':
              where[filter.field] = { not: filter.value };
              break;
            case 'contains':
              where[filter.field] = { contains: filter.value, mode: 'insensitive' };
              break;
            case 'gt':
              where[filter.field] = { gt: filter.value };
              break;
            case 'lt':
              where[filter.field] = { lt: filter.value };
              break;
            case 'gte':
              where[filter.field] = { gte: filter.value };
              break;
            case 'lte':
              where[filter.field] = { lte: filter.value };
              break;
            case 'in':
              where[filter.field] = { in: Array.isArray(filter.value) ? filter.value : [filter.value] };
              break;
          }
        }
      }
    }

    return where;
  }

  /**
   * Generate PDF report
   */
  private async generatePdfReport(executionId: string, reportName: string, data: ReportDataResponseDto): Promise<string> {
    const pdfBuffer = await this.pdfGenerator.generatePdf({
      title: reportName,
      subtitle: `Report generated on ${new Date().toLocaleDateString()}`,
      reportDate: new Date(),
      data,
      includeCharts: false,
      includeSummary: true,
      includeToc: false,
    });

    const filename = `${executionId}.pdf`;
    const filePath = path.join(this.reportsDir, filename);
    await fs.writeFile(filePath, pdfBuffer);

    return `/reports/downloads/${filename}`;
  }

  /**
   * Generate CSV report
   */
  private async generateCsvReport(executionId: string, data: ReportDataResponseDto): Promise<string> {
    const csvData = [data.columns, ...data.rows];
    const csv = Papa.unparse(csvData);

    const filename = `${executionId}.csv`;
    const filePath = path.join(this.reportsDir, filename);
    await fs.writeFile(filePath, csv, 'utf-8');

    return `/reports/downloads/${filename}`;
  }

  /**
   * Generate Excel report (CSV for now, can be enhanced with xlsx library)
   */
  private async generateExcelReport(executionId: string, data: ReportDataResponseDto): Promise<string> {
    // For now, generate CSV (can be enhanced with xlsx library later)
    return this.generateCsvReport(executionId, data);
  }

  /**
   * Generate JSON report
   */
  private async generateJsonReport(executionId: string, data: ReportDataResponseDto): Promise<string> {
    const jsonData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRows: data.totalRows,
        columns: data.columns,
      },
      summary: data.summary,
      data: data.rows.map((row) => {
        const obj: any = {};
        data.columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      }),
    };

    const filename = `${executionId}.json`;
    const filePath = path.join(this.reportsDir, filename);
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');

    return `/reports/downloads/${filename}`;
  }

  /**
   * Get report executions
   */
  async getReportExecutions(
    reportId: string,
    query: GetExecutionsQueryDto,
  ): Promise<{
    executions: ReportExecutionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { reportId };
    if (status) where.status = status;

    const [executions, total] = await Promise.all([
      this.prisma.reportExecution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          report: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.reportExecution.count({ where }),
    ]);

    return {
      executions: executions.map((e) => this.mapToExecutionResponseDto(e)),
      total,
      page,
      limit,
    };
  }

  /**
   * Download report file
   */
  async downloadReport(executionId: string): Promise<{ filePath: string; filename: string }> {
    const execution = await this.prisma.reportExecution.findUnique({
      where: { id: executionId },
      include: { report: true },
    });

    if (!execution) {
      throw new NotFoundException(`Execution not found: ${executionId}`);
    }

    if (!execution.fileUrl) {
      throw new BadRequestException('Report file not available');
    }

    const filename = path.basename(execution.fileUrl);
    const filePath = path.join(this.reportsDir, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('Report file not found on disk');
    }

    return { filePath, filename };
  }

  /**
   * Calculate next run time based on frequency
   */
  private calculateNextRun(frequency: CronFrequency): Date {
    const now = new Date();

    switch (frequency) {
      case CronFrequency.DAILY:
        return new Date(now.setDate(now.getDate() + 1));
      case CronFrequency.WEEKLY:
        return new Date(now.setDate(now.getDate() + 7));
      case CronFrequency.MONTHLY:
        return new Date(now.setMonth(now.getMonth() + 1));
      case CronFrequency.QUARTERLY:
        return new Date(now.setMonth(now.getMonth() + 3));
      default:
        return new Date(now.setDate(now.getDate() + 1));
    }
  }

  /**
   * Map report to response DTO
   */
  private mapToResponseDto(report: any): ReportResponseDto {
    const creatorName = report.creator?.profile
      ? `${report.creator.profile.firstName || ''} ${report.creator.profile.lastName || ''}`.trim()
      : report.creator?.email || 'Unknown';

    return {
      id: report.id,
      name: report.name,
      description: report.description,
      createdBy: report.createdBy,
      config: report.config,
      schedule: report.schedule,
      lastRun: report.lastRun,
      nextRun: report.nextRun,
      isActive: report.isActive,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      creator: report.creator
        ? {
            id: report.creator.id,
            name: creatorName,
            email: report.creator.email,
          }
        : undefined,
    };
  }

  /**
   * Map execution to response DTO
   */
  private mapToExecutionResponseDto(execution: any): ReportExecutionResponseDto {
    return {
      id: execution.id,
      reportId: execution.reportId,
      status: execution.status,
      format: execution.format,
      fileUrl: execution.fileUrl,
      fileSizeMb: execution.fileSizeMb,
      rowCount: execution.rowCount,
      errorMessage: execution.errorMessage,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      report: execution.report
        ? {
            id: execution.report.id,
            name: execution.report.name,
          }
        : undefined,
    };
  }
}
