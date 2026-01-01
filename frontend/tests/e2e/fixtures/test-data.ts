/**
 * Test Data Fixtures
 * Comprehensive reusable test data for E2E tests with proper typing
 */

export interface TestJob {
  title: string;
  description: string;
  category: string;
  budget: number;
  budgetType?: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  location?: {
    address?: string;
    city: string;
    province: string;
    postalCode?: string;
  };
  images?: string[];
  requirements?: string[];
  startDate?: string;
}

export interface TestBid {
  amount: number;
  message: string;
  estimatedDays: number;
  availability?: string;
  attachments?: string[];
}

export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  phoneNumber?: string;
  category?: string;
  trade?: string;
  experience?: string;
  description?: string;
  bio?: string;
  location?: {
    city: string;
    province: string;
    address?: string;
  };
}

// Test Job Fixtures
export const TEST_JOB: TestJob = {
  title: 'Fix Leaking Kitchen Tap',
  description: 'I have a kitchen tap that has been leaking for the past week. Need an experienced plumber to fix it as soon as possible.',
  category: 'Plumbing',
  budget: 800,
  budgetType: 'FIXED',
  urgency: 'HIGH',
  location: {
    address: '123 Main Street',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001'
  },
  requirements: [
    'Must be licensed plumber',
    'Available for weekend work',
    'Provide warranty'
  ]
};

export const TEST_JOBS: TestJob[] = [
  {
    title: 'Electrical Outlet Installation',
    description: 'Need 3 additional electrical outlets installed in my home office. Electrical panel has capacity.',
    category: 'Electrical',
    budget: 1200,
    budgetType: 'FIXED',
    urgency: 'MEDIUM',
    location: {
      city: 'Johannesburg',
      province: 'Gauteng'
    },
    requirements: [
      'COC required',
      'Bring own tools',
      'Available weekdays'
    ]
  },
  {
    title: 'Garden Landscaping',
    description: 'Looking for a gardener to redesign my front garden with new plants, paving, and irrigation system.',
    category: 'Garden Services',
    budget: 5000,
    budgetType: 'NEGOTIABLE',
    urgency: 'LOW',
    location: {
      city: 'Durban',
      province: 'KwaZulu-Natal'
    }
  },
  {
    title: 'Roof Leak Repair',
    description: 'Have a leak in my roof that needs urgent attention before the rainy season. Tiles need replacement.',
    category: 'Roofing',
    budget: 3500,
    budgetType: 'FIXED',
    urgency: 'HIGH',
    location: {
      city: 'Pretoria',
      province: 'Gauteng'
    },
    requirements: [
      'Insurance required',
      'Safety compliance',
      'Warranty provided'
    ]
  },
  {
    title: 'Kitchen Cabinet Installation',
    description: 'Need help installing new IKEA kitchen cabinets. All materials provided, just need assembly and installation.',
    category: 'Carpentry',
    budget: 2500,
    budgetType: 'FIXED',
    urgency: 'MEDIUM',
    location: {
      city: 'Cape Town',
      province: 'Western Cape'
    }
  },
  {
    title: 'House Painting - Interior',
    description: 'Need 3 bedrooms and 2 bathrooms painted. Walls are in good condition, just need fresh paint.',
    category: 'Painting',
    budget: 4000,
    budgetType: 'NEGOTIABLE',
    urgency: 'LOW',
    location: {
      city: 'Port Elizabeth',
      province: 'Eastern Cape'
    }
  }
];

// Test Bid Fixtures
export const TEST_BID: TestBid = {
  amount: 750,
  message: 'I have 10 years of experience in plumbing and can fix this for you within 2 hours. I use quality parts and provide a 1-year warranty on all work.',
  estimatedDays: 1,
  availability: 'Available this weekend'
};

export const TEST_BIDS: TestBid[] = [
  {
    amount: 700,
    message: 'Professional plumber with 15 years experience. Can start tomorrow. Free call-out and inspection.',
    estimatedDays: 1,
    availability: 'Available immediately'
  },
  {
    amount: 850,
    message: 'Licensed plumber with emergency service available. All work guaranteed. COC provided.',
    estimatedDays: 1,
    availability: 'Available 24/7'
  },
  {
    amount: 650,
    message: 'Experienced and reliable plumber. Many positive reviews on platform. Budget-friendly rates.',
    estimatedDays: 2,
    availability: 'Available next week'
  }
];

