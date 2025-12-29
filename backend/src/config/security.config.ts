import { ConfigService } from '@nestjs/config';

export class SecurityConfig {
  constructor(private configService: ConfigService) {}

  /**
   * Get encryption configuration
   */
  getEncryptionConfig() {
    return {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      messageEncryptionKey: this.configService.get<string>('MESSAGE_ENCRYPTION_KEY'),
      databaseEncryptionKey: this.configService.get<string>('DATABASE_ENCRYPTION_KEY'),
    };
  }

  /**
   * Get password security configuration
   */
  getPasswordConfig() {
    return {
      saltRounds: 12,
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5, // Prevent reusing last 5 passwords
    };
  }

  /**
   * Get session security configuration
   */
  getSessionConfig() {
    return {
      maxSessions: 5, // Maximum concurrent sessions per user
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxFailedAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
    };
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig() {
    return {
      global: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // requests per window
      },
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // login attempts per window
      },
      api: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 60, // API calls per minute
      },
      upload: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 20, // file uploads per window
      },
    };
  }

  /**
   * Get CORS configuration
   */
  getCorsConfig() {
    const allowedOrigins = this.configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [
      'http://localhost:3000',
      'https://taska.co.za',
      'https://www.taska.co.za',
    ];

    return {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-ID',
        'X-API-Version',
        'X-Forwarded-For',
      ],
      exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
    };
  }

  /**
   * Get Content Security Policy configuration
   */
  getCSPConfig() {
    return {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'strict-dynamic'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'https://api.stripe.com', 'wss:'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    };
  }

  /**
   * Get security headers configuration
   */
  getSecurityHeaders() {
    return {
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permittedCrossDomainPolicies: false,
    };
  }

  /**
   * Get file upload security configuration
   */
  getFileUploadConfig() {
    return {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      maxFiles: 10,
      quarantineEnabled: true,
      virusScanEnabled: true,
    };
  }

  /**
   * Get logging security configuration
   */
  getLoggingConfig() {
    return {
      logLevel: this.configService.get<string>('LOG_LEVEL') || 'info',
      sensitiveFields: [
        'password',
        'passwordHash',
        'token',
        'refreshToken',
        'bankAccount',
        'idNumber',
        'phoneNumber',
        'email',
      ],
      maxLogFileSize: 10 * 1024 * 1024, // 10MB
      maxLogFiles: 10,
      retentionDays: 90,
    };
  }

  /**
   * Get compliance configuration (GDPR/POPIA)
   */
  getComplianceConfig() {
    return {
      dataRetentionDays: 2555, // 7 years for financial records
      userDataRetentionDays: 365, // 1 year for inactive users
      logRetentionDays: 90,
      automaticDeletion: true,
      consentRequired: true,
      rightToBeForgetton: true,
      dataPortability: true,
    };
  }

  /**
   * Get monitoring and alerting configuration
   */
  getMonitoringConfig() {
    return {
      enableSecurityAlerts: true,
      alertThresholds: {
        failedLogins: 10, // Alert after 10 failed logins in 5 minutes
        suspiciousActivity: 5, // Alert after 5 suspicious activities
        dataBreachIndicators: 1, // Immediate alert
      },
      webhookUrls: {
        security: this.configService.get<string>('SECURITY_WEBHOOK_URL'),
        performance: this.configService.get<string>('PERFORMANCE_WEBHOOK_URL'),
      },
    };
  }
}
