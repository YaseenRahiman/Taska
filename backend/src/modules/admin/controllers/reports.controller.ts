import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ReportBuilderService } from '../services/report-builder.service';
import {
  CreateReportDto,
  UpdateReportDto,
  GenerateReportDto,
  GetReportsQueryDto,
  GetExecutionsQueryDto,
  ReportResponseDto,
  ReportExecutionResponseDto,
} from '../dto/report.dto';
import { Response } from 'express';
import * as fs from 'fs';

@ApiTags('Admin - Reports')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportBuilderService: ReportBuilderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report definition' })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
    type: ReportResponseDto,
  })
  async createReport(
    @Body() dto: CreateReportDto,
    @Req() req: any,
  ): Promise<ReportResponseDto> {
    return this.reportBuilderService.createReport(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'List of reports',
  })
  async getReports(@Query() query: GetReportsQueryDto): Promise<{
    reports: ReportResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.reportBuilderService.getReports(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single report by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report details',
    type: ReportResponseDto,
  })
  async getReportById(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.reportBuilderService.getReportById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a report definition' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report updated successfully',
    type: ReportResponseDto,
  })
  async updateReport(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportBuilderService.updateReport(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
  })
  async deleteReport(@Param('id') id: string): Promise<{ message: string }> {
    await this.reportBuilderService.deleteReport(id);
    return { message: 'Report deleted successfully' };
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 201,
    description: 'Report generation started',
    type: ReportExecutionResponseDto,
  })
  async generateReport(
    @Param('id') id: string,
    @Body() dto: GenerateReportDto,
  ): Promise<ReportExecutionResponseDto> {
    return this.reportBuilderService.generateReport(id, dto);
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get report executions history' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'List of report executions',
  })
  async getReportExecutions(
    @Param('id') id: string,
    @Query() query: GetExecutionsQueryDto,
  ): Promise<{
    executions: ReportExecutionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.reportBuilderService.getReportExecutions(id, query);
  }

  @Get('executions/:executionId/download')
  @ApiOperation({ summary: 'Download a generated report file' })
  @ApiParam({ name: 'executionId', description: 'Execution ID' })
  @ApiResponse({
    status: 200,
    description: 'Report file download',
  })
  async downloadReport(
    @Param('executionId') executionId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { filePath, filename } = await this.reportBuilderService.downloadReport(executionId);

    // Determine content type based on file extension
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    switch (ext) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'csv':
        contentType = 'text/csv';
        break;
      case 'xlsx':
      case 'xls':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'json':
        contentType = 'application/json';
        break;
    }

    // Set response headers
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Stream the file
    const file = fs.createReadStream(filePath);
    return new StreamableFile(file);
  }
}