// Test User Fixtures
export const TEST_USER: { client: TestUser; artisan: TestUser } = {
  client: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe.test@example.com',
    password: 'Password123!',
    phone: '+27821234567',
    phoneNumber: '+27821234567',
    location: {
      city: 'Cape Town',
      province: 'Western Cape',
      address: '123 Test Street'
    }
  },
  artisan: {
    firstName: 'Mike',
    lastName: 'Smith',
    email: 'mike.smith.test@example.com',
    password: 'Password123!',
    phone: '+27829876543',
    phoneNumber: '+27829876543',
    category: 'Plumbing',
    trade: 'Plumbing',
    experience: '10 years',
    description: 'Professional plumber with over 10 years of experience in residential and commercial plumbing. Licensed and insured.',
    bio: 'Professional plumber with over 10 years of experience in residential and commercial plumbing. Licensed and insured.',
    location: {
      city: 'Cape Town',
      province: 'Western Cape',
      address: '456 Artisan Road'
    }
  }
};

// Navigation Links for Testing
export const NAVIGATION_LINKS = {
  public: [
    { text: 'Find Artisans', url: '/browse' },
    { text: 'Categories', url: '/categories' },
    { text: 'How It Works', url: '/how-it-works' },
    { text: 'About', url: '/about' },
    { text: 'Contact', url: '/contact' },
    { text: 'Pricing', url: '/pricing' }
  ],
  footer: [
    { text: 'Privacy', url: '/privacy' },
    { text: 'Terms', url: '/terms' },
    { text: 'Safety', url: '/safety' },
    { text: 'Insurance', url: '/insurance' },
    { text: 'Careers', url: '/careers' },
    { text: 'Press', url: '/press' }
  ],
  auth: [
    { text: 'Login', url: '/auth/login' },
    { text: 'Sign Up', url: '/auth/register' },
    { text: 'Register as Artisan', url: '/auth/register?type=artisan' }
  ]
};

// Categories for Testing
export const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Roofing',
  'Tiling',
  'Garden Services',
  'Cleaning',
  'HVAC',
  'Landscaping'
];

// South African Provinces
export const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

// Major Cities
export const CITIES = {
  'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'George'],
  'Gauteng': ['Johannesburg', 'Pretoria', 'Sandton', 'Midrand'],
  'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Richards Bay'],
  'Eastern Cape': ['Port Elizabeth', 'East London', 'Gqeberha'],
  'Free State': ['Bloemfontein', 'Welkom'],
  'Limpopo': ['Polokwane', 'Tzaneen'],
  'Mpumalanga': ['Nelspruit', 'Witbank'],
  'Northern Cape': ['Kimberley', 'Upington'],
  'North West': ['Rustenburg', 'Mahikeng']
};

// Urgency Levels
export const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

// Budget Types
export const BUDGET_TYPES = ['FIXED', 'HOURLY', 'NEGOTIABLE'] as const;

// Payment Methods
export const PAYMENT_METHODS = [
  'CREDIT_CARD',
  'DEBIT_CARD',
  'EFT',
  'INSTANT_EFT',
  'PAYFAST',
  'STRIPE'
] as const;

// Test Message Data
export interface TestMessage {
  subject?: string;
  message: string;
  recipientId?: string;
}

export const TEST_MESSAGES: TestMessage[] = [
  {
    message: 'Hi, I would like to know more about your availability for this job. Can you provide more details?'
  },
  {
    message: 'Thank you for your bid. When would you be available to start? Also, do you provide any warranties?'
  },
  {
    message: 'I have a few questions about the materials you plan to use. Can we schedule a call?'
  }
];

// Test Review Data
export interface TestReview {
  rating: number;
  qualityRating?: number;
  timelinessRating?: number;
  communicationRating?: number;
  valueRating?: number;
  comment: string;
}

export const TEST_REVIEWS: TestReview[] = [
  {
    rating: 5,
    qualityRating: 5,
    timelinessRating: 5,
    communicationRating: 5,
    valueRating: 4,
    comment: 'Excellent work! Very professional and completed the job ahead of schedule. Would definitely recommend and hire again.'
  },
  {
    rating: 4,
    qualityRating: 4,
    timelinessRating: 3,
    communicationRating: 5,
    valueRating: 4,
    comment: 'Good work overall. Took a bit longer than expected but the quality was great. Good communication throughout.'
  },
  {
    rating: 3,
    qualityRating: 3,
    timelinessRating: 2,
    communicationRating: 3,
    valueRating: 3,
    comment: 'Average experience. Work was acceptable but not outstanding. Delayed start date without much notice.'
  }
];

