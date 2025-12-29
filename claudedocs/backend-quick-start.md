# Backend Quick Start Guide - Client Dashboard

## Priority Endpoints (Implement First)

### 1. Dashboard Statistics
```typescript
GET /api/dashboard/stats
// Returns: totalJobs, activeJobs, completedJobs, totalSpent
```

### 2. Create Job
```typescript
POST /api/jobs
// Body: title, description, category, budget, urgency, location, images[]
// Returns: job object with id
```

### 3. Image Upload
```typescript
POST /api/upload/job-images
// Content-Type: multipart/form-data
// Files: images[] (max 5, 5MB each)
// Returns: { urls: string[] }
```

### 4. My Jobs List
```typescript
GET /api/jobs/my-jobs?limit=5
// Returns: { jobs: Job[], pagination }
```

### 5. Recent Bids
```typescript
GET /api/bids?limit=5&status=PENDING
// Returns: { bids: Bid[], pagination }
```

---

## Database Schema Requirements

### Jobs Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'OPEN',
  urgency VARCHAR(10) NOT NULL,
  location JSONB NOT NULL,
  requirements TEXT,
  timeline VARCHAR(255),
  images JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
);
```

### Bids Table
```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id),
  artisan_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  message TEXT NOT NULL,
  estimated_days INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  submitted_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_job_id (job_id),
  INDEX idx_artisan_id (artisan_id),
  INDEX idx_status (status)
);
```

---

## Image Upload Flow

1. **Client uploads images** → `POST /api/upload/job-images`
2. **Backend validates** files (type, size, count)
3. **Backend uploads** to cloud storage (S3/Cloudflare R2)
4. **Backend generates** CDN URLs
5. **Backend returns** `{ urls: string[] }`
6. **Client includes** URLs in job creation request

---

## Validation Rules

### Title
- Required: Yes
- Min Length: 5
- Max Length: 100

### Description
- Required: Yes
- Min Length: 20
- Max Length: 2000

### Budget
- Required: Yes
- Min: 100 (R100)
- Max: 1,000,000 (R1M)

### Category
- Required: Yes
- Must be one of: plumbing, electrical, carpentry, painting, gardening, cleaning, handyman, roofing, tiling, appliance, security, automotive

### Images
- Optional: Yes
- Max Files: 5
- Max Size: 5MB per file
- Allowed Types: image/jpeg, image/png, image/webp, image/gif

---

## Error Response Format

```typescript
{
  statusCode: 400,
  message: "Validation failed",
  errors: {
    title: ["Title must be at least 5 characters"],
    budget: ["Budget must be at least R100"]
  }
}
```

---

## Authentication

All endpoints require:
```
Authorization: Bearer <jwt_token>
```

Token should contain:
- userId
- email
- role (CLIENT, ARTISAN, ADMIN)

---

## Testing Checklist

- [ ] Can create job with all fields
- [ ] Can create job with optional fields omitted
- [ ] Image upload validates file types
- [ ] Image upload validates file sizes
- [ ] Dashboard stats calculate correctly
- [ ] Jobs list returns only user's jobs
- [ ] Bids list returns bids for user's jobs
- [ ] Unauthorized requests return 401
- [ ] Invalid data returns 400 with errors

---

## Environment Variables Needed

```env
# AWS S3 or Cloudflare R2
CLOUD_STORAGE_ACCESS_KEY=
CLOUD_STORAGE_SECRET_KEY=
CLOUD_STORAGE_BUCKET=
CLOUD_STORAGE_REGION=
CDN_BASE_URL=

# Database
DATABASE_URL=

# JWT
JWT_SECRET=
JWT_EXPIRY=15m

# Rate Limiting
RATE_LIMIT_JOB_CREATION=5  # per hour
RATE_LIMIT_IMAGE_UPLOAD=10 # per hour
```

---

## Rate Limiting

Implement rate limiting:
- Job creation: 5 per hour per user
- Image upload: 10 per hour per user
- Dashboard stats: 60 per hour per user

---

## Complete Documentation

See `client-dashboard-backend-requirements.md` for:
- All 13 endpoints specifications
- Complete data models
- Security requirements
- Performance considerations
- Testing requirements
- Future enhancements

---

## Questions?

Contact frontend architect agent with:
- API structure questions
- Data format clarifications
- Integration issues
- Additional requirements
