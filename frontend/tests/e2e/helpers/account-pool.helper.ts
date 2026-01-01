import { Page } from '@playwright/test';
import axios from 'axios';

/**
 * Account Pool Helper
 * Manages a pool of test accounts to prevent brute-force lockouts
 * and ensure proper test isolation
 */

export interface TestAccount {
  email: string;
  password: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN';
  firstName: string;
  lastName: string;
  phoneNumber: string;
  inUse: boolean;
  locked: boolean;
  failedAttempts: number;
  lastUsed?: Date;
  createdAt?: Date;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class AccountPoolManager {
  private pool: Map<string, TestAccount> = new Map();
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate unique test account credentials
   */
  private generateAccount(role: 'CLIENT' | 'ARTISAN' | 'ADMIN', index: number): TestAccount {
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);

    return {
      email: `test.${role.toLowerCase()}.${index}.${timestamp}.${randomId}@playwright.test`,
      password: 'SecureTestPass123!@#',
      role,
      firstName: 'Test',
      lastName: `${role} ${index}`,
      phoneNumber: `+2782${String(timestamp).slice(-8)}`,
      inUse: false,
      locked: false,
      failedAttempts: 0,
      createdAt: new Date()
    };
  }

  /**
   * Initialize account pool with pre-created accounts
   */
  async initializePool(counts: { CLIENT: number; ARTISAN: number; ADMIN: number }): Promise<void> {
    console.log('Initializing account pool...');

    for (const [role, count] of Object.entries(counts)) {
      for (let i = 0; i < count; i++) {
        const account = this.generateAccount(role as any, i);
        const key = `${role}_${i}`;
        this.pool.set(key, account);

        // Pre-create account via API
        try {
          await this.createAccountViaAPI(account);
          console.log(`Created account: ${account.email}`);
        } catch (error: any) {
          if (error.response?.status !== 409) { // Ignore if already exists
            console.warn(`Failed to create account ${account.email}:`, error.message);
          }
        }
      }
    }

    console.log(`Account pool initialized with ${this.pool.size} accounts`);
  }

  /**
   * Create account via backend API
   */
  private async createAccountViaAPI(account: TestAccount): Promise<void> {
    const payload: any = {
      email: account.email,
      password: account.password,
      firstName: account.firstName,
      lastName: account.lastName,
      phoneNumber: account.phoneNumber,
      role: account.role
    };

    // Add artisan-specific fields
    if (account.role === 'ARTISAN') {
      payload.trade = 'plumbing';
      payload.experience = 5;
      payload.location = 'Johannesburg';
      payload.bio = 'Experienced test artisan';
    }

    await axios.post(`${API_URL}/auth/register`, payload);
  }

  /**
   * Acquire an available account from the pool
   */
  async acquireAccount(role: 'CLIENT' | 'ARTISAN' | 'ADMIN'): Promise<TestAccount> {
    // Find available account
    for (const [key, account] of this.pool.entries()) {
      if (account.role === role && !account.inUse && !this.isAccountLocked(account)) {
        account.inUse = true;
        account.lastUsed = new Date();
        this.pool.set(key, account);
        console.log(`Acquired account: ${account.email}`);
        return account;
      }
    }

    // If no account available, create a new one
    console.log(`No available ${role} account in pool, creating new one...`);
    const newAccount = this.generateAccount(role, this.pool.size);

    try {
      await this.createAccountViaAPI(newAccount);
      newAccount.inUse = true;
      newAccount.lastUsed = new Date();
      const key = `${role}_${this.pool.size}`;
      this.pool.set(key, newAccount);
      console.log(`Created and acquired new account: ${newAccount.email}`);
      return newAccount;
    } catch (error) {
      throw new Error(`Failed to create new ${role} account: ${error}`);
    }
  }

  /**
   * Release account back to pool
   */
  releaseAccount(email: string): void {
    for (const [key, account] of this.pool.entries()) {
      if (account.email === email) {
        account.inUse = false;
        this.pool.set(key, account);
        console.log(`Released account: ${email}`);
        return;
      }
    }
  }

