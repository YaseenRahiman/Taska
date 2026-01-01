import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogService } from '../services/audit-log.service';
import { Reflector } from '@nestjs/core';

/**
 * Decorator to mark methods for audit logging
 * Usage: @AuditLog('USER_BAN', 'USER')
 */
export const AUDIT_LOG_KEY = 'audit_log';
export const AuditLog = (action: string, entityType: string) =>
  Reflect.metadata(AUDIT_LOG_KEY, { action, entityType });

/**
 * Interceptor to automatically log admin actions
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<{
      action: string;
      entityType: string;
    }>(AUDIT_LOG_KEY, context.getHandler());

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { action, entityType } = auditMetadata;

    const adminId = request.user?.userId;
    if (!adminId) {
      this.logger.warn('No admin user found in request, skipping audit log');
      return next.handle();
    }

    const ipAddress = this.extractIp(request);
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const entityId = this.extractEntityId(request);
    const reason = request.body?.reason;
    const beforeState = request.auditBeforeState; // Can be set by controller

    return next.handle().pipe(
      tap((data) => {
        const afterState = this.extractAfterState(data);

        this.auditLogService
          .createAuditLog({
            adminId,
            action: action as any,
            entityType: entityType as any,
            entityId: entityId || 'unknown',
            beforeState,
            afterState,
            reason,
            ipAddress,
            userAgent,
            success: true,
          })
          .catch((error) => {
            this.logger.error('Failed to create audit log:', error);
          });
      }),
      catchError((error) => {
        this.auditLogService
          .createAuditLog({
            adminId,
            action: action as any,
            entityType: entityType as any,
            entityId: entityId || 'unknown',
            beforeState,
            afterState: null,
            reason,
            ipAddress,
            userAgent,
            success: false,
            errorMessage: error.message,
          })
          .catch((logError) => {
            this.logger.error('Failed to create error audit log:', logError);
          });

        return throwError(() => error);
      }),
    );
  }

  /**
   * Extract IP address from request
   */
  private extractIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'Unknown'
    );
  }

  /**
   * Extract entity ID from request
   */
  private extractEntityId(request: any): string | null {
    return (
      request.params?.id ||
      request.params?.userId ||
      request.params?.jobId ||
      request.params?.bidId ||
      request.params?.paymentId ||
      request.params?.reviewId ||
      request.body?.id ||
      request.body?.userId ||
      null
    );
  }

  /**
   * Extract after state from response data
   */
  private extractAfterState(data: any): any {
    if (!data) return null;

    if (data.id) {
      return {
        id: data.id,
        status: data.status,
        ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
        ...(data.role && { role: data.role }),
      };
    }

    return null;
  }
}
