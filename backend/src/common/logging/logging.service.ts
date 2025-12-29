import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import * as winston from 'winston';
import { Request, Response } from 'express';

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, stack, context, requestId, ...meta }) => {
          const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            context: context || 'Application',
            requestId,
            message,
            ...(stack && { stack }),
            ...(Object.keys(meta).length > 0 && { meta }),
          };
          return JSON.stringify(logEntry);
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(({ timestamp, level, message, context, requestId }) => {
              const prefix = requestId ? `[${requestId}]` : '';
              return `${timestamp} ${level} ${prefix} [${context || 'Application'}] ${message}`;
            })
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        }),
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: 'logs/exceptions.log',
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: 'logs/rejections.log',
        }),
      ],
      exitOnError: false,
    });
  }

  log(message: any, context?: string, requestId?: string) {
    this.logger.info(message, { context, requestId });
  }

  error(message: any, stack?: string, context?: string, requestId?: string) {
    this.logger.error(message, { stack, context, requestId });
  }

  warn(message: any, context?: string, requestId?: string) {
    this.logger.warn(message, { context, requestId });
  }

  debug(message: any, context?: string, requestId?: string) {
    this.logger.debug(message, { context, requestId });
  }

  verbose(message: any, context?: string, requestId?: string) {
    this.logger.verbose(message, { context, requestId });
  }

  info(message: any, context?: string, requestId?: string) {
    this.logger.info(message, { context, requestId });
  }

  // HTTP request logging
  logHttpRequest(req: Request, res: Response, responseTime: number) {
    const { method, originalUrl, ip, headers } = req;
    const { statusCode } = res;
    const userAgent = headers['user-agent'] || '';
    const requestId = req.headers['x-request-id'] as string;

    const logData = {
      method,
      url: originalUrl,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip,
      userAgent,
      requestId,
    };

    if (statusCode >= 400) {
      this.error('HTTP Error', JSON.stringify(logData), 'HTTP', requestId);
    } else {
      this.log(`${method} ${originalUrl} ${statusCode} ${responseTime}ms`, 'HTTP', requestId);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, requestId?: string) {
    this.debug(
      `DB ${operation} on ${table} completed in ${duration}ms`,
      'Database',
      requestId
    );
  }

  // Business logic logging
  logBusinessEvent(event: string, data: any, userId?: string, requestId?: string) {
    this.log(
      `Business Event: ${event}`,
      'Business',
      requestId,
    );
    this.debug('Event Data', 'Business', requestId);
  }

  // Security event logging
  logSecurityEvent(event: string, ip: string, userAgent: string, userId?: string, requestId?: string) {
    this.warn(
      `Security Event: ${event} from IP: ${ip}`,
      'Security',
      requestId
    );
    this.debug(`Security Event Details: ${JSON.stringify({
      event,
      ip,
      userAgent,
      userId,
      requestId,
      timestamp: new Date().toISOString(),
    })}`, 'Security');
  }

  // Performance monitoring
  logPerformance(operation: string, duration: number, threshold: number = 1000, requestId?: string) {
    if (duration > threshold) {
      this.warn(
        `Slow Operation: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
        'Performance',
        requestId
      );
    } else {
      this.debug(
        `Operation: ${operation} completed in ${duration}ms`,
        'Performance',
        requestId
      );
    }
  }
}
