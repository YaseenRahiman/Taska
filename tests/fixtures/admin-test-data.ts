/**
 * Test Fixtures and Data for Admin Portal E2E Tests
 * Provides reusable test data for all admin modules
 */

export const ADMIN_CREDENTIALS = {
  email: 'admin@taska.com',
  password: 'AdminTest123!',
};

export const TEST_USERS = {
  client: {
    email: 'test.client@example.com',
    password: 'ClientTest123!',
    name: 'Test Client',
    phone: '+27123456789',
  },
  artisan: {
    email: 'test.artisan@example.com',
    password: 'ArtisanTest123!',
    name: 'Test Artisan',
    phone: '+27987654321',
    skills: ['Plumbing', 'Electrical'],
  },
};

export const ESCROW_TEST_DATA = {
  defaultSettings: {
    autoReleaseDays: 14,
    feePercentage: 5.0,
    minHoldAmount: 100,
    maxHoldAmount: 50000,
  },
  updatedSettings: {
    autoReleaseDays: 10,
    feePercentage: 4.5,
    minHoldAmount: 150,
    maxHoldAmount: 75000,
  },
  testHold: {
    amount: 1500,
    jobId: 'JOB-TEST-001',
    clientId: 'CLIENT-TEST-001',
    artisanId: 'ARTISAN-TEST-001',
  },
  releaseReason: 'Job completed successfully and verified by admin',
  refundReason: 'Client requested refund due to unsatisfactory work',
};

export const PAYMENT_TEST_DATA = {
  testPayment: {
    id: 'PAY-TEST-001',
    amount: 2500,
    method: 'stripe',
    userId: 'USER-TEST-001',
    status: 'pending',
    riskScore: 35,
    riskLevel: 'medium',
  },
  approvalReason: 'Payment verified and approved after manual review',
  rejectionReason: 'Suspicious activity detected - flagged by fraud detection system',
  holdReason: 'Pending additional verification from client',
  investigationNotes: 'Contacted client via email for verification. Awaiting response within 24 hours.',
  bulkApprovalReason: 'Batch approval for low-risk payments after manual review',
  riskFactors: [
    { name: 'Amount', score: 15, weight: 0.3 },
    { name: 'User History', score: 10, weight: 0.2 },
    { name: 'Transaction Pattern', score: 5, weight: 0.2 },
    { name: 'Geographic Location', score: 5, weight: 0.3 },
  ],
};

export const REVIEW_TEST_DATA = {
  testReview: {
    id: 'REV-TEST-001',
    content: 'Great service! Very professional and completed the work on time.',
    rating: 5,
    jobId: 'JOB-TEST-001',
    reviewerId: 'USER-TEST-001',
    artisanId: 'ARTISAN-TEST-001',
    helpfulCount: 5,
    reportCount: 0,
    isVisible: true,
    isFlagged: false,
  },
  flaggedReview: {
    id: 'REV-TEST-002',
    content: 'Terrible experience. Would not recommend.',
    rating: 1,
    jobId: 'JOB-TEST-002',
    reviewerId: 'USER-TEST-002',
    artisanId: 'ARTISAN-TEST-001',
    helpfulCount: 2,
    reportCount: 3,
    isVisible: true,
    isFlagged: true,
    flagReason: 'Contains potentially false information',
  },
  editedReviewContent: 'This is an edited review content after moderation to remove inappropriate language.',
  editReason: 'Removed profanity and inappropriate content while preserving review intent',
  moderationNote: 'User contacted about review policy violations. Edited to maintain platform standards.',
  deleteReason: 'Contains personal attacks and violates community guidelines after multiple warnings',
  hideReason: 'Pending investigation of fraud claims mentioned in review',
};

export const ANALYTICS_TEST_DATA = {
  dateRanges: ['last-7-days', 'last-30-days', 'last-90-days', 'custom'],
  metrics: {
    totalHolds: 150,
    totalValue: 175000,
    avgDuration: 12,
    totalPayments: 500,
    approvalRate: 85,
    totalReviews: 1200,
    avgRating: 4.3,
  },
};

