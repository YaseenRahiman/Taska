# Taska Platform API Documentation

**Version**: 1.0.0
**Base URL**: `https://api.taska.co.za/api/v1` (Production)
**Base URL**: `http://localhost:3000/api/v1` (Development)
**Authentication**: Bearer Token (JWT)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Jobs API](#jobs-api)
4. [Bids API](#bids-api)
5. [Payments API](#payments-api)
6. [Messages API](#messages-api)
7. [Reviews API](#reviews-api)
8. [Admin API](#admin-api)
9. [Health Check API](#health-check-api)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Data Models](#data-models)

---

## Overview

The Taska Platform API is a RESTful API built with NestJS that connects skilled artisans with clients in South Africa. The API supports:

- ✅ User authentication and authorization
- ✅ Job posting and management
- ✅ Bidding system for artisans
- ✅ Secure payment processing (Stripe & PayFast)
- ✅ Real-time messaging
- ✅ Review and rating system
- ✅ Admin moderation tools
- ✅ Location-based job matching

### Key Features

- **Role-based Access Control**: CLIENT, ARTISAN, ADMIN, ASSESSOR
- **Multi-payment Support**: Stripe for international, PayFast for South African payments
- **Escrow System**: Secure payment holding until job completion
- **Real-time Updates**: WebSocket support for instant notifications
- **Comprehensive Validation**: Input validation using class-validator
- **API Documentation**: Auto-generated Swagger/OpenAPI docs at `/api/docs`

---

## Authentication

All authenticated endpoints require a valid JWT token in the `Authorization` header.

### Base Path: `/auth`

### 1. Register New User

**POST** `/auth/register`

Register a new user account (CLIENT, ARTISAN, ADMIN, or ASSESSOR).

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "role": "CLIENT",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+27123456789"
}
```

**Validation Rules**:
- `email`: Valid email format (required)
- `password`: Min 8 chars, must contain uppercase, lowercase, number, special char (required)
- `role`: CLIENT | ARTISAN | ADMIN | ASSESSOR (optional, defaults to CLIENT)
- `firstName`: Max 50 chars (required)
- `lastName`: Max 50 chars (required)
- `phoneNumber`: South African format `+27xxxxxxxxx` (optional)

**Response** (201 Created):
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "clxxx123456789"
}
```

**Error Responses**:
- `400`: Validation errors
- `409`: Email already exists

---

### 2. Verify Email

**POST** `/auth/verify-email`

Verify email address using token sent via email.

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "message": "Email verified successfully"
}
```

**Error Responses**:
- `400`: Invalid token or already verified

---

### 3. Login

**POST** `/auth/login`

Authenticate user and receive JWT tokens.

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Headers Tracked**:
- `X-Forwarded-For`: IP address for security logging
- `User-Agent`: Device tracking

**Error Responses**:
- `401`: Invalid credentials or unverified email
- `429`: Too many failed attempts (rate limited)

---

### 4. Refresh Token

**POST** `/auth/refresh-token`

Refresh access token using refresh token.

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Error Responses**:
- `401`: Invalid or expired refresh token

---

### 5. Change Password

**POST** `/auth/change-password`
🔒 **Requires Authentication**

Change password for authenticated user.

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses**:
- `400`: Invalid current password or validation errors
- `401`: Unauthorized (invalid/expired token)

---

### 6. Request Password Reset

**POST** `/auth/request-password-reset`

Request password reset link via email.

**Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

*Note: Response is always success to prevent email enumeration*

---

### 7. Reset Password

**POST** `/auth/reset-password`

Reset password using token from email.

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword789!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses**:
- `400`: Invalid or expired token

---

### 8. Logout

**POST** `/auth/logout`
🔒 **Requires Authentication**

Logout user and invalidate tokens.

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body** (Optional):
```json
{
  "deviceId": "device-uuid-12345"
}
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

### 9. Get Profile

**GET** `/auth/profile`
🔒 **Requires Authentication**

Get current authenticated user profile.

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "clxxx123456789",
  "email": "john.doe@example.com",
  "role": "CLIENT",
  "verifiedAt": "2024-01-01T00:00:00.000Z",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+27123456789",
    "avatarUrl": "https://...",
    "city": "Cape Town",
    "province": "Western Cape"
  }
}
```

---

## Jobs API

### Base Path: `/jobs`

All endpoints require authentication unless specified.

### 1. Create Job

**POST** `/jobs`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT**

Create a new job posting.

**Request Body**:
```json
{
  "title": "Fix Kitchen Sink",
  "description": "Kitchen sink is leaking and needs urgent repair",
  "categoryId": "cat_plumbing_001",
  "budgetMin": 500,
  "budgetMax": 1000,
  "budgetType": "FIXED",
  "urgencyLevel": "HIGH",
  "preferredDate": "2024-12-25T10:00:00Z",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apartment 4B",
  "city": "Cape Town",
  "province": "Western Cape",
  "postalCode": "8001",
  "latitude": -33.9249,
  "longitude": 18.4241,
  "requirements": ["Bring own tools", "Available weekends"],
  "images": ["url1", "url2"]
}
```

**Response** (201 Created):
```json
{
  "id": "job_12345",
  "title": "Fix Kitchen Sink",
  "status": "OPEN",
  "createdAt": "2024-01-01T10:00:00Z",
  "expiresAt": "2024-01-08T10:00:00Z"
}
```

**Error Responses**:
- `400`: Validation errors
- `403`: Forbidden - only clients can create jobs

---

### 2. Get All Jobs

**GET** `/jobs`
🔒 **Requires Authentication**

Get jobs with filtering, pagination, and location-based search.

**Query Parameters**:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `search` | string | Search in title/description | - |
| `categoryId` | string | Filter by category | - |
| `status` | enum | OPEN, IN_PROGRESS, COMPLETED, CANCELLED | - |
| `budgetType` | enum | FIXED, HOURLY, NEGOTIABLE | - |
| `urgency` | enum | LOW, MEDIUM, HIGH, URGENT | - |
| `minBudget` | number | Minimum budget (ZAR) | - |
| `maxBudget` | number | Maximum budget (ZAR) | - |
| `city` | string | Filter by city | - |
| `province` | string | Filter by province | - |
| `latitude` | number | Latitude for location search | - |
| `longitude` | number | Longitude for location search | - |
| `radius` | number | Search radius in km | 25 |
| `page` | number | Page number | 1 |
| `limit` | number | Items per page | 20 |
| `sortBy` | string | Sort field | createdAt |
| `sortOrder` | enum | asc, desc | desc |

**Example Request**:
```
GET /jobs?categoryId=cat_plumbing_001&city=Cape Town&status=OPEN&page=1&limit=10
```

**Response** (200 OK):
```json
{
  "jobs": [
    {
      "id": "job_12345",
      "title": "Fix Kitchen Sink",
      "description": "Kitchen sink leaking...",
      "categoryId": "cat_plumbing_001",
      "category": {
        "id": "cat_plumbing_001",
        "name": "Plumbing"
      },
      "status": "OPEN",
      "budgetMin": 500,
      "budgetMax": 1000,
      "urgencyLevel": "HIGH",
      "city": "Cape Town",
      "province": "Western Cape",
      "distance": 5.2,
      "bidCount": 3,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### 3. Get My Jobs

**GET** `/jobs/my-jobs`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT**

Get jobs created by the authenticated client.

**Response** (200 OK):
```json
{
  "jobs": [
    {
      "id": "job_12345",
      "title": "Fix Kitchen Sink",
      "status": "OPEN",
      "bidCount": 5,
      "viewCount": 23,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

---

### 4. Get Job Statistics

**GET** `/jobs/statistics`
🔒 **Requires Authentication**

Get aggregated job statistics.

**Response** (200 OK):
```json
{
  "totalJobs": 1250,
  "openJobs": 320,
  "inProgressJobs": 180,
  "completedJobs": 700,
  "averageBudget": 1500,
  "totalValue": 1875000,
  "jobsByCategory": [
    {
      "categoryId": "cat_plumbing_001",
      "categoryName": "Plumbing",
      "count": 450
    }
  ],
  "jobsByProvince": [
    {
      "province": "Western Cape",
      "count": 520
    }
  ]
}
```

---

### 5. Find Nearby Jobs

**GET** `/jobs/nearby`
🔒 **Requires Authentication** | 🎭 **Role: ARTISAN**

Find jobs near artisan's location.

**Query Parameters**:
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate
- `radius` (optional): Search radius in km (default: 25)
- `limit` (optional): Max results (default: 50)

**Example Request**:
```
GET /jobs/nearby?latitude=-33.9249&longitude=18.4241&radius=10&limit=20
```

**Response** (200 OK):
```json
{
  "jobs": [
    {
      "id": "job_12345",
      "title": "Fix Kitchen Sink",
      "distance": 2.3,
      "budgetMin": 500,
      "budgetMax": 1000,
      "urgencyLevel": "HIGH"
    }
  ],
  "count": 15
}
```

---

### 6. Search Jobs

**GET** `/jobs/search`
🔒 **Requires Authentication**

Full-text search for jobs.

**Query Parameters**:
- `q` (required): Search query
- `categoryId` (optional): Filter by category
- `city` (optional): Filter by city
- `province` (optional): Filter by province
- `minBudget` (optional): Minimum budget
- `maxBudget` (optional): Maximum budget

**Example Request**:
```
GET /jobs/search?q=plumbing+emergency&city=Cape Town&minBudget=500
```

**Response** (200 OK):
```json
{
  "results": [
    {
      "id": "job_12345",
      "title": "Emergency Plumbing Required",
      "relevanceScore": 0.95,
      "matchedFields": ["title", "description"]
    }
  ],
  "total": 12
}
```

---

### 7. Get Job by ID

**GET** `/jobs/:id`
🔒 **Requires Authentication**

Get detailed job information.

**Response** (200 OK):
```json
{
  "id": "job_12345",
  "title": "Fix Kitchen Sink",
  "description": "Detailed description...",
  "status": "OPEN",
  "client": {
    "id": "user_client_001",
    "firstName": "John",
    "lastName": "Doe",
    "rating": 4.8,
    "completedJobs": 15
  },
  "category": {
    "id": "cat_plumbing_001",
    "name": "Plumbing"
  },
  "budgetMin": 500,
  "budgetMax": 1000,
  "urgencyLevel": "HIGH",
  "location": {
    "addressLine1": "123 Main Street",
    "city": "Cape Town",
    "province": "Western Cape",
    "latitude": -33.9249,
    "longitude": 18.4241
  },
  "images": ["url1", "url2"],
  "requirements": ["Bring own tools"],
  "bidCount": 5,
  "viewCount": 45,
  "createdAt": "2024-01-01T10:00:00Z",
  "expiresAt": "2024-01-08T10:00:00Z"
}
```

**Error Responses**:
- `404`: Job not found
- `403`: No permission to view job

---

### 8. Update Job

**PATCH** `/jobs/:id`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT, ADMIN**

Update job details (only owner or admin).

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "budgetMax": 1200,
  "urgencyLevel": "URGENT"
}
```

**Response** (200 OK):
```json
{
  "id": "job_12345",
  "title": "Updated Title",
  "updatedAt": "2024-01-02T10:00:00Z"
}
```

**Error Responses**:
- `400`: Job cannot be updated (e.g., already in progress)
- `403`: Not job owner
- `404`: Job not found

---

### 9. Publish Draft Job

**PUT** `/jobs/:id/publish`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT**

Publish a draft job to make it visible to artisans.

**Response** (200 OK):
```json
{
  "id": "job_12345",
  "status": "OPEN",
  "publishedAt": "2024-01-01T10:00:00Z"
}
```

---

### 10. Cancel Job

**PUT** `/jobs/:id/cancel`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT, ADMIN**

Cancel a job with reason.

**Request Body**:
```json
{
  "reason": "Found alternative solution"
}
```

**Response** (200 OK):
```json
{
  "id": "job_12345",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-02T10:00:00Z",
  "cancellationReason": "Found alternative solution"
}
```

---

### 11. Complete Job

**PUT** `/jobs/:id/complete`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT, ARTISAN, ADMIN**

Mark job as completed.

**Response** (200 OK):
```json
{
  "id": "job_12345",
  "status": "COMPLETED",
  "completedAt": "2024-01-05T10:00:00Z"
}
```

---

## Bids API

### Base Path: `/bids`

### 1. Submit Bid

**POST** `/bids`
🔒 **Requires Authentication** | 🎭 **Role: ARTISAN**

Submit a bid for a job.

**Request Body**:
```json
{
  "jobId": "job_12345",
  "amount": 750,
  "estimatedDays": 2,
  "message": "I have 10+ years experience with similar projects. I can start immediately.",
  "expiryDate": "2024-01-08T10:00:00Z",
  "proposedStartDate": "2024-01-03T08:00:00Z"
}
```

**Validation**:
- Amount must be within job budget range
- Cannot submit duplicate bids for same job
- Job must be in OPEN status

**Response** (201 Created):
```json
{
  "id": "bid_67890",
  "jobId": "job_12345",
  "artisanId": "user_artisan_001",
  "amount": 750,
  "status": "PENDING",
  "createdAt": "2024-01-01T12:00:00Z"
}
```

**Error Responses**:
- `400`: Invalid data or duplicate bid
- `403`: Only artisans can submit bids
- `404`: Job not found

---

### 2. Get All Bids

**GET** `/bids`
🔒 **Requires Authentication**

Get bids with filtering.

**Query Parameters**:
- `status`: PENDING, ACCEPTED, REJECTED, WITHDRAWN, EXPIRED
- `jobId`: Filter by job
- `artisanId`: Filter by artisan
- `minAmount`: Minimum bid amount
- `maxAmount`: Maximum bid amount
- `page`: Page number
- `limit`: Items per page

**Response** (200 OK):
```json
{
  "bids": [
    {
      "id": "bid_67890",
      "jobId": "job_12345",
      "artisan": {
        "id": "user_artisan_001",
        "firstName": "Jane",
        "lastName": "Smith",
        "rating": 4.9,
        "completedJobs": 87
      },
      "amount": 750,
      "status": "PENDING",
      "estimatedDays": 2,
      "message": "I have 10+ years experience...",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### 3. Get Bid Statistics

**GET** `/bids/statistics`
🔒 **Requires Authentication**

Get bid statistics for current user.

**Response** (200 OK):
```json
{
  "totalBids": 45,
  "pendingBids": 12,
  "acceptedBids": 28,
  "rejectedBids": 5,
  "averageBidAmount": 850,
  "winRate": 62.2,
  "totalEarnings": 23800
}
```

---

### 4. Get My Bids

**GET** `/bids/my-bids`
🔒 **Requires Authentication** | 🎭 **Role: ARTISAN**

Get all bids submitted by authenticated artisan.

**Response** (200 OK):
```json
{
  "bids": [
    {
      "id": "bid_67890",
      "job": {
        "id": "job_12345",
        "title": "Fix Kitchen Sink",
        "status": "OPEN"
      },
      "amount": 750,
      "status": "PENDING",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

### 5. Get Bids for Job

**GET** `/bids/job/:jobId`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT, ADMIN, ASSESSOR**

Get all bids for a specific job (job owner only).

**Response** (200 OK):
```json
{
  "jobId": "job_12345",
  "bidCount": 5,
  "bids": [
    {
      "id": "bid_67890",
      "artisan": {
        "id": "user_artisan_001",
        "firstName": "Jane",
        "rating": 4.9,
        "completedJobs": 87,
        "specializations": ["Plumbing", "General Maintenance"]
      },
      "amount": 750,
      "estimatedDays": 2,
      "message": "I have 10+ years experience...",
      "status": "PENDING",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "analytics": {
    "averageAmount": 820,
    "lowestBid": 650,
    "highestBid": 950,
    "averageEstimatedDays": 2.4
  }
}
```

---

### 6. Get Job Bid Analytics

**GET** `/bids/job/:jobId/analytics`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT, ADMIN, ASSESSOR**

Get bid analytics for a specific job.

**Response** (200 OK):
```json
{
  "totalBids": 5,
  "averageAmount": 820,
  "lowestBid": 650,
  "highestBid": 950,
  "medianAmount": 800,
  "averageEstimatedDays": 2.4,
  "bidsByDay": [
    {
      "date": "2024-01-01",
      "count": 3
    }
  ],
  "topArtisans": [
    {
      "artisanId": "user_artisan_001",
      "rating": 4.9,
      "amount": 750
    }
  ]
}
```

---

### 7. Get Bid by ID

**GET** `/bids/:id`
🔒 **Requires Authentication**

Get specific bid details.

**Response** (200 OK):
```json
{
  "id": "bid_67890",
  "job": {
    "id": "job_12345",
    "title": "Fix Kitchen Sink"
  },
  "artisan": {
    "id": "user_artisan_001",
    "firstName": "Jane",
    "lastName": "Smith",
    "rating": 4.9
  },
  "amount": 750,
  "status": "PENDING",
  "estimatedDays": 2,
  "message": "I have 10+ years experience...",
  "createdAt": "2024-01-01T12:00:00Z",
  "expiresAt": "2024-01-08T12:00:00Z"
}
```

---

### 8. Update Bid

**PATCH** `/bids/:id`
🔒 **Requires Authentication** | 🎭 **Role: ARTISAN**

Update bid details (only if status is PENDING).

**Request Body**:
```json
{
  "amount": 800,
  "estimatedDays": 3,
  "message": "Updated proposal with detailed timeline"
}
```

**Response** (200 OK):
```json
{
  "id": "bid_67890",
  "amount": 800,
  "estimatedDays": 3,
  "updatedAt": "2024-01-01T14:00:00Z"
}
```

**Error Responses**:
- `400`: Bid cannot be updated (not PENDING)
- `403`: Can only update own bids

---

### 9. Accept Bid

**POST** `/bids/:id/accept`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT, ADMIN**

Accept a bid (job owner only).

**Response** (200 OK):
```json
{
  "id": "bid_67890",
  "status": "ACCEPTED",
  "acceptedAt": "2024-01-01T15:00:00Z",
  "job": {
    "id": "job_12345",
    "status": "IN_PROGRESS"
  }
}
```

**Side Effects**:
- Job status changes to IN_PROGRESS
- All other bids automatically rejected
- Payment escrow initiated
- Notifications sent to artisan

---

### 10. Reject Bid

**POST** `/bids/:id/reject`
🔒 **Requires Authentication** | 🎭 **Role: CLIENT, ADMIN**

Reject a bid with reason.

**Request Body**:
```json
{
  "reason": "Budget too high"
}
```

**Response** (200 OK):
```json
{
  "id": "bid_67890",
  "status": "REJECTED",
  "rejectedAt": "2024-01-01T15:00:00Z",
  "rejectionReason": "Budget too high"
}
```

---

### 11. Withdraw Bid

**POST** `/bids/:id/withdraw`
🔒 **Requires Authentication** | 🎭 **Role: ARTISAN**

Withdraw own bid.

**Response** (200 OK):
```json
{
  "id": "bid_67890",
  "status": "WITHDRAWN",
  "withdrawnAt": "2024-01-01T16:00:00Z"
}
```

---

## Payments API

### Base Path: `/payments`

*Full payment API documentation available in separate Payments API section*

Key endpoints:
- `POST /payments/create-intent` - Create Stripe payment intent
- `POST /payments/payfast/notify` - PayFast webhook handler
- `GET /payments/wallet/balance` - Get wallet balance
- `POST /payments/escrow/release` - Release escrowed payment
- `GET /payments/transactions` - Get payment history

---

## Messages API

### Base Path: `/messages`

*Real-time messaging with encryption support*

Key endpoints:
- `POST /messages` - Send message
- `GET /messages/conversation/:userId` - Get conversation
- `POST /messages/mark-read` - Mark messages as read
- `GET /messages/unread-count` - Get unread count

---

## Reviews API

### Base Path: `/reviews`

Key endpoints:
- `POST /reviews` - Submit review
- `GET /reviews/artisan/:artisanId` - Get artisan reviews
- `GET /reviews/job/:jobId` - Get job review

---

## Admin API

### Base Path: `/admin`

🔒 **All endpoints require ADMIN role**

Key endpoints:
- `GET /admin/analytics` - Platform analytics
- `GET /admin/users` - User management
- `GET /admin/jobs` - Job moderation
- `PATCH /admin/users/:id/verify` - Verify artisan credentials

---

## Health Check API

### Base Path: `/health`

**GET** `/health`

Basic health check.

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T10:00:00Z",
  "uptime": 86400
}
```

---

**GET** `/health/detailed`

Detailed health check with dependencies.

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T10:00:00Z",
  "services": {
    "database": {
      "status": "up",
      "responseTime": 5
    },
    "redis": {
      "status": "up",
      "responseTime": 2
    },
    "stripe": {
      "status": "up"
    }
  }
}
```

---

## Error Handling

All API errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ],
  "timestamp": "2024-01-01T10:00:00Z",
  "path": "/api/v1/auth/register"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 204 | No Content | Successful request with no response body |
| 400 | Bad Request | Validation errors or malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource or state conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

---

## Rate Limiting

Rate limits apply per IP address and user account:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Job Creation | 10 requests | 1 hour |
| Bid Submission | 20 requests | 1 hour |
| General API | 100 requests | 15 minutes |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR';
  verifiedAt: Date | null;
  createdAt: Date;
  profile: Profile;
}
```

### Job
```typescript
interface Job {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  categoryId: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  clientId: string;
  location: JobLocation;
  createdAt: Date;
  expiresAt: Date;
}
```

### Bid
```typescript
interface Bid {
  id: string;
  jobId: string;
  artisanId: string;
  amount: number;
  estimatedDays: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  message: string;
  createdAt: Date;
  expiresAt: Date;
}
```

---

## Webhooks

### PayFast Webhook

**POST** `/payments/payfast/notify`

Receives payment notifications from PayFast.

**Verification**: Request signature verification required

---

## SDK & Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login
const { data } = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// Set token for authenticated requests
api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

// Create job
const job = await api.post('/jobs', {
  title: 'Fix Kitchen Sink',
  description: 'Urgent repair needed',
  categoryId: 'cat_plumbing_001',
  budgetMin: 500,
  budgetMax: 1000
});
```

### Python

```python
import requests

BASE_URL = 'http://localhost:3000/api/v1'

# Login
response = requests.post(f'{BASE_URL}/auth/login', json={
    'email': 'user@example.com',
    'password': 'password123'
})
token = response.json()['accessToken']

# Set token
headers = {'Authorization': f'Bearer {token}'}

# Create job
job = requests.post(f'{BASE_URL}/jobs', headers=headers, json={
    'title': 'Fix Kitchen Sink',
    'description': 'Urgent repair needed',
    'categoryId': 'cat_plumbing_001',
    'budgetMin': 500,
    'budgetMax': 1000
})
```

---

## Support

- **API Documentation**: `https://api.taska.co.za/api/docs` (Swagger UI)
- **Developer Support**: dev@taska.co.za
- **Status Page**: https://status.taska.co.za

---

**Last Updated**: 2025-01-09
**API Version**: 1.0.0
