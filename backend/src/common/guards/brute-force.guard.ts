import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface BruteForceEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

// In-memory brute force protection storage (replace with Redis in production)
const bruteForceStore = new Map<string, BruteForceEntry>();

// Test user emails that should never be locked out
const TEST_USER_EMAILS = [
  'client@test.com',
  'artisan@test.com',
  'admin@test.com',
  'test@example.com',
];

/**
 * Brute Force Protection Guard
 * Implements account lockout after repeated failed login attempts
 *
 * Configuration:
 * - Max attempts: 5 failed attempts (100 in test mode)
 * - Lockout duration: 30 minutes (1 minute in test mode)
 * - Attempt window: 15 minutes (1 hour in test mode)
 *
 * Test Environment:
 * - Automatically disabled when NODE_ENV=test or DISABLE_BRUTE_FORCE_PROTECTION=true
 * - Test users (client@test.com, artisan@test.com, admin@test.com) are never locked out
 * - Much higher limits and shorter lockout durations for test scenarios
 */
@Injectable()
export class BruteForceGuard implements CanActivate {
  private readonly maxAttempts: number;
  private readonly lockoutDuration: number;
  private readonly attemptWindow: number;
  private readonly isTestMode: boolean;

  constructor() {
    this.isTestMode = process.env.NODE_ENV === 'test' || process.env.DISABLE_BRUTE_FORCE_PROTECTION === 'true';

    // Test mode has much more lenient limits
    this.maxAttempts = this.isTestMode ? 100 : 5;
    this.lockoutDuration = this.isTestMode ? 60 * 1000 : 30 * 60 * 1000; // 1 min vs 30 min
    this.attemptWindow = this.isTestMode ? 60 * 60 * 1000 : 15 * 60 * 1000; // 1 hour vs 15 min
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip brute force protection in test environment
    if (this.isTestMode) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);

    // Never lock out test users
    if (this.isTestUser(request.body?.email)) {
      return true;
    }

    const now = Date.now();
    const entry = bruteForceStore.get(identifier);

    // Check if currently locked
    if (entry?.lockedUntil && entry.lockedUntil > now) {
      const remainingMinutes = Math.ceil((entry.lockedUntil - now) / 60000);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minutes.`,
          lockedUntil: entry.lockedUntil,
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Reset if window has passed
    if (!entry || entry.lastAttempt + this.attemptWindow < now) {
      bruteForceStore.set(identifier, {
        attempts: 0,
        lastAttempt: now,
      });
      return true;
    }

    // Allow the request to proceed (will be checked after authentication attempt)
    return true;
  }

  /**
   * Record a failed login attempt
   * Call this after authentication failure
   */
  recordFailedAttempt(identifier: string, email?: string): void {
    // Never record attempts for test users
    if (email && this.isTestUser(email)) {
      return;
    }

    // Skip recording in test mode
    if (this.isTestMode) {
      return;
    }

    const now = Date.now();
    const entry = bruteForceStore.get(identifier);

    if (!entry || entry.lastAttempt + this.attemptWindow < now) {
      // Start new tracking window
      bruteForceStore.set(identifier, {
        attempts: 1,
        lastAttempt: now,
      });
      return;
    }

    // Increment attempts
    entry.attempts++;
    entry.lastAttempt = now;

    // Lock account if max attempts exceeded
    if (entry.attempts >= this.maxAttempts) {
      entry.lockedUntil = now + this.lockoutDuration;
    }

    bruteForceStore.set(identifier, entry);
  }

  /**
   * Clear failed attempts on successful login
   */
  clearAttempts(identifier: string): void {
    bruteForceStore.delete(identifier);
  }

  /**
   * Get remaining attempts before lockout
   */
  getRemainingAttempts(identifier: string): number {
    const entry = bruteForceStore.get(identifier);

    if (!entry) return this.maxAttempts;

    const now = Date.now();

    // Check if window expired
    if (entry.lastAttempt + this.attemptWindow < now) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - entry.attempts);
  }

  /**
   * Check if identifier is currently locked
   */
  isLocked(identifier: string): boolean {
    const entry = bruteForceStore.get(identifier);

    if (!entry?.lockedUntil) return false;

    const now = Date.now();
    return entry.lockedUntil > now;
  }

  /**
   * Check if email is a test user
   */
  private isTestUser(email?: string): boolean {
    if (!email) return false;

    const normalizedEmail = email.toLowerCase().trim();
    return TEST_USER_EMAILS.includes(normalizedEmail);
  }

  /**
   * Get identifier for brute force protection (email + IP)
   */
  private getIdentifier(request: any): string {
    const email = request.body?.email?.toLowerCase().trim();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';

    return email ? `${email}:${ip}` : ip;
  }

  /**
   * Clear all brute force locks (for testing purposes)
   */
  clearLocks(): void {
    bruteForceStore.clear();
  }

  /**
   * Get all current entries (for debugging)
   */
  getEntries(): Map<string, BruteForceEntry> {
    return new Map(bruteForceStore);
  }
}

/**
 * Cleanup function to remove expired entries
 */
export function cleanupBruteForceStore(): void {
  const now = Date.now();

  for (const [key, entry] of bruteForceStore.entries()) {
    // Remove if:
    // - Lockout expired and attempt window passed
    // - No lockout and attempt window passed
    const lockoutExpired = !entry.lockedUntil || entry.lockedUntil < now;
    const windowExpired = entry.lastAttempt + 15 * 60 * 1000 < now;

    if (lockoutExpired && windowExpired) {
      bruteForceStore.delete(key);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupBruteForceStore, 10 * 60 * 1000);
