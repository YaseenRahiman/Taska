/**
 * Job-related Selectors
 * Centralized selectors for job posting, browsing, and management
 */

export const JOB_SELECTORS = {
  // Job Creation Form
  createForm: {
    titleInput: '[data-testid="job-title-input"]',
    titleInputFallback: 'input[name="title"], input[id="title"]',

    descriptionTextarea: '[data-testid="job-description-input"]',
    descriptionTextareaFallback: 'textarea[name="description"], textarea[id="description"]',

    categorySelect: '[data-testid="job-category-select"]',
    categorySelectFallback: 'select[name="category"], input[name="category"]',

    budgetInput: '[data-testid="job-budget-input"]',
    budgetInputFallback: 'input[name="budget"], input[type="number"]',

    urgencySelect: '[data-testid="job-urgency-select"]',
    urgencySelectFallback: 'select[name="urgency"]',

    locationInput: '[data-testid="job-location-input"]',
    locationInputFallback: 'input[name="location"]',

    imageUpload: '[data-testid="job-image-upload"]',
    imageUploadFallback: 'input[type="file"]',

    submitButton: '[data-testid="job-submit-button"]',
    submitButtonFallback: 'button[type="submit"]',

    cancelButton: '[data-testid="job-cancel-button"]',

    // Validation
    fieldError: '[data-testid*="error"], .error-message',
  },

  // Job Card (List View)
  jobCard: {
    container: '[data-testid="job-card"]',
    containerFallback: '.job-card, .card',

    title: '[data-testid="job-card-title"]',
    description: '[data-testid="job-card-description"]',
    budget: '[data-testid="job-card-budget"]',
    budgetFallback: 'text=/R\\s*\\d+|\\d+.*budget/i',

    category: '[data-testid="job-card-category"]',
    urgency: '[data-testid="job-card-urgency"]',
    urgencyFallback: 'text=/high|medium|low|urgent/i, [class*="urgency"]',

    location: '[data-testid="job-card-location"]',
    postedDate: '[data-testid="job-card-posted-date"]',

    viewButton: '[data-testid="job-card-view-button"]',
    viewButtonFallback: 'button:has-text("View"), a:has-text("View Details")',

    bidCount: '[data-testid="job-card-bid-count"]',
    statusBadge: '[data-testid="job-card-status"]',
  },

  // Job Details Page
  jobDetails: {
    container: '[data-testid="job-details"]',

    title: '[data-testid="job-title"]',
    description: '[data-testid="job-description"]',
    descriptionFallback: 'text=/description|details|about this job/i',

    budget: '[data-testid="job-budget"]',
    category: '[data-testid="job-category"]',
    urgency: '[data-testid="job-urgency"]',
    location: '[data-testid="job-location"]',
    postedDate: '[data-testid="job-posted-date"]',

    images: '[data-testid="job-images"]',

    // Actions
    placeBidButton: '[data-testid="place-bid-button"]',
    placeBidButtonFallback: 'button:has-text("Place Bid"), button:has-text("Submit Bid")',

    editButton: '[data-testid="job-edit-button"]',
    deleteButton: '[data-testid="job-delete-button"]',
    closeButton: '[data-testid="job-close-button"]',

    // Client view
    bidsTab: '[data-testid="bids-tab"]',
    bidsTabFallback: 'button:has-text("Bids"), [role="tab"]:has-text("Bids")',

    messagesTab: '[data-testid="messages-tab"]',
    detailsTab: '[data-testid="details-tab"]',
  },

  // Job List / Dashboard
  jobList: {
    container: '[data-testid="job-list"]',
    emptyState: '[data-testid="job-list-empty"]',
    emptyStateFallback: 'text=/no jobs/i, text=/first job/i',

    // Filters and Search
    searchInput: '[data-testid="job-search-input"]',
    searchInputFallback: 'input[type="search"], input[placeholder*="search" i]',

    categoryFilter: '[data-testid="job-category-filter"]',
    categoryFilterFallback: 'select[name="category"], button:has-text("Category")',

    statusFilter: '[data-testid="job-status-filter"]',
    urgencyFilter: '[data-testid="job-urgency-filter"]',

    sortSelect: '[data-testid="job-sort-select"]',

    // Pagination
    pagination: '[data-testid="pagination"]',
    nextButton: '[data-testid="pagination-next"]',
    prevButton: '[data-testid="pagination-prev"]',

    // Actions
    postJobButton: '[data-testid="post-job-button"]',
    postJobButtonFallback: 'button:has-text("Post"), a:has-text("Post a Job"), a:has-text("Post Your Job")',

    viewAllButton: '[data-testid="view-all-jobs-button"]',
    viewAllButtonFallback: 'button:has-text("View All"), a:has-text("View All")',
  },

  // Job Statistics (Dashboard)
  statistics: {
    totalJobs: '[data-testid="stat-total-jobs"]',
    totalJobsFallback: 'text=/total jobs/i',

    activeJobs: '[data-testid="stat-active-jobs"]',
    activeJobsFallback: 'text=/active/i',

    completedJobs: '[data-testid="stat-completed-jobs"]',
    completedJobsFallback: 'text=/completed/i',

    inProgressJobs: '[data-testid="stat-in-progress-jobs"]',
  },
} as const;

/**
 * Job-related accessible role selectors
 */
export const JOB_ROLES = {
  // Buttons
  postJobButton: { role: 'button', name: /post.*job|create job/i },
  placeBidButton: { role: 'button', name: /place bid|submit bid/i },
  viewDetailsButton: { role: 'button', name: /view|details|see more/i },

  // Form inputs
  titleInput: { role: 'textbox', name: /title|job title/i },
  descriptionInput: { role: 'textbox', name: /description/i },
  budgetInput: { role: 'spinbutton', name: /budget|price/i },

  // Search
  searchInput: { role: 'searchbox', name: /search/i },

  // Lists
  jobList: { role: 'list', name: /jobs|job list/i },
  jobCard: { role: 'article', name: /job/i },
} as const;

/**
 * Job-related URL patterns
 */
export const JOB_URLS = {
  clientJobs: /\/client\/jobs/,
  artisanJobs: /\/artisan\/jobs/,
  createJob: /\/client\/jobs\/create/,
  postJob: /\/post-job/,
  jobDetails: /\/jobs\/\d+/,
  browse: /\/browse/,
} as const;

/**
 * Job status constants
 */
export const JOB_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

/**
 * Job urgency constants
 */
export const JOB_URGENCY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
