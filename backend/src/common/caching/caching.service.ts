import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoggingService } from '../logging/logging.service';

export interface CacheOptions {
  ttl?: number; // time to live in seconds
  key?: string;
  tags?: string[];
}

@Injectable()
export class CachingService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Get cached value by key
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const start = Date.now();
      const value = await this.cacheManager.get<T>(key);
      const duration = Date.now() - start;

      this.logger.debug(`Cache get operation: ${key} (${!!value ? 'HIT' : 'MISS'}) in ${duration}ms`, 'Cache');

      return value;
    } catch (error) {
      this.logger.error(`Cache get error for key: ${key}`, error.stack, 'Cache');
      return undefined;
    }
  }

  /**
   * Set cached value with optional TTL
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const start = Date.now();
      const ttl = options?.ttl ? options.ttl * 1000 : undefined; // Convert to milliseconds

      await this.cacheManager.set(key, value, ttl);
      const duration = Date.now() - start;

      this.logger.debug(`Cache set operation: ${key} (TTL: ${options?.ttl}s) in ${duration}ms`, 'Cache');
    } catch (error) {
      this.logger.error(`Cache set error for key: ${key}`, error.stack, 'Cache');
    }
  }

  /**
   * Delete cached value by key
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache delete operation: ${key}`, 'Cache');
    } catch (error) {
      this.logger.error(`Cache delete error for key: ${key}`, error.stack, 'Cache');
    }
  }

  /**
   * Get or set pattern - retrieve from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    let cached = await this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    const start = Date.now();
    const value = await factory();
    const duration = Date.now() - start;

    this.logger.debug(`Cache miss - executed factory function for key: ${key} in ${duration}ms`, 'Cache');

    await this.set(key, value, options);
    return value;
  }

  /**
   * Clear cache by pattern (Redis specific)
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      // Note: This requires Redis and won't work with in-memory cache
      const keys = await this.getKeysByPattern(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.del(key)));
        this.logger.log(`Cleared cache pattern: ${pattern} (${keys.length} keys cleared)`, 'Cache');
      }
    } catch (error) {
      this.logger.error(`Cache clear pattern error for pattern: ${pattern}`, error.stack, 'Cache');
    }
  }

  /**
   * Generate cache key with prefix
   */
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Generate cache key for user-specific data
   */
  generateUserKey(userId: string, resource: string, ...parts: (string | number)[]): string {
    return this.generateKey('user', userId, resource, ...parts);
  }

  /**
   * Generate cache key for job-specific data
   */
  generateJobKey(jobId: string, resource: string, ...parts: (string | number)[]): string {
    return this.generateKey('job', jobId, resource, ...parts);
  }

  private async getKeysByPattern(pattern: string): Promise<string[]> {
    // This is a simplified implementation
    // In real Redis implementation, you'd use SCAN command
    try {
      // For now, return empty array as we can't easily list all keys
      // In production, you'd implement proper Redis SCAN operation
      return [];
    } catch (error) {
      this.logger.error(`Error getting keys by pattern: ${pattern}`, error.stack, 'Cache');
      return [];
    }
  }
}
