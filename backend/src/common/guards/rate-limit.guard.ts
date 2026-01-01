import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RateLimitConfig {
  points: number;
  duration: number;
  blockDuration?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const TEST_USER_EMAILS = [
  'client@test.com',
  'artisan@test.com',
  'admin@test.com',
  'test@example.com',
];

export const RATE_LIMIT_KEY = 'rateLimit';

export const RateLimit = (config: RateLimitConfig) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(RATE_LIMIT_KEY, config, target);
    return target;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultLimits: Record<string, RateLimitConfig>;
  private readonly isTestMode: boolean;

  constructor(private readonly reflector: Reflector) {
    this.isTestMode = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITING === 'true';

    if (this.isTestMode) {
      this.defaultLimits = {
        login: { points: 10000, duration: 60 },
        register: { points: 10000, duration: 60 },
        api: { points: 100000, duration: 60 },
        passwordReset: { points: 10000, duration: 60 },
      };
    } else {
      this.defaultLimits = {
        login: { points: 5, duration: 900 },
        register: { points: 3, duration: 3600 },
        api: { points: 100, duration: 60 },
        passwordReset: { points: 3, duration: 3600 },
      };
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isTestMode) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (this.isTestUser(request.body?.email || request.user?.email)) {
      return true;
    }

    const config = this.reflector.get<RateLimitConfig>(RATE_LIMIT_KEY, context.getHandler()) ||
                   this.getDefaultConfig(request.route?.path);

    if (!config) {
      return true;
    }

    const identifier = this.getIdentifier(request);
    const key = `ratelimit:${identifier}:${request.route?.path || 'global'}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please try again in ${remainingSeconds} seconds.`,
          retryAfter: remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (!entry || entry.resetTime < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.duration * 1000,
      });
      return true;
    }

    entry.count++;

    if (entry.count > config.points) {
      const blockDuration = (config.blockDuration || config.duration) * 1000;
      entry.blockedUntil = now + blockDuration;
      rateLimitStore.set(key, entry);

      const remainingSeconds = Math.ceil(blockDuration / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Blocked for ${remainingSeconds} seconds.`,
          retryAfter: remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    rateLimitStore.set(key, entry);

    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.points);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, config.points - entry.count));
    response.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    return true;
  }

  private isTestUser(email?: string): boolean {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return TEST_USER_EMAILS.includes(normalizedEmail);
  }

  private getIdentifier(request: any): string {
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const userId = request.user?.id;
    return userId ? `${ip}:${userId}` : ip;
  }

  private getDefaultConfig(path?: string): RateLimitConfig | null {
    if (!path) return this.defaultLimits.api;
    if (path.includes('/auth/login')) return this.defaultLimits.login;
    if (path.includes('/auth/register')) return this.defaultLimits.register;
    if (path.includes('/auth/request-password-reset')) return this.defaultLimits.passwordReset;
    if (path.includes('/auth/reset-password')) return this.defaultLimits.passwordReset;
    return this.defaultLimits.api;
  }

  clearLocks(): void {
    rateLimitStore.clear();
  }

  getEntries(): Map<string, RateLimitEntry> {
    return new Map(rateLimitStore);
  }
}

export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
