# Artisan Jobs Page - Backend API Documentation

## Backend Architecture Analysis

**Status**: Backend dev server running on `localhost:3000` (port already in use - existing instance)

**Base URL**: `http://localhost:3000/api/v1`

**Authentication**: JWT Bearer token required for all protected endpoints

---

## API Endpoints for Artisan Jobs Page

### 1. Browse/Filter Available Jobs

#### GET `/jobs`
**Purpose**: Main endpoint for browsing and filtering available jobs for artisans

**Authentication**: Required (JWT)

**Query Parameters**:
```typescript
{
  // Search & Filtering
  search?: string;              // Search in title/description
  categoryId?: string;          // Filter by category
  status?: JobStatus;           // Filter by status (OPEN, IN_PROGRESS, etc.)
  budgetType?: BudgetType;      // FIXED | HOURLY | NEGOTIABLE
  urgency?: UrgencyLevel;       // LOW | MEDIUM | HIGH | URGENT
  minBudget?: number;           // Minimum budget filter
  maxBudget?: number;           // Maximum budget filter

  // Location-based
  city?: string;                // Filter by city
  province?: string;            // Filter by province
  latitude?: number;            // For distance-based search
  longitude?: number;           // For distance-based search
  radius?: number;              // Search radius in km (default: 25, max: 200)

  // Pagination & Sorting
  page?: number;                // Page number (default: 1)
  limit?: number;               // Items per page (default: 20)
  sortBy?: string;              // 'createdAt' | 'budget' | 'distance' | 'urgency'
  sortOrder?: string;           // 'asc' | 'desc'
}
```

**Response**:
```typescript
{
  data: Job[];                  // Array of job objects
  meta: {
    total: number;              // Total jobs matching query
    page: number;               // Current page
    limit: number;              // Items per page
    hasNextPage: boolean;       // More pages available
    hasPreviousPage: boolean;   // Previous pages available
  }
}
```

**Job Object Structure**:
```typescript
{
  id: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  budget: number;
  budgetType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  images: string[];            // Array of image URLs
  requirements: string[];      // Array of requirements
  startDate?: string;          // ISO date string
  endDate?: string;            // ISO date string
  createdAt: string;           // ISO date string
  updatedAt: string;           // ISO date string

  // Relations
  client: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      profilePictureUrl?: string;
    }
  };
  category: {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
  };
  bids: Bid[];                 // Array of bids (includes artisan's own bid)
  _count: {
    bids: number;              // Total bid count
    messages: number;          // Total message count
  }
}
```

---

### 2. Location-based Job Search

#### GET `/jobs/nearby`
**Purpose**: Find jobs near artisan's current location

**Authentication**: Required (ARTISAN role only)

**Query Parameters**:
```typescript
{
  latitude: number;            // Required - current latitude
  longitude: number;           // Required - current longitude
  radius?: number;             // Optional - search radius in km (default: 25)
  limit?: number;              // Optional - max results (default: 50)
}
```

**Response**: Array of jobs sorted by distance

---

### 3. Search Jobs by Keywords

#### GET `/jobs/search`
**Purpose**: Full-text search across job titles and descriptions

**Authentication**: Required (JWT)

**Query Parameters**:
```typescript
{
  q: string;                   // Required - search query
  categoryId?: string;         // Optional filters
  city?: string;
  province?: string;
  minBudget?: number;
  maxBudget?: number;
}
```

**Response**: Array of matching jobs

---

### 4. Get Single Job Details

#### GET `/jobs/:id`
**Purpose**: Get detailed information about a specific job

**Authentication**: Required (JWT)

**Path Parameters**:
- `id` - Job ID

**Authorization Rules**:
- Admin/Assessor: Can view all jobs
- Client: Can view their own jobs
- Artisan: Can view OPEN jobs or jobs they've bid on

**Response**: Single job object with full details

---

### 5. Get Artisan's Active Jobs

#### GET `/jobs/artisan/active`
**Purpose**: Get jobs where artisan has accepted bids (IN_PROGRESS status)

**Authentication**: Required (ARTISAN role only)

**Response**: Array of jobs where:
- Job status is `IN_PROGRESS`
- Artisan has an `ACCEPTED` bid
- Includes full client and bid details

---

### 6. Get Job Statistics

#### GET `/jobs/statistics`
**Purpose**: Get overall job statistics (useful for dashboard metrics)

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  total: number;               // Total jobs
  open: number;                // Open jobs count
  inProgress: number;          // In progress count
  completed: number;           // Completed count
  averageBudget: number;       // Average budget across all jobs
  totalBudget: number;         // Total budget value
}
```

---

## Bid Management Endpoints

### 1. Submit a Bid

#### POST `/bids`
**Purpose**: Submit a bid for a job

**Authentication**: Required (ARTISAN role only)

**Request Body**:
```typescript
{
  jobId: string;               // Required
  amount: number;              // Required - bid amount
  message: string;             // Required - proposal message
  estimatedDays: number;       // Required - estimated completion time
  attachments?: string[];      // Optional - portfolio items, quotes
}
```

**Response**: Created bid object

---

### 2. Get Artisan's Bids

#### GET `/bids/my-bids`
**Purpose**: Get all bids submitted by the artisan

**Authentication**: Required (ARTISAN role only)

**Response**: Array of bids with job details

---

### 3. Get Bid Statistics

#### GET `/bids/statistics`
**Purpose**: Get artisan's bid statistics

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  total: number;               // Total bids submitted
  pending: number;             // Pending bids
  accepted: number;            // Accepted bids
  rejected: number;            // Rejected bids
  withdrawn: number;           // Withdrawn bids
  expired: number;             // Expired bids
  acceptanceRate: number;      // Percentage of accepted bids
}
```

