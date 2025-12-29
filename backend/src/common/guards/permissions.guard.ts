import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { LoggingService } from '../logging/logging.service';

export enum Permission {
  // Job permissions
  JOB_CREATE = 'job.create',
  JOB_VIEW_ALL = 'job.view.all',
  JOB_VIEW_OWN = 'job.view.own',
  JOB_EDIT = 'job.edit',
  JOB_DELETE = 'job.delete',
  JOB_COMPLETE = 'job.complete',
  JOB_VERIFY = 'job.verify',

  // Bid permissions
  BID_CREATE = 'bid.create',
  BID_VIEW = 'bid.view',
  BID_ACCEPT = 'bid.accept',
  BID_REJECT = 'bid.reject',

  // Payment permissions
  PAYMENT_MAKE = 'payment.make',
  PAYMENT_RECEIVE = 'payment.receive',
  PAYMENT_REFUND = 'payment.refund',
  PAYMENT_VIEW = 'payment.view',

  // User permissions
  USER_VIEW = 'user.view',
  USER_EDIT = 'user.edit',
  USER_DELETE = 'user.delete',
  USER_BAN = 'user.ban',
  USER_VERIFY = 'user.verify',

  // Admin permissions
  ADMIN_ALL = 'admin.*',
  
  // Dispute permissions
  DISPUTE_CREATE = 'dispute.create',
  DISPUTE_RESOLVE = 'dispute.resolve',
  DISPUTE_VIEW = 'dispute.view',
}

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) => Reflector.createDecorator<Permission[]>()(permissions);

// Permission matrix defining what each role can do
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CLIENT]: [
    Permission.JOB_CREATE,
    Permission.JOB_VIEW_OWN,
    Permission.JOB_EDIT,
    Permission.JOB_DELETE,
    Permission.BID_VIEW,
    Permission.BID_ACCEPT,
    Permission.BID_REJECT,
    Permission.PAYMENT_MAKE,
    Permission.PAYMENT_VIEW,
    Permission.USER_VIEW,
    Permission.USER_EDIT,
    Permission.DISPUTE_CREATE,
  ],
  [UserRole.ARTISAN]: [
    Permission.JOB_VIEW_ALL,
    Permission.JOB_COMPLETE,
    Permission.BID_CREATE,
    Permission.BID_VIEW,
    Permission.PAYMENT_RECEIVE,
    Permission.PAYMENT_VIEW,
    Permission.USER_VIEW,
    Permission.USER_EDIT,
    Permission.DISPUTE_CREATE,
  ],
  [UserRole.ADMIN]: [
    Permission.ADMIN_ALL,
    Permission.JOB_VIEW_ALL,
    Permission.JOB_VERIFY,
    Permission.JOB_DELETE,
    Permission.BID_VIEW,
    Permission.PAYMENT_VIEW,
    Permission.PAYMENT_REFUND,
    Permission.USER_VIEW,
    Permission.USER_EDIT,
    Permission.USER_DELETE,
    Permission.USER_BAN,
    Permission.USER_VERIFY,
    Permission.DISPUTE_VIEW,
    Permission.DISPUTE_RESOLVE,
  ],
  [UserRole.ASSESSOR]: [
    Permission.JOB_VIEW_ALL,
    Permission.JOB_VERIFY,
    Permission.BID_VIEW,
    Permission.USER_VIEW,
    Permission.DISPUTE_VIEW,
    Permission.DISPUTE_RESOLVE,
  ],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly logger: LoggingService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      this.logger.warn('PermissionsGuard: No user found in request', 'PermissionsGuard');
      throw new ForbiddenException('Access denied: User not authenticated');
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Check if user has admin wildcard permission
    if (userPermissions.includes(Permission.ADMIN_ALL)) {
      this.logger.log(
        `PermissionsGuard: Admin user ${user.id} granted access with wildcard permission`,
        'PermissionsGuard'
      );
      return true;
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(permission =>
        !userPermissions.includes(permission)
      );
      
      this.logger.warn(
        `PermissionsGuard: User ${user.id} with role ${user.role} missing permissions: ${missingPermissions.join(', ')}`,
        'PermissionsGuard'
      );
      
      throw new ForbiddenException(
        `Access denied: Missing required permissions: ${missingPermissions.join(', ')}`
      );
    }

    this.logger.log(
      `PermissionsGuard: User ${user.id} with role ${user.role} granted access with permissions: ${requiredPermissions.join(', ')}`,
      'PermissionsGuard'
    );

    return true;
  }

  /**
   * Get permissions for a specific role
   */
  static getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permission) || rolePermissions.includes(Permission.ADMIN_ALL);
  }
}
