# Backend Testing Guide

Quick reference for running and testing the Taska backend API.

## Starting the Backend

```bash
# Development mode with auto-reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

**Backend URL**: http://localhost:3000
**API Base**: http://localhost:3000/api/v1
**API Docs**: http://localhost:3000/api/docs

## Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 123.456,
  "services": {
    "database": { "status": "healthy" }
  }
}
```

## Testing Authentication

### Quick Test Script

```bash
node test-auth-flow.js
```

This tests:
- ✅ User registration
- ✅ User login
- ✅ Profile retrieval
- ✅ Token structure validation

### Manual API Testing

#### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "role": "CLIENT",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+27123456789"
  }'
```

Response includes:
- `accessToken` - Use this for authenticated requests
- `refreshToken` - Use this to get new access tokens
- `expiresIn` - Token expiration time (86400 seconds = 24 hours)
- `user` - User profile data

#### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

#### 3. Get Profile (Authenticated)

```bash
# Replace {TOKEN} with your accessToken
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer {TOKEN}"
```

## Database Management

### Check Migration Status
```bash
npx prisma migrate status
```

### Apply Migrations
```bash
npx prisma migrate dev
```

### Reset Database (WARNING: Deletes all data)
```bash
npx prisma migrate reset --force
```

### Seed Database
```bash
npm run db:seed
```

## Common Issues

### Issue: Backend won't start
**Symptom**: Server hangs at startup
**Cause**: Redis/BullModule blocking (currently disabled)
**Solution**: BullModule is commented out in `src/app.module.ts` for development

### Issue: Database connection error
**Symptom**: "Can't reach database server"
**Solution**:
1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Run: `npx prisma db push`

### Issue: Authentication fails
**Symptom**: 401 Unauthorized errors
**Solution**:
1. Verify JWT_SECRET is set in `.env`
2. Check token is being sent in Authorization header
3. Ensure token hasn't expired

## Environment Variables

Required variables in `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_dev"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

## Running E2E Tests

### Playwright Tests
```bash
# Start backend first
npm run start:dev

# In another terminal, run frontend tests
cd ../frontend
npm run test:e2e
```

### Backend Integration Tests
```bash
npm run test:e2e
```

## API Endpoints Quick Reference

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/profile` - Get current user (requires auth)
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/change-password` - Change password (requires auth)
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Jobs
- `GET /jobs` - List jobs
- `POST /jobs` - Create job (requires auth)
- `GET /jobs/:id` - Get job details
- `PATCH /jobs/:id` - Update job (requires auth)
- `DELETE /jobs/:id` - Delete job (requires auth)

### Bids
- `GET /bids` - List bids (requires auth)
- `POST /bids` - Create bid (requires auth)
- `POST /bids/:id/accept` - Accept bid (requires auth)
- `POST /bids/:id/reject` - Reject bid (requires auth)

## Debugging

### View Logs
Backend logs are output to console when running in dev mode.

### Check Database
```bash
# Open Prisma Studio (database GUI)
npx prisma studio
```

### Test Specific Endpoint
```bash
# Replace {endpoint} with the path
curl -v http://localhost:3000/api/v1/{endpoint}
```

## Performance Testing

### Load Testing (if k6 installed)
```bash
npm run test:load
```

### Security Testing (if ZAP installed)
```bash
npm run test:security
```

## Success Indicators

Backend is ready when you see:
```
[Nest] Starting Nest application...
[Nest] AppModule dependencies initialized
[Nest] Mapped {/api/v1/auth/register, POST} route
[Nest] Mapped {/api/v1/auth/login, POST} route
Taska Platform API is running on: http://localhost:3000
API Documentation available at: http://localhost:3000/api/docs
```

Then test with:
```bash
curl http://localhost:3000/api/v1/health
```

Should return `{"status":"ok"}`

---

**Need Help?** Check the full investigation report in:
`claudedocs/backend-auth-investigation-report.md`
