import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SubscriptionService } from '../services/subscription.service';
import {
  SubscribeDto,
  CancelSubscriptionDto,
  UpdatePlanDto,
} from '../dto/subscription.dto';
import { UserRole } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Get all available subscription plans
   */
  @Get('plans')
  async getPlans() {
    const plans = await this.subscriptionService.getPlans();
    return {
      success: true,
      data: plans,
    };
  }

  /**
   * Get current user's subscription info
   */
  @Get('current')
  async getCurrentSubscription(@CurrentUser() user: AuthUser) {
    const info = await this.subscriptionService.getSubscriptionInfo(user.id);
    return {
      success: true,
      data: info,
    };
  }

  /**
   * Get current usage limits and stats
   */
  @Get('usage')
  async getUsage(@CurrentUser() user: AuthUser) {
    const usage = await this.subscriptionService.getUsageLimits(user.id);
    return {
      success: true,
      data: usage,
    };
  }

  /**
   * Get usage history
   */
  @Get('usage/history')
  async getUsageHistory(@CurrentUser() user: AuthUser) {
    const history = await this.subscriptionService.getUsageHistory(user.id);
    return {
      success: true,
      data: history,
    };
  }

  /**
   * Check if user can post a job
   */
  @Get('can-post-job')
  async canPostJob(@CurrentUser() user: AuthUser) {
    const result = await this.subscriptionService.canPostJob(user.id);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Check if user can place a bid
   */
  @Get('can-place-bid')
  async canPlaceBid(@CurrentUser() user: AuthUser) {
    const result = await this.subscriptionService.canPlaceBid(user.id);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Subscribe to a plan
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeDto) {
    const subscription = await this.subscriptionService.subscribe(
      user.id,
      dto.planId,
      dto.billingCycle,
    );
    return {
      success: true,
      message: `Successfully subscribed to ${subscription.plan.displayName}`,
      data: subscription,
    };
  }

  /**
   * Cancel subscription
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(
    @CurrentUser() user: AuthUser,
    @Body() dto: CancelSubscriptionDto,
  ) {
    const subscription = await this.subscriptionService.cancelSubscription(
      user.id,
      dto.cancelAtPeriodEnd,
    );
    return {
      success: true,
      message: dto.cancelAtPeriodEnd
        ? 'Subscription will be cancelled at the end of the current period'
        : 'Subscription cancelled immediately',
      data: subscription,
    };
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Admin: Get subscription statistics
   */
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats() {
    const stats = await this.subscriptionService.getSubscriptionStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Admin: Update a subscription plan
   */
  @Patch('admin/plans/:planId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePlan(@Param('planId') planId: string, @Body() dto: UpdatePlanDto) {
    const plan = await this.subscriptionService.updatePlan(planId, dto);
    return {
      success: true,
      message: 'Plan updated successfully',
      data: plan,
    };
  }

  /**
   * Admin: Initialize default plans (one-time setup)
   */
  @Post('admin/initialize-plans')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async initializePlans() {
    await this.subscriptionService.initializeDefaultPlans();
    return {
      success: true,
      message: 'Default plans initialized',
    };
  }
}
