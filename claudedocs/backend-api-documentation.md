# Taska Platform - Backend API Documentation

## Overview
This document provides comprehensive API documentation for the Taska platform backend services, specifically focused on client dashboard functionality.

**Base URL**: `http://localhost:3000/api` (development)
**Authentication**: JWT Bearer Token
**Content-Type**: `application/json` (except file uploads)

---

## Authentication

All endpoints require authentication unless specified otherwise. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login
**Endpoint**: `POST /auth/login`
**Access**: Public
**Request Body**:
```json
{
  "email": "client@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### Logout
**Endpoint**: `POST /auth/logout`
**Access**: Authenticated
**Response**:
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User Profile
**Endpoint**: `GET /auth/profile`
**Access**: Authenticated
**Response**:
```json
{
  "id": "clxxx123456789",
  "email": "client@example.com",
  "role": "CLIENT",
  "verifiedAt": "2024-01-01T00:00:00.000Z",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+27123456789"
  }
}
```

---

## Categories API

### Get All Categories
**Endpoint**: `GET /categories`
**Access**: Public
**Description**: Retrieve all active job categories with their subcategories

**Response**:
```json
[
  {
    "id": "cat_001",
    "name": "Plumbing",
    "description": "All plumbing services",
    "iconUrl": "https://example.com/icons/plumbing.svg",
    "isActive": true,
    "sortOrder": 1,
    "children": [
      {
        "id": "cat_001_01",
        "name": "Leak Repairs",
        "description": "Fix leaking pipes and faucets",
        "isActive": true
      }
    ]
  }
]
```

### Get Category by ID
**Endpoint**: `GET /categories/:id`
**Access**: Public
**Description**: Get a specific category with its parent and children

**Response**:
```json
{
  "id": "cat_001",
  "name": "Plumbing",
  "description": "All plumbing services",
  "iconUrl": "https://example.com/icons/plumbing.svg",
  "isActive": true,
  "parent": null,
  "children": [...]
}
```

---

## Jobs API

### Create Job (Draft or Published)
**Endpoint**: `POST /jobs`
**Access**: CLIENT role required
**Description**: Create a new job posting. Jobs are created as drafts by default.

**Request Body**:
```json
{
  "title": "Fix leaking kitchen faucet",
  "description": "Kitchen faucet has been dripping for a week. Need professional plumber to fix or replace. Must provide warranty for parts.",
  "categoryId": "cat_001",
  "budget": 500.00,
  "budgetType": "FIXED",
  "urgency": "MEDIUM",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apartment 4B",
  "city": "Cape Town",
  "province": "Western Cape",
  "postalCode": "8001",
  "latitude": -33.9249,
  "longitude": 18.4241,
  "images": [
    "/uploads/jobs/job_1234567890.webp",
    "/uploads/jobs/job_1234567891.webp"
  ],
  "requirements": [
    "Must have plumbing license",
    "Provide own tools",
    "Available weekends"
  ],
  "startDate": "2024-01-15T09:00:00Z",
  "endDate": "2024-01-15T17:00:00Z",
  "isDraft": true
}
```

**Field Validations**:
- `title`: 5-100 characters
- `description`: 20-2000 characters
- `budget`: 50-100,000 ZAR
- `budgetType`: FIXED | HOURLY | NEGOTIABLE
- `urgency`: LOW | MEDIUM | HIGH | URGENT
- `images`: Max 5 URLs
- `requirements`: Max 10 items, each 200 chars max
- `isDraft`: Default true (saves as draft), false to publish immediately

**Response**:
```json
{
  "id": "job_001",
  "title": "Fix leaking kitchen faucet",
  "status": "DRAFT",
  "clientId": "user_001",
  "categoryId": "cat_001",
  "budget": 500.00,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "category": {
    "id": "cat_001",
    "name": "Plumbing"
  },
  "bids": [],
  "images": [...]
}
```

### Publish Job
**Endpoint**: `PUT /jobs/:id/publish`
**Access**: CLIENT role (job owner only)
**Description**: Publish a draft job to make it visible to artisans

**Response**:
```json
{
  "id": "job_001",
  "status": "OPEN",
  "updatedAt": "2024-01-01T00:05:00.000Z"
}
```

**Errors**:
- `400`: Job is not in DRAFT status
- `403`: Not the job owner

### Get My Jobs
**Endpoint**: `GET /jobs/my-jobs`
**Access**: CLIENT role required
**Description**: Get all jobs created by the authenticated client

**Response**:
```json
[
  {
    "id": "job_001",
    "title": "Fix leaking kitchen faucet",
    "status": "DRAFT",
    "budget": 500.00,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "category": {
      "name": "Plumbing"
    },
    "bids": [
      {
        "id": "bid_001",
        "amount": 450.00,
        "status": "PENDING"
      }
    ]
  }
]
```

### Get Job by ID
**Endpoint**: `GET /jobs/:id`
**Access**: Authenticated
**Description**: Get detailed job information

**Permission Rules**:
- Clients: Can view their own jobs
- Artisans: Can view OPEN jobs and jobs they've bid on
- Admins: Can view all jobs

**Response**:
```json
{
  "id": "job_001",
  "title": "Fix leaking kitchen faucet",
  "description": "Kitchen faucet has been dripping...",
  "status": "OPEN",
  "budget": 500.00,
  "budgetType": "FIXED",
  "urgency": "MEDIUM",
  "addressLine1": "123 Main Street",
  "city": "Cape Town",
  "province": "Western Cape",
  "latitude": -33.9249,
  "longitude": 18.4241,
  "images": ["/uploads/jobs/job_1234567890.webp"],
  "requirements": ["Must have plumbing license"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "category": {
    "id": "cat_001",
    "name": "Plumbing"
  },
  "client": {
    "id": "user_001",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "bids": [...]
}
```

### Update Job
**Endpoint**: `PATCH /jobs/:id`
**Access**: CLIENT (job owner) or ADMIN
**Description**: Update job details

**Restrictions**:
- Cannot update COMPLETED or CANCELLED jobs
- Cannot change budget after accepting a bid

**Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "budget": 600.00,
  "urgency": "HIGH"
}
```

**Response**: Updated job object

### Delete Job
**Endpoint**: `DELETE /jobs/:id`
**Access**: CLIENT (job owner) or ADMIN
**Description**: Delete a job posting

**Restrictions**:
- Clients can only delete DRAFT or CANCELLED jobs
- Cannot delete jobs with existing bids (except admins)
- Admins can delete any job

**Response**: `204 No Content`

**Errors**:
- `400`: Job has wrong status or has bids
- `403`: Not the job owner
- `404`: Job not found

### Cancel Job
**Endpoint**: `PUT /jobs/:id/cancel`
**Access**: CLIENT (job owner) or ADMIN
**Request Body**:
```json
{
  "reason": "Found another solution"
}
```

**Response**:
```json
{
  "id": "job_001",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-01T00:10:00.000Z",
  "cancellationReason": "Found another solution"
}
```

### Complete Job
**Endpoint**: `PUT /jobs/:id/complete`
**Access**: CLIENT (job owner), assigned ARTISAN, or ADMIN
**Description**: Mark job as completed

**Restrictions**:
- Only IN_PROGRESS jobs can be completed
- Either client or assigned artisan can mark complete

**Response**:
```json
{
  "id": "job_001",
  "status": "COMPLETED",
  "completedAt": "2024-01-15T17:00:00.000Z"
}
```

### Get All Jobs (with filtering)
**Endpoint**: `GET /jobs`
**Access**: Public/Authenticated
**Description**: Get paginated list of jobs with filters

**Query Parameters**:
- `search` - Search in title and description
- `categoryId` - Filter by category
- `status` - Filter by status (DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED)
- `budgetType` - Filter by budget type
- `urgency` - Filter by urgency level
- `minBudget` - Minimum budget filter
- `maxBudget` - Maximum budget filter
- `city` - Filter by city
- `province` - Filter by province
- `latitude` / `longitude` / `radius` - Location-based search
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - asc or desc

**Example Request**:
```
GET /jobs?categoryId=cat_001&city=Cape%20Town&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Response**:
```json
{
  "data": [
    {
      "id": "job_001",
      "title": "Fix leaking kitchen faucet",
      "status": "OPEN",
      "budget": 500.00,
      "city": "Cape Town",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Get Job Statistics
**Endpoint**: `GET /jobs/statistics`
**Access**: Authenticated
**Description**: Get job statistics (for clients, returns their own stats)

**Response**:
```json
{
  "totalJobs": 15,
  "draftJobs": 3,
  "openJobs": 5,
  "inProgressJobs": 4,
  "completedJobs": 2,
  "cancelledJobs": 1,
  "totalBudget": 7500.00,
  "averageBudget": 500.00
}
```

---

## Image Upload API

### Upload Single Image
**Endpoint**: `POST /jobs/upload-image`
**Access**: CLIENT role required
**Content-Type**: `multipart/form-data`
**Description**: Upload a single job image

**Form Data**:
- `file` - Image file (JPEG, PNG, WebP)

**Validations**:
- Max file size: 5MB
- Allowed formats: JPEG, PNG, WebP
- Images are automatically optimized and converted to WebP

**Response**:
```json
{
  "url": "/uploads/jobs/job_1234567890.webp",
  "size": 245678,
  "format": "webp"
}
```

**Usage Example (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/jobs/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { url } = await response.json();
// Use this URL in the job creation images array
```

### Upload Multiple Images
**Endpoint**: `POST /jobs/upload-images`
**Access**: CLIENT role required
**Content-Type**: `multipart/form-data`
**Description**: Upload multiple job images (max 5)

**Form Data**:
- `files` - Array of image files

**Response**:
```json
[
  {
    "url": "/uploads/jobs/job_1234567890.webp",
    "size": 245678,
    "format": "webp"
  },
  {
    "url": "/uploads/jobs/job_1234567891.webp",
    "size": 198432,
    "format": "webp"
  }
]
```

**Usage Example (JavaScript)**:
```javascript
const formData = new FormData();
imageFiles.forEach(file => {
  formData.append('files', file);
});

const response = await fetch('/api/jobs/upload-images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const uploadedImages = await response.json();
const imageUrls = uploadedImages.map(img => img.url);
// Use these URLs in the job creation images array
```

---

## Complete Job Creation Workflow

### Recommended Flow

1. **Upload Images First**
```javascript
// Upload images
const imageUrls = await uploadImages(files);
```

2. **Create Job as Draft**
```javascript
const job = await createJob({
  title: "Fix leaking faucet",
  description: "...",
  categoryId: selectedCategory,
  budget: 500,
  budgetType: "FIXED",
  urgency: "MEDIUM",
  // ... address fields
  images: imageUrls,
  isDraft: true  // Save as draft
});
```

3. **Review and Publish**
```javascript
// When ready to publish
await publishJob(job.id);
```

### Alternative: Direct Publish
```javascript
const job = await createJob({
  // ... job data
  isDraft: false  // Publish immediately
});
```

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be at least 5 characters"
    }
  ]
}
```

**401 Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized - invalid or expired token"
}
```

**403 Forbidden**:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to perform this action"
}
```

**404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "Job not found"
}
```

**500 Internal Server Error**:
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **Limit**: 10 requests per 60 seconds per IP
- **Headers**: Rate limit info included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

**429 Too Many Requests**:
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later"
}
```

---

## Development Notes

### Database Schema
Jobs are stored with the following key relationships:
- Jobs → Categories (many-to-one)
- Jobs → Users (client relationship)
- Jobs → Bids (one-to-many)
- Jobs → Messages (one-to-many)
- Jobs → Reviews (one-to-many)

### Job Status Transitions
```
DRAFT → OPEN → IN_PROGRESS → COMPLETED
  ↓       ↓         ↓
CANCELLED (from any status)
```

### Image Storage
- Images are stored in: `/uploads/jobs/`
- Thumbnails in: `/uploads/jobs/thumbnails/`
- All images converted to WebP format for optimization
- Original aspect ratio maintained, max dimension: 1920x1080

### Security
- All client-specific endpoints verify job ownership
- JWT tokens expire after 24 hours
- Refresh tokens available for extended sessions
- Passwords hashed with bcrypt
- Input validation on all endpoints
- SQL injection prevention via Prisma ORM

---

## Testing Endpoints

### Using cURL

**Create Job**:
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix leaking faucet",
    "description": "Kitchen faucet needs repair",
    "categoryId": "cat_001",
    "budget": 500,
    "budgetType": "FIXED",
    "urgency": "MEDIUM",
    "addressLine1": "123 Main St",
    "city": "Cape Town",
    "province": "Western Cape",
    "postalCode": "8001",
    "latitude": -33.9249,
    "longitude": 18.4241,
    "isDraft": true
  }'
```

**Upload Image**:
```bash
curl -X POST http://localhost:3000/api/jobs/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### Using Postman

1. Set Authorization header: `Bearer YOUR_TOKEN`
2. For file uploads:
   - Set body type to `form-data`
   - Add key `file` or `files` with type `File`
   - Select image file(s)

---

## Support

For API issues or questions:
- Check backend logs: `backend/logs/`
- Review Prisma schema: `backend/prisma/schema.prisma`
- API documentation: Available at `/api/docs` (Swagger UI)

---

## Changelog

### Version 1.0.0 (Current)
- Initial API implementation
- Job CRUD operations
- Image upload functionality
- Draft/publish workflow
- Categories API
- Authentication and authorization
- Rate limiting and security features
