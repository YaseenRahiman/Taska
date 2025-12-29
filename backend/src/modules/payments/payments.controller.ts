import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService, PaymentIntent, PaymentResponse } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @ApiOperation({ summary: 'Create payment intent for a job' })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        clientSecret: { type: 'string' },
        paymentUrl: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Roles('CLIENT', 'ADMIN')
  async createPaymentIntent(
    @CurrentUser() user: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentIntent> {
    return this.paymentsService.createPaymentIntent(user.userId, createPaymentDto);
  }

  @Post('process-success')
  @ApiOperation({ summary: 'Process successful payment (webhook/callback)' })
  @ApiResponse({
    status: 200,
    description: 'Payment processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async processSuccessfulPayment(
    @Body() body: { paymentId: string; providerTxnId: string },
  ): Promise<PaymentResponse> {
    const { paymentId, providerTxnId } = body;
    
    if (!paymentId || !providerTxnId) {
      throw new BadRequestException('Payment ID and provider transaction ID are required');
    }

    return this.paymentsService.processSuccessfulPayment(paymentId, providerTxnId);
  }

  @Post('process-failure')
  @ApiOperation({ summary: 'Process failed payment (webhook/callback)' })
  @ApiResponse({
    status: 200,
    description: 'Payment failure processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async processFailedPayment(
    @Body() body: { paymentId: string; failureReason: string },
  ): Promise<{ success: boolean }> {
    const { paymentId, failureReason } = body;
    
    if (!paymentId || !failureReason) {
      throw new BadRequestException('Payment ID and failure reason are required');
    }

    const success = await this.paymentsService.processFailedPayment(paymentId, failureReason);
    return { success };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({
    status: 200,
    description: 'Payment details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: any,
  ): Promise<PaymentResponse | null> {
    return this.paymentsService.getPayment(paymentId, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user payments with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              jobId: { type: 'string' },
              amount: { type: 'number' },
              totalAmount: { type: 'number' },
              platformFee: { type: 'number' },
              vatAmount: { type: 'number' },
              status: { type: 'string' },
              providerTxnId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        totalCount: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async getUserPayments(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: 'sent' | 'received' | 'all',
  ) {
    return this.paymentsService.getUserPayments(
      user.userId,
      page || 1,
      limit || 20,
      type || 'all',
    );
  }

  @Patch(':id/release')
  @ApiOperation({ summary: 'Release payment to artisan (admin/auto)' })
  @ApiResponse({
    status: 200,
    description: 'Payment released successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Cannot release payment' })
  @Roles('ADMIN', 'CLIENT')
  async releasePayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean }> {
    const success = await this.paymentsService.releasePayment(paymentId, user.userId);
    return { success };
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: 'Refund payment to client (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Payment refunded successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Cannot refund payment' })
  @Roles('ADMIN')
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() body: { refundReason: string },
    @CurrentUser() user: any,
  ): Promise<{ success: boolean }> {
    const { refundReason } = body;
    
    if (!refundReason) {
      throw new BadRequestException('Refund reason is required');
    }

    const success = await this.paymentsService.refundPayment(
      paymentId,
      refundReason,
      user.userId,
    );
    return { success };
  }

  @Get('statistics/overview')
  @ApiOperation({ summary: 'Get payment statistics (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Payment statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalPayments: { type: 'number' },
        totalVolume: { type: 'number' },
        completedPayments: { type: 'number' },
        pendingPayments: { type: 'number' },
        refundedPayments: { type: 'number' },
        averagePaymentAmount: { type: 'number' },
        platformFeesCollected: { type: 'number' },
        vatCollected: { type: 'number' },
      },
    },
  })
  @Roles('ADMIN')
  async getPaymentStatistics() {
    return this.paymentsService.getPaymentStatistics();
  }

  // Webhook endpoints for payment providers
  @Post('webhooks/stripe')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleStripeWebhook(
    @Request() req: any,
    @Body() body: any,
  ): Promise<{ received: boolean }> {
    // Note: In production, this would need proper webhook signature verification
    // and more sophisticated webhook handling based on event types
    
    try {
      const signature = req.headers['stripe-signature'];
      
      // For now, just acknowledge receipt
      // In a full implementation, you would:
      // 1. Verify the webhook signature
      // 2. Parse the event type
      // 3. Handle different event types (payment_intent.succeeded, payment_intent.payment_failed, etc.)
      // 4. Update payment status accordingly
      
      return { received: true };
    } catch (error) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  @Post('webhooks/payfast')
  @ApiOperation({ summary: 'PayFast webhook endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handlePayFastWebhook(
    @Body() notification: any,
  ): Promise<{ received: boolean }> {
    try {
      // In a full implementation, you would:
      // 1. Validate the PayFast notification signature
      // 2. Process the payment status update
      // 3. Update the payment record accordingly
      
      return { received: true };
    } catch (error) {
      throw new BadRequestException('Invalid PayFast notification');
    }
  }
}
