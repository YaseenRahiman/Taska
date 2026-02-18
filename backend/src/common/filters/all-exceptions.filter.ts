import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from '../logging/logging.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  details?: any;
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggingService,
    private readonly prisma: PrismaService,
  ) {}

  private async notifyAdmin(
    statusCode: number,
    method: string,
    url: string,
    message: string,
    userId?: string,
  ): Promise<void> {
    try {
      // Only notify for 5xx server errors or significant 4xx errors (400, 401, 403 are routine; 422, 429, etc. may warrant notification)
      if (statusCode < 500) return;

      // Find admin users to notify
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (admins.length === 0) return;

      const shortPath = url.length > 80 ? url.substring(0, 77) + '...' : url;

      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: `Server Error ${statusCode}`,
          message: `${method} ${shortPath}: ${message}`,
          isRead: false,
          data: {
            statusCode,
            method,
            path: url,
            errorMessage: message,
            affectedUserId: userId || null,
            timestamp: new Date().toISOString(),
          },
        })),
        skipDuplicates: false,
      });
    } catch {
      // Don't let notification failures cascade into more errors
    }
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = undefined;

    // Handle different exception types
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;
        message = response.message || exception.message;
        error = response.error || exception.name;
        details = response.details;
      }
    } else if (exception instanceof Error) {
      error = exception.name;

      // Sanitize Prisma errors - never expose schema internals to clients
      if (
        exception.name === 'PrismaClientValidationError' ||
        exception.name === 'PrismaClientKnownRequestError' ||
        exception.name === 'PrismaClientUnknownRequestError' ||
        exception.name === 'PrismaClientRustPanicError' ||
        exception.name === 'PrismaClientInitializationError'
      ) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'A database error occurred. Please try again later.';
        error = 'Internal Server Error';
      } else {
        message = exception.message;

        // Handle specific error types
        if (exception.name === 'ValidationError') {
          status = HttpStatus.BAD_REQUEST;
          error = 'Validation Error';
        } else if (exception.name === 'UnauthorizedError') {
          status = HttpStatus.UNAUTHORIZED;
          error = 'Unauthorized';
        } else if (exception.name === 'ForbiddenError') {
          status = HttpStatus.FORBIDDEN;
          error = 'Forbidden';
        } else if (exception.name === 'NotFoundError') {
          status = HttpStatus.NOT_FOUND;
          error = 'Not Found';
        }
      }
    }

    // Prepare error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      requestId,
    };

    // Add details only in development or for validation errors
    if (details || (process.env.NODE_ENV === 'development' && exception instanceof Error)) {
      errorResponse.details = details || {
        stack: process.env.NODE_ENV === 'development' ? (exception as Error).stack : undefined,
      };
    }

    // Log the error with appropriate level
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
        'ExceptionFilter',
        requestId
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
        'ExceptionFilter',
        requestId
      );
    }

    // Log security events for authentication/authorization errors
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.logSecurityEvent(
        `${status === HttpStatus.UNAUTHORIZED ? 'Unauthorized' : 'Forbidden'} access attempt`,
        request.ip,
        request.headers['user-agent'] || 'Unknown',
        (request as any).user?.id,
        requestId
      );
    }

    // Create admin notification for server errors (5xx)
    if (status >= 500) {
      void this.notifyAdmin(
        status,
        request.method,
        request.url,
        message,
        (request as any).user?.id,
      );
    }

    response.status(status).json(errorResponse);
  }
}