  /**
   * Mark account as locked due to failed attempts
   */
  markAccountLocked(email: string): void {
    for (const [key, account] of this.pool.entries()) {
      if (account.email === email) {
        account.failedAttempts++;
        if (account.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
          account.locked = true;
          account.inUse = false;
          console.warn(`Account locked due to failed attempts: ${email}`);
        }
        this.pool.set(key, account);
        return;
      }
    }
  }

  /**
   * Check if account is locked
   */
  private isAccountLocked(account: TestAccount): boolean {
    if (!account.locked) return false;

    // Check if lockout duration has passed
    if (account.lastUsed) {
      const timeSinceLocked = Date.now() - account.lastUsed.getTime();
      if (timeSinceLocked > this.LOCKOUT_DURATION_MS) {
        account.locked = false;
        account.failedAttempts = 0;
        console.log(`Account lockout expired: ${account.email}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Reset all accounts in pool
   */
  async resetPool(): Promise<void> {
    for (const [key, account] of this.pool.entries()) {
      account.inUse = false;
      account.locked = false;
      account.failedAttempts = 0;
      this.pool.set(key, account);
    }
    console.log('Account pool reset');
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): {
    total: number;
    available: number;
    inUse: number;
    locked: number;
    byRole: Record<string, number>;
  } {
    let available = 0;
    let inUse = 0;
    let locked = 0;
    const byRole: Record<string, number> = { CLIENT: 0, ARTISAN: 0, ADMIN: 0 };

    for (const account of this.pool.values()) {
      byRole[account.role]++;
      if (account.inUse) inUse++;
      else if (this.isAccountLocked(account)) locked++;
      else available++;
    }

    return {
      total: this.pool.size,
      available,
      inUse,
      locked,
      byRole
    };
  }

  /**
   * Create isolated account for single test (auto-cleanup)
   */
  async createIsolatedAccount(role: 'CLIENT' | 'ARTISAN' | 'ADMIN'): Promise<TestAccount> {
    const account = this.generateAccount(role, Date.now());
    await this.createAccountViaAPI(account);
    console.log(`Created isolated account: ${account.email}`);
    return account;
  }
}

// Singleton instance
export const accountPool = new AccountPoolManager();

/**
 * Initialize account pool before tests
 * Call this in global setup
 */
export async function initializeAccountPool(): Promise<void> {
  await accountPool.initializePool({
    CLIENT: 5,   // 5 client accounts
    ARTISAN: 5,  // 5 artisan accounts
    ADMIN: 2     // 2 admin accounts
  });
}

/**
 * Login via API with account pool management
 */
export async function loginWithPooledAccount(
  page: Page,
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN',
  options: { isolated?: boolean } = {}
): Promise<{ account: TestAccount; tokens: any }> {
  const account = options.isolated
    ? await accountPool.createIsolatedAccount(role)
    : await accountPool.acquireAccount(role);

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: account.email,
      password: account.password
    });

    const { accessToken, refreshToken, user } = response.data;

    // Set auth state in browser
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.evaluate(({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }, { accessToken, refreshToken });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: accessToken,
        domain: new URL(FRONTEND_URL).hostname,
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    console.log(`Logged in with pooled account: ${account.email}`);
    return { account, tokens: { accessToken, refreshToken, user } };

  } catch (error: any) {
    accountPool.markAccountLocked(account.email);
    throw new Error(`Login failed for ${account.email}: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Cleanup account after test
 */
export async function cleanupAccount(page: Page, account: TestAccount, options: { isolated?: boolean } = {}): Promise<void> {
  // Clear auth state
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();

  // Release or cleanup account
  if (options.isolated) {
    console.log(`Isolated account used (no cleanup needed): ${account.email}`);
  } else {
    accountPool.releaseAccount(account.email);
  }
}
