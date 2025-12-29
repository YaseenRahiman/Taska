import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { BulkOperationsService } from '../services/bulk-operations.service';
import {
  BulkUserBanDto,
  BulkUserSuspendDto,
  BulkUserVerifyDto,
  BulkExportDto,
  BulkEmailSendDto,
  BulkContentModerateDto,
  BulkOperationStatusDto,
  BulkOperationQueryDto,
} from '../dto/bulk-operations.dto';

@ApiTags('Admin - Bulk Operations')
@Controller('admin/bulk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class BulkOperationsController {
  constructor(private readonly bulkOpsService: BulkOperationsService) {}

  @Post('users/ban')
  @ApiOperation({ summary: 'Ban multiple users' })
  @ApiResponse({
    status: 201,
    description: 'Bulk ban operation created',
    type: BulkOperationStatusDto,
  })
  async banUsers(
    @Body() dto: BulkUserBanDto,
    @Req() req: any,
  ): Promise<BulkOperationStatusDto> {
    return this.bulkOpsService.banUsers(dto, req.user.userId);
  }

  @Post('users/suspend')
  @ApiOperation({ summary: 'Suspend multiple users' })
  @ApiResponse({
    status: 201,
    description: 'Bulk suspend operation created',
    type: BulkOperationStatusDto,
  })
  async suspendUsers(
    @Body() dto: BulkUserSuspendDto,
    @Req() req: any,
  ): Promise<BulkOperationStatusDto> {
    return this.bulkOpsService.suspendUsers(dto, req.user.userId);
  }

  @Post('users/verify')
  @ApiOperation({ summary: 'Verify multiple artisans' })
  @ApiResponse({
    status: 201,
    description: 'Bulk verify operation created',
    type: BulkOperationStatusDto,
  })
  async verifyUsers(
    @Body() dto: BulkUserVerifyDto,
    @Req() req: any,
  ): Promise<BulkOperationStatusDto> {
    return this.bulkOpsService.verifyUsers(dto, req.user.userId);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export data to CSV' })
  @ApiResponse({
    status: 201,
    description: 'Export operation created',
    type: BulkOperationStatusDto,
  })
  async exportData(
    @Body() dto: BulkExportDto,
    @Req() req: any,
  ): Promise<BulkOperationStatusDto> {
    return this.bulkOpsService.exportData(dto, req.user.userId);
  }

  @Post('email/send')
  @ApiOperation({ summary: 'Send bulk emails' })
  @ApiResponse({
    status: 201,
    description: 'Bulk email operation created',
    type: BulkOperationStatusDto,
  })
  async sendBulkEmail(
    @Body() dto: BulkEmailSendDto,
    @Req() req: any,
  ): Promise<BulkOperationStatusDto> {
    return this.bulkOpsService.sendBulkEmail(dto, req.user.userId);
  }

  @Post('content/moderate')
  @ApiOperation({ summary: 'Moderate content in bulk' })
  @ApiResponse({
    status: 201,
    description: 'Bulk moderation operation created',
    type: BulkOperationStatusDto,
  })
  async moderateContent(
    @Body() dto: BulkContentModerateDto,
    @Req() req: any,
  ): Promise<BulkOperationStatusDto> {
    return this.bulkOpsService.moderateContent(dto, req.user.userId);
  }

  @Get('operations')
  @ApiOperation({ summary: 'List all bulk operations' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by operation type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of bulk operations',
  })
  async listOperations(
    @Query() query: BulkOperationQueryDto,
    @Req() req: any,
  ): Promise<any> {
    return this.bulkOpsService.listOperations(query, req.user.userId);
  }

  @Get('operations/:id')
  @ApiOperation({ summary: 'Get bulk operation status' })
  @ApiParam({ name: 'id', description: 'Operation ID' })
  @ApiResponse({
    status: 200,
    description: 'Operation status',
    type: BulkOperationStatusDto,
  })
  async getOperationStatus(@Param('id') id: string): Promise<BulkOperationStatusDto> {
    return this.bulkOpsService.getOperationStatus(id);
  }

  @Delete('operations/:id')
  @ApiOperation({ summary: 'Cancel a bulk operation' })
  @ApiParam({ name: 'id', description: 'Operation ID' })
  @ApiResponse({
    status: 200,
    description: 'Operation cancelled',
    type: BulkOperationStatusDto,
  })
  async cancelOperation(@Param('id') id: string): Promise<BulkOperationStatusDto> {
    return this.bulkOpsService.cancelOperation(id);
  }
}
