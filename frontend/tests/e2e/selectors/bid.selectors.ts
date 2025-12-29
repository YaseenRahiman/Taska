/**
 * Bid-related Selectors
 * Centralized selectors for bid submission and management
 */

export const BID_SELECTORS = {
  // Bid Submission Form
  bidForm: {
    container: '[data-testid="bid-form"]',
    containerFallback: '[role="dialog"], .modal, form',

    amountInput: '[data-testid="bid-amount-input"]',
    amountInputFallback: 'input[name="amount"], input[type="number"]',

    messageTextarea: '[data-testid="bid-message-textarea"]',
    messageTextareaFallback: 'textarea[name="message"], textarea[placeholder*="message" i]',

    estimatedDaysInput: '[data-testid="bid-estimated-days-input"]',
    estimatedDaysInputFallback: 'input[name="estimatedDays"], input[name="estimated_days"]',

    availabilityInput: '[data-testid="bid-availability-input"]',
    availabilityInputFallback: 'input[name="availability"]',

    portfolioUpload: '[data-testid="bid-portfolio-upload"]',
    portfolioUploadFallback: 'input[type="file"]',

    submitButton: '[data-testid="bid-submit-button"]',
    submitButtonFallback: 'button[type="submit"]',

    cancelButton: '[data-testid="bid-cancel-button"]',

    // Validation
    fieldError: '[data-testid*="bid-error"], .error-message',
  },

  // Bid Card (List View)
  bidCard: {
    container: '[data-testid="bid-card"]',
    containerFallback: '.bid-card, .card',

    artisanName: '[data-testid="bid-artisan-name"]',
    artisanAvatar: '[data-testid="bid-artisan-avatar"]',
    artisanRating: '[data-testid="bid-artisan-rating"]',

    amount: '[data-testid="bid-amount"]',
    amountFallback: 'text=/R\\s*\\d+/i',

    message: '[data-testid="bid-message"]',
    estimatedDays: '[data-testid="bid-estimated-days"]',
    submittedDate: '[data-testid="bid-submitted-date"]',

    statusBadge: '[data-testid="bid-status"]',
    statusBadgeFallback: '[class*="badge"], [class*="status"]',

    // Actions
    acceptButton: '[data-testid="bid-accept-button"]',
    acceptButtonFallback: 'button:has-text("Accept")',

    rejectButton: '[data-testid="bid-reject-button"]',
    rejectButtonFallback: 'button:has-text("Reject")',

    viewButton: '[data-testid="bid-view-button"]',
    viewButtonFallback: 'button:has-text("View"), a:has-text("View Details")',

    withdrawButton: '[data-testid="bid-withdraw-button"]',
    withdrawButtonFallback: 'button:has-text("Withdraw")',
  },

  // Bid Details View
  bidDetails: {
    container: '[data-testid="bid-details"]',

    artisanSection: '[data-testid="bid-artisan-section"]',
    artisanName: '[data-testid="bid-details-artisan-name"]',
    artisanProfile: '[data-testid="bid-artisan-profile-link"]',

    amount: '[data-testid="bid-details-amount"]',
    message: '[data-testid="bid-details-message"]',
    estimatedDays: '[data-testid="bid-details-estimated-days"]',
    availability: '[data-testid="bid-details-availability"]',

    portfolio: '[data-testid="bid-portfolio"]',
    reviews: '[data-testid="bid-artisan-reviews"]',

    // Actions
    acceptButton: '[data-testid="bid-details-accept-button"]',
    rejectButton: '[data-testid="bid-details-reject-button"]',
    contactButton: '[data-testid="bid-contact-button"]',
    closeButton: '[data-testid="bid-details-close-button"]',
  },

  // Bid List / Management
  bidList: {
    container: '[data-testid="bid-list"]',
    emptyState: '[data-testid="bid-list-empty"]',
    emptyStateFallback: 'text=/no bids/i, text=/first bid/i',

    // Tabs
    allBidsTab: '[data-testid="bids-tab-all"]',
    pendingBidsTab: '[data-testid="bids-tab-pending"]',
    acceptedBidsTab: '[data-testid="bids-tab-accepted"]',
    rejectedBidsTab: '[data-testid="bids-tab-rejected"]',

    // Filters
    statusFilter: '[data-testid="bid-status-filter"]',
    sortSelect: '[data-testid="bid-sort-select"]',

    // Pagination
    pagination: '[data-testid="bid-pagination"]',
  },

  // Bid Statistics (Dashboard)
  statistics: {
    totalBids: '[data-testid="stat-total-bids"]',
    totalBidsFallback: 'text=/bids/i',

    pendingBids: '[data-testid="stat-pending-bids"]',
    pendingBidsFallback: 'text=/pending/i',

    acceptedBids: '[data-testid="stat-accepted-bids"]',
    acceptedBidsFallback: 'text=/accepted/i',

    rejectedBids: '[data-testid="stat-rejected-bids"]',

    winRate: '[data-testid="stat-win-rate"]',
  },
} as const;

/**
 * Bid-related accessible role selectors
 */
export const BID_ROLES = {
  // Buttons
  placeBidButton: { role: 'button', name: /place bid|submit bid/i },
  acceptBidButton: { role: 'button', name: /accept/i },
  rejectBidButton: { role: 'button', name: /reject|decline/i },
  withdrawBidButton: { role: 'button', name: /withdraw/i },

  // Form inputs
  amountInput: { role: 'spinbutton', name: /amount|price|bid amount/i },
  messageInput: { role: 'textbox', name: /message|proposal/i },
  daysInput: { role: 'spinbutton', name: /days|estimated.*days/i },

  // Lists
  bidList: { role: 'list', name: /bids|bid list/i },
  bidCard: { role: 'article', name: /bid/i },
} as const;

/**
 * Bid-related URL patterns
 */
export const BID_URLS = {
  clientBids: /\/client\/bids/,
  artisanBids: /\/artisan\/bids/,
  bidDetails: /\/bids\/\d+/,
} as const;

/**
 * Bid status constants
 */
export const BID_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
