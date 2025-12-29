import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly logger: LoggingService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      this.logger.warn('RolesGuard: No user found in request', 'RolesGuard');
      throw new ForbiddenException('Access denied: User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `RolesGuard: User ${user.id} with role ${user.role} attempted to access endpoint requiring roles: ${requiredRoles.join(', ')}`,
        'RolesGuard'
      );
      throw new ForbiddenException(`Access denied: Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
    }

    this.logger.log(
      `RolesGuard: User ${user.id} with role ${user.role} granted access`,
      'RolesGuard'
    );

    return true;
  }
}
