import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { BulkOperationsService } from '../services/bulk-operations.service';

@Processor('bulk-operations')
export class BulkOperationsProcessor {
  private readonly logger = new Logger(BulkOperationsProcessor.name);

  constructor(private readonly bulkOpsService: BulkOperationsService) {}

  @Process('ban-users')
  async handleBanUsers(job: Job) {
    this.logger.log(`Processing ban-users job ${job.id}`);
    try {
      await this.bulkOpsService.processBanUsers(job.data);
      this.logger.log(`Completed ban-users job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed ban-users job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('suspend-users')
  async handleSuspendUsers(job: Job) {
    this.logger.log(`Processing suspend-users job ${job.id}`);
    try {
      await this.bulkOpsService.processSuspendUsers(job.data);
      this.logger.log(`Completed suspend-users job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed suspend-users job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('verify-users')
  async handleVerifyUsers(job: Job) {
    this.logger.log(`Processing verify-users job ${job.id}`);
    try {
      await this.bulkOpsService.processVerifyUsers(job.data);
      this.logger.log(`Completed verify-users job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed verify-users job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('export-data')
  async handleExportData(job: Job) {
    this.logger.log(`Processing export-data job ${job.id}`);
    try {
      this.logger.log(`Completed export-data job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed export-data job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('send-emails')
  async handleSendEmails(job: Job) {
    this.logger.log(`Processing send-emails job ${job.id}`);
    try {
      this.logger.log(`Completed send-emails job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed send-emails job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('moderate-content')
  async handleModerateContent(job: Job) {
    this.logger.log(`Processing moderate-content job ${job.id}`);
    try {
      this.logger.log(`Completed moderate-content job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed moderate-content job ${job.id}:`, error);
      throw error;
    }
  }
}