export const FILTER_PRESETS = {
  payment: {
    highRisk: {
      status: 'pending',
      riskLevel: 'high',
      amountRange: '5000-50000',
      dateRange: 'last-7-days',
    },
    lowRisk: {
      status: 'pending',
      riskLevel: 'low',
      amountRange: '100-1000',
      dateRange: 'last-30-days',
    },
  },
  review: {
    flagged: {
      status: 'visible',
      flagged: true,
      rating: '1-2',
      dateRange: 'last-7-days',
    },
    positive: {
      status: 'visible',
      flagged: false,
      rating: '4-5',
      dateRange: 'last-30-days',
    },
  },
  escrow: {
    active: {
      status: 'active',
      amountRange: '1000-10000',
      dateRange: 'last-30-days',
    },
    released: {
      status: 'released',
      dateRange: 'last-7-days',
    },
  },
};

export const AUDIT_LOG_EVENTS = {
  escrow: [
    'Escrow settings updated',
    'Escrow released',
    'Escrow refunded',
    'Manual hold placed',
    'Auto-release configured',
  ],
  payment: [
    'Payment approved',
    'Payment rejected',
    'Payment held',
    'Hold released',
    'Investigation note added',
    'Bulk approval executed',
  ],
  review: [
    'Review edited',
    'Review hidden',
    'Review shown',
    'Review deleted',
    'Review flagged',
    'Flag removed',
    'Moderation note added',
  ],
};

export const ERROR_MESSAGES = {
  validation: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidAmount: 'Amount must be a positive number',
    invalidPercentage: 'Percentage must be between 0 and 100',
    minLength: 'Minimum length is',
    maxLength: 'Maximum length is',
  },
  authorization: {
    unauthorized: 'You do not have permission to perform this action',
    sessionExpired: 'Your session has expired. Please login again.',
  },
  notFound: {
    payment: 'Payment not found',
    review: 'Review not found',
    hold: 'Escrow hold not found',
    user: 'User not found',
  },
  server: {
    internalError: 'An internal server error occurred',
    networkError: 'Network error. Please check your connection.',
  },
};

export const SUCCESS_MESSAGES = {
  escrow: {
    settingsSaved: 'Escrow settings saved successfully',
    released: 'Escrow released successfully',
    refunded: 'Escrow refunded successfully',
  },
  payment: {
    approved: 'Payment approved successfully',
    rejected: 'Payment rejected successfully',
    held: 'Payment placed on hold',
    released: 'Hold released',
    noteAdded: 'Investigation note added',
    bulkApproved: 'payments approved',
  },
  review: {
    edited: 'Review updated successfully',
    hidden: 'Review hidden',
    shown: 'Review shown',
    deleted: 'Review deleted',
    flagged: 'Review flagged',
    unflagged: 'Flag removed',
    noteAdded: 'Moderation note added',
  },
};

export const NAVIGATION_ROUTES = {
  dashboard: '/admin/dashboard',
  escrowConfig: '/admin/escrow-config',
  paymentApproval: '/admin/payment-approval',
  reviewModeration: '/admin/review-moderation',
  userManagement: '/admin/users',
  analytics: '/admin/analytics',
  settings: '/admin/settings',
  auditLog: '/admin/audit-log',
};

export const TIMEOUTS = {
  short: 1000,
  medium: 3000,
  long: 5000,
  veryLong: 10000,
};

// Helper function to generate test IDs
export function generateTestId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

// Helper function to generate test payment
export function generateTestPayment(overrides?: Partial<typeof PAYMENT_TEST_DATA.testPayment>) {
  return {
    ...PAYMENT_TEST_DATA.testPayment,
    id: generateTestId('PAY'),
    ...overrides,
  };
}

// Helper function to generate test review
export function generateTestReview(overrides?: Partial<typeof REVIEW_TEST_DATA.testReview>) {
  return {
    ...REVIEW_TEST_DATA.testReview,
    id: generateTestId('REV'),
    ...overrides,
  };
}

// Helper function to generate test escrow hold
export function generateTestHold(overrides?: Partial<typeof ESCROW_TEST_DATA.testHold>) {
  return {
    ...ESCROW_TEST_DATA.testHold,
    ...overrides,
  };
}

// Helper to wait for specific conditions
export const waitFor = {
  toast: async (page: any) => {
    return page.waitForSelector('[data-testid="success-toast"]', {
      state: 'visible',
      timeout: TIMEOUTS.medium,
    });
  },
  loading: async (page: any) => {
    return page.waitForSelector('[data-testid="loading-spinner"]', {
      state: 'hidden',
      timeout: TIMEOUTS.long,
    });
  },
  modal: async (page: any, modalTestId: string) => {
    return page.waitForSelector(`[data-testid="${modalTestId}"]`, {
      state: 'visible',
      timeout: TIMEOUTS.medium,
    });
  },
};
