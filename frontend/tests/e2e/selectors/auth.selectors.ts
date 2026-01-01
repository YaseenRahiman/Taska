/**
 * Authentication Selectors
 * Centralized selectors for auth-related components
 *
 * Priority Order:
 * 1. data-testid (most stable)
 * 2. role + accessible name (semantic)
 * 3. form labels (accessible)
 * 4. attributes (fallback)
 */

export const AUTH_SELECTORS = {
  // Login Page
  login: {
    // Primary selectors (use when components have data-testid)
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    submitButton: '[data-testid="login-submit-button"]',
    registerLink: '[data-testid="register-link"]',
    forgotPasswordLink: '[data-testid="forgot-password-link"]',

    // Fallback selectors (for components without data-testid)
    emailInputFallback: 'input[type="email"], input[name="email"]',
    passwordInputFallback: 'input[type="password"], input[name="password"]',
    submitButtonFallback: 'button[type="submit"]',
    registerLinkFallback: 'a:has-text("Sign up"), a:has-text("Register")',
    forgotPasswordLinkFallback: 'a:has-text("Forgot"), a:has-text("forgot password")',

    // Error messages
    errorMessage: '[data-testid="login-error"], [role="alert"]',
    fieldError: '.error-message, [class*="error"]',
  },

  // Registration Page
  register: {
    // Primary selectors
    firstNameInput: '[data-testid="first-name-input"]',
    lastNameInput: '[data-testid="last-name-input"]',
    emailInput: '[data-testid="email-input"]',
    phoneInput: '[data-testid="phone-input"]',
    passwordInput: '[data-testid="password-input"]',
    confirmPasswordInput: '[data-testid="confirm-password-input"]',
    termsCheckbox: '[data-testid="terms-checkbox"]',
    submitButton: '[data-testid="register-submit-button"]',
    loginLink: '[data-testid="login-link"]',

    // Fallback selectors
    firstNameInputFallback: 'input[name="firstName"], input[id="firstName"]',
    lastNameInputFallback: 'input[name="lastName"], input[id="lastName"]',
    emailInputFallback: 'input[type="email"], input[name="email"]',
    phoneInputFallback: 'input[name="phoneNumber"], input[name="phone"]',
    passwordInputFallback: 'input[type="password"], input[name="password"]',
    termsCheckboxFallback: 'input[name="terms"], input[id="terms"]',
    submitButtonFallback: 'button[type="submit"]',
    loginLinkFallback: 'a:has-text("Sign in"), a:has-text("Login")',

    // Artisan-specific fields
    tradeSelect: '[data-testid="trade-select"]',
    tradeSelectFallback: 'select[name="trade"], select[id="trade"]',
    experienceInput: '[data-testid="experience-input"]',
    experienceInputFallback: 'input[name="experience"], input[id="experience"]',
    locationInput: '[data-testid="location-input"]',
    locationInputFallback: 'input[name="location"], input[id="location"]',
    bioTextarea: '[data-testid="bio-textarea"]',
    bioTextareaFallback: 'textarea[name="bio"], textarea[id="bio"]',
  },

  // User Menu / Logout
  userMenu: {
    menuButton: '[data-testid="user-menu"], [aria-label="User menu"]',
    logoutButton: '[data-testid="logout-button"]',
    logoutButtonFallback: 'button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")',
    profileLink: '[data-testid="profile-link"]',
  },

  // Loading States
  loading: {
    submitSpinner: 'button[type="submit"] svg, button[type="submit"] .spinner',
    loadingText: 'button:has-text("Loading"), button:has-text("Signing"), button:has-text("Wait")',
    pageLoader: '[data-testid="page-loader"], .loader, [class*="loading"]',
  },
} as const;

/**
 * Helper to get selector with fallback
 * @param primary Primary selector (data-testid)
 * @param fallback Fallback selector
 * @returns Combined selector
 */
export function withFallback(primary: string, fallback: string): string {
  return `${primary}, ${fallback}`;
}

/**
 * Auth-related accessible role selectors
 * Use these for semantic selection when data-testid is not available
 */
export const AUTH_ROLES = {
  // Buttons
  submitButton: { role: 'button', name: /submit|sign in|log in|register|create account/i },
  logoutButton: { role: 'button', name: /logout|sign out/i },

  // Links
  registerLink: { role: 'link', name: /sign up|register|create account/i },
  loginLink: { role: 'link', name: /sign in|log in|login/i },
  forgotPasswordLink: { role: 'link', name: /forgot password|reset password/i },

  // Form inputs
  emailInput: { role: 'textbox', name: /email/i },
  passwordInput: { role: 'textbox', name: /password/i },
  firstNameInput: { role: 'textbox', name: /first name/i },
  lastNameInput: { role: 'textbox', name: /last name/i },

  // Checkboxes
  termsCheckbox: { role: 'checkbox', name: /terms|agree/i },
} as const;

/**
 * Auth page URL patterns
 */
export const AUTH_URLS = {
  login: /\/auth\/login/,
  register: /\/auth\/register/,
  forgotPassword: /\/auth\/forgot-password/,
  resetPassword: /\/auth\/reset-password/,
  clientDashboard: /\/client\/dashboard/,
  artisanDashboard: /\/artisan\/dashboard/,
  adminDashboard: /\/admin\/dashboard/,
  anyDashboard: /\/(client|artisan|admin)\/dashboard/,
} as const;