// Form Validation Test Data
export const INVALID_TEST_DATA = {
  emails: [
    'notanemail',
    '@example.com',
    'user@',
    'user..name@example.com',
    'user@example'
  ],
  passwords: [
    '123',
    'weak',
    'NoSpecialChar1',
    'nouppercaseordigit!',
    'NOLOWERCASE1!'
  ],
  phoneNumbers: [
    '123',
    'notaphone',
    '+1234567890',  // Wrong country code
    '082123456',    // Too short
    '+27 999 999 999 999'  // Too long
  ],
  names: [
    '',  // Empty
    'A',  // Too short
    'A'.repeat(100),  // Too long
    '123',  // Numbers only
    '!!!',  // Special chars only
  ]
};

// API Response Mocks for Testing
export const MOCK_API_RESPONSES = {
  jobs: {
    success: {
      data: TEST_JOBS,
      pagination: {
        page: 1,
        limit: 10,
        total: TEST_JOBS.length,
        totalPages: 1
      }
    },
    empty: {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    }
  },
  bids: {
    success: {
      data: TEST_BIDS,
      pagination: {
        page: 1,
        limit: 10,
        total: TEST_BIDS.length,
        totalPages: 1
      }
    }
  },
  auth: {
    success: {
      accessToken: 'mock_access_token_12345',
      refreshToken: 'mock_refresh_token_67890',
      expiresIn: 86400,
      user: {
        id: 'mock_user_id_12345',
        email: TEST_USER.client.email,
        role: 'CLIENT',
        profile: {
          firstName: TEST_USER.client.firstName,
          lastName: TEST_USER.client.lastName
        }
      }
    },
    invalidCredentials: {
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized'
    },
    emailExists: {
      statusCode: 409,
      message: 'Email already exists',
      error: 'Conflict'
    }
  }
};

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  pageLoad: 3000,  // 3 seconds
  apiResponse: 2000,  // 2 seconds
  interaction: 500,  // 500ms
  navigation: 2000  // 2 seconds
};

// Accessibility Test Data
export const ACCESSIBILITY_REQUIREMENTS = {
  minContrastRatio: 4.5,
  requiresAltText: true,
  requiresAriaLabels: true,
  requiresKeyboardNav: true,
  requiresFocusIndicators: true
};

// Helper function to generate unique email for testing
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}.${timestamp}.${random}@test.taska.co.za`;
}

// Helper function to generate unique phone number
export function generateTestPhone(): string {
  const randomDigits = Math.floor(Math.random() * 900000000) + 100000000;
  return `+2782${randomDigits}`;
}

// Helper function to generate random job title
export function generateJobTitle(category: string): string {
  const actions = ['Fix', 'Install', 'Repair', 'Replace', 'Maintain', 'Service'];
  const objects = {
    'Plumbing': ['Leaking Tap', 'Blocked Drain', 'Hot Water System', 'Toilet', 'Geyser'],
    'Electrical': ['Power Outlet', 'Light Fixture', 'Circuit Breaker', 'Ceiling Fan', 'Wiring'],
    'Carpentry': ['Cabinet', 'Door', 'Window Frame', 'Shelving', 'Deck'],
    'Painting': ['Bedroom', 'Living Room', 'Exterior Walls', 'Kitchen', 'Garage'],
    'Roofing': ['Roof Tiles', 'Gutters', 'Roof Leak', 'Flashing', 'Roof Insulation']
  };

  const action = actions[Math.floor(Math.random() * actions.length)];
  const objectList = objects[category as keyof typeof objects] || ['Item'];
  const object = objectList[Math.floor(Math.random() * objectList.length)];

  return `${action} ${object}`;
}

// Export all for convenience
export default {
  TEST_JOB,
  TEST_JOBS,
  TEST_BID,
  TEST_BIDS,
  TEST_USER,
  TEST_MESSAGES,
  TEST_REVIEWS,
  NAVIGATION_LINKS,
  CATEGORIES,
  PROVINCES,
  CITIES,
  URGENCY_LEVELS,
  BUDGET_TYPES,
  PAYMENT_METHODS,
  INVALID_TEST_DATA,
  MOCK_API_RESPONSES,
  PERFORMANCE_THRESHOLDS,
  ACCESSIBILITY_REQUIREMENTS,
  generateTestEmail,
  generateTestPhone,
  generateJobTitle
};
