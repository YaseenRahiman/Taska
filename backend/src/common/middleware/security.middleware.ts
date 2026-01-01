import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor() {}

  use(req: Request, res: Response, next: NextFunction) {
    // Add security headers
    this.addSecurityHeaders(res);
    
    // Validate request integrity
    this.validateRequest(req);
    
    // Add request fingerprinting for security tracking
    this.addRequestFingerprint(req);
    
    next();
  }

  private addSecurityHeaders(res: Response) {
    // HSTS (HTTP Strict Transport Security)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );
    
    // Remove server information
    res.removeHeader('X-Powered-By');
  }

  private validateRequest(req: Request) {
    // Check for suspicious patterns
    this.checkSuspiciousPatterns(req);
    
    // Validate content length
    this.validateContentLength(req);
    
    // Check for malicious headers
    this.validateHeaders(req);
  }

  private checkSuspiciousPatterns(req: Request) {
    const suspiciousPatterns = [
      /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/i,
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload|onerror|onclick/gi,
    ];

    const checkString = `${req.url} ${JSON.stringify(req.query)} ${JSON.stringify(req.body || {})}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(checkString)) {
        throw new BadRequestException('Suspicious request pattern detected');
      }
    }
  }

  private validateContentLength(req: Request) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      throw new BadRequestException('Request payload too large');
    }
  }

  private validateHeaders(req: Request) {
    const dangerousHeaders = ['x-forwarded-host', 'x-forwarded-server'];
    
    for (const header of dangerousHeaders) {
      const headerValue = req.headers[header];
      if (headerValue) {
        // Log suspicious activity
        const value = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;
        console.warn(`Suspicious header detected: ${header} = ${value}`);
      }
    }
  }

  private addRequestFingerprint(req: Request) {
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${req.ip}${req.headers['user-agent'] || ''}${Date.now()}`)
      .digest('hex')
      .substring(0, 16);
    
    (req as any).fingerprint = fingerprint;
  }
}

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  private readonly requests = new Map<string, { count: number; resetTime: number }>();

  constructor() {}

  use(req: Request, res: Response, next: NextFunction) {
    // Simple rate limiting configuration
    const rateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
    };

    if (req.path.includes('/auth/')) {
      rateLimitConfig.max = 10; // login attempts per window
    } else if (req.path.includes('/upload')) {
      rateLimitConfig.max = 20; // file uploads per window
    } else if (req.path.includes('/api/')) {
      rateLimitConfig.max = 60; // API calls per minute
      rateLimitConfig.windowMs = 1 * 60 * 1000; // 1 minute
    }

    const key = this.generateKey(req);
    const now = Date.now();
    const windowStart = now - rateLimitConfig.windowMs;
    const requestData = this.requests.get(key);

    if (!requestData || requestData.resetTime < windowStart) {
      // Reset the counter
      this.requests.set(key, { count: 1, resetTime: now + rateLimitConfig.windowMs });
    } else if (requestData.count >= rateLimitConfig.max) {
      // Rate limit exceeded
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
      });
      return;
    } else {
      // Increment counter
      requestData.count++;
    }

    // Add rate limit headers
    const remaining = Math.max(0, rateLimitConfig.max - (requestData?.count || 1));
    res.setHeader('X-RateLimit-Limit', rateLimitConfig.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', new Date(requestData?.resetTime || now).toISOString());

    next();
  }

  private generateKey(req: Request): string {
    // Use IP + user ID (if authenticated) for rate limiting
    const userId = (req as any).user?.sub || 'anonymous';
    return `${req.ip}-${userId}`;
  }

  // Clean up old entries periodically
  private cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime < now) {
        this.requests.delete(key);
      }
    }
  }
}

@Injectable()
export class CSRFProtectionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for API endpoints with proper authentication
    if (req.path.startsWith('/api/') && req.headers.authorization) {
      return next();
    }

    const csrfToken = (req.headers['x-csrf-token'] as string) || req.body._csrf;
    const sessionToken = req.headers['x-session-token'] as string;

    if (!csrfToken || !sessionToken) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'CSRF token required',
      });
      return;
    }

    // Validate CSRF token (in production, use a proper CSRF library)
    if (!this.validateCSRFToken(csrfToken, sessionToken)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid CSRF token',
      });
      return;
    }

    next();
  }

  private validateCSRFToken(csrfToken: string, sessionToken: string): boolean {
    // Simple validation - in production, use a proper CSRF implementation
    const expectedToken = crypto
      .createHmac('sha256', process.env.CSRF_SECRET || 'default-secret')
      .update(sessionToken)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(csrfToken),
      Buffer.from(expectedToken)
    );
  }
}
