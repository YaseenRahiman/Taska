/**
 * Centralized Selector Export
 * Single import point for all test selectors
 *
 * Usage:
 * import { AUTH_SELECTORS, JOB_SELECTORS } from './selectors';
 */

export * from './auth.selectors';
export * from './navigation.selectors';
export * from './job.selectors';
export * from './bid.selectors';

/**
 * Common UI selectors used across multiple components
 */
export const COMMON_SELECTORS = {
  // Buttons
  submitButton: 'button[type="submit"]',
  cancelButton: '[data-testid="cancel-button"], button:has-text("Cancel")',
  closeButton: '[data-testid="close-button"], button[aria-label*="close" i]',
  deleteButton: '[data-testid="delete-button"], button:has-text("Delete")',
  editButton: '[data-testid="edit-button"], button:has-text("Edit")',

  // Modals/Dialogs
  modal: '[role="dialog"], [data-testid="modal"]',
  modalOverlay: '[data-testid="modal-overlay"], .modal-overlay',
  modalClose: '[data-testid="modal-close"], button[aria-label*="close" i]',

  // Loading states
  spinner: '[data-testid="spinner"], .spinner, [class*="loading"]',
  skeleton: '[data-testid="skeleton"], [class*="skeleton"]',
  loadingOverlay: '[data-testid="loading-overlay"]',

  // Messages
  successMessage: '[data-testid="success-message"], [role="status"]',
  errorMessage: '[data-testid="error-message"], [role="alert"]',
  warningMessage: '[data-testid="warning-message"]',
  infoMessage: '[data-testid="info-message"]',

  // Forms
  formError: '.error-message, [class*="error"]',
  requiredField: '[required], [aria-required="true"]',

  // Tables
  table: 'table, [role="table"]',
  tableRow: 'tr, [role="row"]',
  tableHeader: 'th, [role="columnheader"]',
  tableCell: 'td, [role="cell"]',

  // Cards
  card: '[data-testid*="card"], .card',

  // Pagination
  pagination: '[data-testid="pagination"]',
  paginationNext: '[data-testid="pagination-next"], button:has-text("Next")',
  paginationPrev: '[data-testid="pagination-prev"], button:has-text("Previous")',

  // Tabs
  tabList: '[role="tablist"]',
  tab: '[role="tab"]',
  tabPanel: '[role="tabpanel"]',

  // Dropdowns
  dropdown: '[data-testid*="dropdown"], select',
  dropdownOption: 'option',

  // Tooltips
  tooltip: '[role="tooltip"], [data-testid="tooltip"]',

  // Badges
  badge: '[data-testid*="badge"], .badge, [class*="badge"]',

  // Search
  searchInput: 'input[type="search"], [role="searchbox"]',

  // Empty states
  emptyState: '[data-testid="empty-state"], [class*="empty"]',
} as const;

/**
 * Common accessible role patterns
 */
export const COMMON_ROLES = {
  // Buttons
  button: { role: 'button' as const },
  link: { role: 'link' as const },

  // Inputs
  textbox: { role: 'textbox' as const },
  searchbox: { role: 'searchbox' as const },
  checkbox: { role: 'checkbox' as const },
  radio: { role: 'radio' as const },

  // Containers
  navigation: { role: 'navigation' as const },
  main: { role: 'main' as const },
  complementary: { role: 'complementary' as const },

  // Lists
  list: { role: 'list' as const },
  listitem: { role: 'listitem' as const },

  // Dialogs
  dialog: { role: 'dialog' as const },
  alertdialog: { role: 'alertdialog' as const },

  // Status
  alert: { role: 'alert' as const },
  status: { role: 'status' as const },
} as const;

/**
 * Common URL patterns
 */
export const COMMON_URLS = {
  error404: /\/404/,
  error500: /\/error|\/500/,
  notFound: /not-found/,
} as const;

/**
 * Helper function to create a selector with multiple fallbacks
 */
export function createSelector(...selectors: string[]): string {
  return selectors.join(', ');
}

/**
 * Helper function to create a scoped selector
 */
export function scopedSelector(scope: string, selector: string): string {
  return `${scope} ${selector}`;
}

/**
 * Helper to get text content selector
 * Use sparingly - prefer semantic selectors
 */
export function textSelector(text: string | RegExp): string {
  if (typeof text === 'string') {
    return `text="${text}"`;
  }
  return `text=${text}`;
}