---

### 4. Update a Bid

#### PATCH `/bids/:id`
**Purpose**: Update an existing bid (only if still PENDING)

**Authentication**: Required (ARTISAN role only)

**Path Parameters**:
- `id` - Bid ID

**Request Body**:
```typescript
{
  amount?: number;
  message?: string;
  estimatedDays?: number;
  attachments?: string[];
}
```

**Response**: Updated bid object

---

### 5. Withdraw a Bid

#### POST `/bids/:id/withdraw`
**Purpose**: Withdraw a pending bid

**Authentication**: Required (ARTISAN role only)

**Path Parameters**:
- `id` - Bid ID

**Response**: Updated bid with `WITHDRAWN` status

---

## Category Endpoints

### 1. Get All Categories

#### GET `/categories`
**Purpose**: Get all active job categories for filtering

**Authentication**: Not required (public endpoint)

**Response**: Array of category objects
```typescript
{
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  parentId?: string;           // For category hierarchy
  sortOrder: number;
  children?: Category[];       // Subcategories
}
```

---

### 2. Get Single Category

#### GET `/categories/:id`
**Purpose**: Get detailed category information

**Authentication**: Not required (public endpoint)

**Response**: Single category object

---

## Database Schema Support

### Job Model
**Table**: `jobs`

**Key Fields for Artisan Jobs**:
- `status` - Job status (artisans primarily see OPEN jobs)
- `categoryId` - For category filtering
- `latitude`, `longitude` - For location-based search
- `budget`, `budgetType` - For budget filtering
- `urgency` - For urgency filtering
- `city`, `province` - For location filtering
- `images` - Job photos
- `requirements` - Job requirements array

**Indexes** (optimized for artisan queries):
- `status` - Fast status filtering
- `categoryId` - Fast category filtering
- `latitude, longitude` - Geospatial queries
- `createdAt` - Sorting by date

---

### Bid Model
**Table**: `bids`

**Key Fields**:
- `jobId` - Links to job
- `artisanId` - Links to artisan user
- `status` - PENDING | ACCEPTED | REJECTED | WITHDRAWN | EXPIRED
- `amount` - Bid amount
- `estimatedDays` - Completion estimate
- `expiresAt` - Bid expiration

**Unique Constraint**: `[jobId, artisanId]` - One bid per job per artisan

---

### ArtisanSpecialization Model
**Table**: `artisan_specializations`

**Purpose**: Track artisan skills and verified categories

**Key Fields**:
- `userId` - Artisan user ID
- `categoryId` - Category they specialize in
- `experience` - Years of experience
- `isVerified` - Verification status
- `portfolio` - Portfolio image URLs
- `certifications` - Certification URLs

**Usage**: Could be used for job matching recommendations

---

## Authentication & Authorization

### Required Headers
```
Authorization: Bearer <jwt_token>
```

### Role-Based Access Control

**ARTISAN Role Access**:
- ✅ Browse all OPEN jobs (`GET /jobs`)
- ✅ View jobs they've bid on
- ✅ View nearby jobs (`GET /jobs/nearby`)
- ✅ Submit bids (`POST /bids`)
- ✅ View their own bids (`GET /bids/my-bids`)
- ✅ Update/withdraw their bids
- ✅ View their active jobs (`GET /jobs/artisan/active`)
- ❌ Cannot create jobs
- ❌ Cannot view other artisans' bids on jobs

### JWT Token Structure
```typescript
{
  sub: string;                 // User ID
  email: string;
  role: 'ARTISAN' | 'CLIENT' | 'ADMIN' | 'ASSESSOR';
  iat: number;                 // Issued at
  exp: number;                 // Expires at
}
```

---

## Error Responses

### Standard Error Format
```typescript
{
  statusCode: number;
  message: string | string[];  // Can be array for validation errors
  error: string;               // Error type
  timestamp: string;           // ISO timestamp
  path: string;                // Request path
}
```

### Common Status Codes
- `200 OK` - Successful GET request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions (wrong role)
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (e.g., bid already exists)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Special Features

### 1. Geospatial Search
- Uses PostgreSQL `earthdistance` extension
- Efficient distance calculations
- Default radius: 25km, max: 200km
- Returns jobs sorted by distance

### 2. Full-Text Search
- Case-insensitive search
- Searches title and description
- Can be combined with filters

### 3. Smart Filtering
- Default behavior: Shows only OPEN and IN_PROGRESS jobs
- Multiple filters can be combined
- Budget range filtering
- Category hierarchy support

