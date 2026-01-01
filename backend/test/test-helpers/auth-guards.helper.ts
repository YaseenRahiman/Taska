import { BruteForceGuard } from '../../src/common/guards/brute-force.guard';
import { RateLimitGuard } from '../../src/common/guards/rate-limit.guard';
import { Reflector } from '@nestjs/core';

/**
 * Test Environment Authentication Guard Helpers
 * 
 * Utilities for managing authentication guards in test environments.
 * Provides methods to clear locks, reset state, and verify guard behavior.
 */

export class AuthGuardsTestHelper {
  private static bruteForceGuard: BruteForceGuard | null = null;
  private static rateLimitGuard: RateLimitGuard | null = null;

  /**
   * Initialize guards for testing
   */
  static initializeGuards() {
    this.bruteForceGuard = new BruteForceGuard();
    this.rateLimitGuard = new RateLimitGuard(new Reflector());
  }

  /**
   * Clear all brute force locks
   * Useful between test runs to ensure clean state
   */
  static clearBruteForceLocks(): void {
    if (this.bruteForceGuard) {
      this.bruteForceGuard.clearLocks();
      console.log('[Test Helper] Cleared all brute force locks');
    }
  }

  /**
   * Clear all rate limit locks
   * Useful between test runs to ensure clean state
   */
  static clearRateLimitLocks(): void {
    if (this.rateLimitGuard) {
      this.rateLimitGuard.clearLocks();
      console.log('[Test Helper] Cleared all rate limit locks');
    }
  }

  /**
   * Clear all authentication-related locks
   * Recommended to call this in beforeEach or afterEach hooks
   */
  static clearAllLocks(): void {
    this.clearBruteForceLocks();
    this.clearRateLimitLocks();
    console.log('[Test Helper] Cleared all authentication locks');
  }

  /**
   * Get brute force attempts for an identifier
   */
  static getBruteForceAttempts(email: string, ip: string = 'unknown'): number {
    if (!this.bruteForceGuard) {
      this.initializeGuards();
    }

    const identifier = `${email.toLowerCase()}:${ip}`;
    return this.bruteForceGuard!.getRemainingAttempts(identifier);
  }

  /**
   * Check if identifier is locked
   */
  static isBruteForceLocked(email: string, ip: string = 'unknown'): boolean {
    if (!this.bruteForceGuard) {
      this.initializeGuards();
    }

    const identifier = `${email.toLowerCase()}:${ip}`;
    return this.bruteForceGuard!.isLocked(identifier);
  }

  /**
   * Verify test environment configuration
   * Ensures guards are properly disabled for testing
   */
  static verifyTestEnvironment(): boolean {
    const isTestEnv = process.env.NODE_ENV === 'test';
    const bruteForceDisabled = process.env.DISABLE_BRUTE_FORCE_PROTECTION === 'true';
    const rateLimitDisabled = process.env.DISABLE_RATE_LIMITING === 'true';

    const isConfigured = isTestEnv && bruteForceDisabled && rateLimitDisabled;

    if (!isConfigured) {
      console.warn('[Test Helper] WARNING: Test environment not properly configured!');
      console.warn(`  NODE_ENV: ${process.env.NODE_ENV}`);
      console.warn(`  DISABLE_BRUTE_FORCE_PROTECTION: ${process.env.DISABLE_BRUTE_FORCE_PROTECTION}`);
      console.warn(`  DISABLE_RATE_LIMITING: ${process.env.DISABLE_RATE_LIMITING}`);
    } else {
      console.log('[Test Helper] Test environment properly configured');
    }

    return isConfigured;
  }

  /**
   * Get test user credentials
   * Returns the standard test users that should never be locked out
   */
  static getTestUsers() {
    return {
      client: {
        email: 'client@test.com',
        password: 'password123',
        role: 'CLIENT'
      },
      artisan: {
        email: 'artisan@test.com',
        password: 'password123',
        role: 'ARTISAN'
      },
      admin: {
        email: 'admin@test.com',
        password: 'password123',
        role: 'ADMIN'
      }
    };
  }

  /**
   * Check if email is a protected test user
   */
  static isTestUser(email: string): boolean {
    const testUserEmails = ['client@test.com', 'artisan@test.com', 'admin@test.com', 'test@example.com'];
    return testUserEmails.includes(email.toLowerCase());
  }
}

/**
 * Example Usage in Tests:
 * 
 * beforeAll(async () => {
 *   AuthGuardsTestHelper.verifyTestEnvironment();
 * });
 * 
 * beforeEach(async () => {
 *   AuthGuardsTestHelper.clearAllLocks();
 * });
 * 
 * afterEach(async () => {
 *   AuthGuardsTestHelper.clearAllLocks();
 * });
 */