### 4. Pagination
- Default page size: 20 jobs
- Includes pagination metadata
- Efficient offset-based pagination

### 5. Activity Logging
- All job and bid actions are logged
- Audit trail in `activity_logs` table
- Includes old/new data for changes

---

## Frontend Integration Requirements

### 1. API Client Setup
```typescript
// Base API configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Axios interceptor for JWT token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 2. Job Browsing Component
**Required API Calls**:
1. `GET /categories` - Load category filter options
2. `GET /jobs` - Load jobs with filters/pagination
3. `GET /jobs/:id` - View job details

**State Management**:
- Current filters (category, budget, location, etc.)
- Pagination state (page, limit, total)
- Selected job for detail view
- Loading states

### 3. Job Search Component
**Required API Calls**:
1. `GET /jobs/search?q={query}` - Keyword search
2. `GET /jobs/nearby` - Location-based search

**Features**:
- Debounced search input
- Geolocation permission handling
- Combined text + filter search

### 4. Bidding Component
**Required API Calls**:
1. `POST /bids` - Submit new bid
2. `GET /bids/my-bids` - View existing bids
3. `PATCH /bids/:id` - Update pending bid
4. `POST /bids/:id/withdraw` - Withdraw bid

**Validation**:
- Amount must be positive
- Message required
- Estimated days must be positive
- Check for existing bid before submitting

### 5. Active Jobs Component
**Required API Calls**:
1. `GET /jobs/artisan/active` - Load active jobs
2. `PUT /jobs/:id/complete` - Mark job complete

**Features**:
- Show jobs where artisan has accepted bid
- Display client contact info
- Job status tracking

---

## Performance Considerations

### 1. Database Indexes
All critical queries are indexed:
- Job status filtering
- Category filtering
- Geospatial queries
- User/artisan lookups

### 2. Pagination
- Always use pagination for job lists
- Default limit: 20 jobs per page
- Max limit: 100 jobs per page

### 3. Caching Opportunities
**Static Data** (cache on frontend):
- Categories list (rarely changes)
- Province/city lists

**Dynamic Data** (short cache):
- Job listings (5-minute cache)
- Statistics (1-minute cache)

### 4. Rate Limiting
- Default: 100 requests per minute per IP
- Bid submission: 10 per minute
- Search: 30 per minute

---

## WebSocket Support (Real-time Features)

### Messages Gateway
**Endpoint**: `ws://localhost:3000`

**Events** (relevant for artisan jobs):
- `newBidReceived` - When another bid is placed on a job
- `bidStatusChanged` - When bid is accepted/rejected
- `jobStatusChanged` - When job status updates
- `newMessage` - New message in job conversation

**Authentication**: Pass JWT token in connection query
```typescript
const socket = io('ws://localhost:3000', {
  query: { token: jwtToken }
});
```

---

## Testing the API

### Using Swagger UI
**URL**: `http://localhost:3000/api/docs`

Features:
- Interactive API documentation
- Try out endpoints
- See request/response schemas
- Authentication testing

### Example Test Flow
1. Register artisan account: `POST /auth/register`
2. Login: `POST /auth/login`
3. Get categories: `GET /categories`
4. Browse jobs: `GET /jobs?status=OPEN&page=1&limit=20`
5. Submit bid: `POST /bids`
6. Check bid status: `GET /bids/my-bids`

---

## Missing Endpoints (Recommendations)

Based on common artisan job page patterns, consider adding:

1. **Job Recommendations**
   - `GET /jobs/recommended` - ML-based job matching
   - Based on: artisan specializations, past bids, location

2. **Saved Jobs**
   - `POST /jobs/:id/save` - Save job for later
   - `GET /jobs/saved` - Get saved jobs
   - `DELETE /jobs/:id/save` - Unsave job

3. **Job Notifications**
   - `GET /notifications` - Get artisan notifications
   - `POST /notifications/:id/read` - Mark as read

4. **Bid Analytics**
   - `GET /bids/analytics` - Detailed bid performance metrics
   - Win rate, average bid amount, response time

---

## Environment Variables

Required for backend operation:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taska

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# API
PORT=3000
API_PREFIX=api/v1
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3001
```

---

## Summary

### ✅ Existing & Ready to Use
- Complete job browsing with advanced filtering
- Category-based filtering
- Location-based job search
- Full bid management system
- Job statistics
- Authentication & authorization
- Geospatial queries
- Full-text search
- Pagination & sorting

### 🎯 Frontend Integration Points
1. Job browsing page with filters
2. Job detail view with bidding
3. Active jobs dashboard
4. Bid management interface
5. Location-based search

### 🔐 Security Implemented
- JWT authentication
- Role-based access control
- Activity logging
- Rate limiting
- Input validation

### 📊 Performance Optimized
- Database indexes on all critical fields
- Efficient geospatial queries
- Pagination support
- Query optimization

---

## Contact & Support

**Backend Server**: `http://localhost:3000`
**API Documentation**: `http://localhost:3000/api/docs`
**Health Check**: `http://localhost:3000/api/v1/health`

For any API questions or issues, coordinate with the backend team through the frontend-architect agent.
