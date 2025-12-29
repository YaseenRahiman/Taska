# Admin Portal Sprint 3 - Testing Guide

## Status
**Date**: November 7, 2025
**Modules Ready for Testing**: Bulk Operations + Activity Logs
**Current Issues**: Existing compilation errors (from Sprint 2 Analytics)

---

## 🔴 Pre-Testing Requirements

### 1. Fix Existing Compilation Errors (CRITICAL)

The backend has existing errors from Sprint 2 Analytics service:

```typescript
// Error in: backend/src/modules/admin/services/analytics.service.ts
// Issue: 'lastLoginAt' field doesn't exist in User model

// Line 145, 164, 173 - Remove/comment out lastLoginAt references
```

**Quick Fix Option**:
```bash
# Temporarily disable analytics service to test Sprint 3 features
# Comment out AnalyticsService and AnalyticsController from admin.module.ts
```

### 2. Kill Existing Backend Process

```bash
# Windows - Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Or use Task Manager to end "node.exe" processes
```

### 3. Install Redis (REQUIRED for Bulk Operations)

```bash
# Option 1: Docker (Recommended)
docker run -d --name redis -p 6379:6379 redis:alpine

# Verify Redis is running
docker ps | findstr redis

# Test connection
docker exec -it redis redis-cli ping
# Expected: PONG
```

```bash
# Option 2: Windows Native
# Download from: https://github.com/microsoftarchive/redis/releases
# Install and start Redis service

# Verify
redis-cli ping
# Expected: PONG
```

### 4. Run Prisma Migration

```bash
cd backend

# Generate migration
npx prisma migrate dev --name add_sprint3_bulk_operations_audit_reports

# Expected output:
# ✔ Migration created successfully
# ✔ Database schema updated
# ✔ Prisma Client regenerated
```

**Verify Migration**:
```bash
npx prisma studio
# Check for new tables:
# - bulk_operations
# - audit_logs
# - reports
# - report_executions
```

---

## 🧪 Testing Checklist

### Phase 1: Environment Setup ✅

- [ ] Redis installed and running
- [ ] Prisma migration completed
- [ ] Existing backend processes killed
- [ ] Analytics compilation errors fixed (or commented out)
- [ ] `.env` file has correct DATABASE_URL

### Phase 2: Backend Startup 🚀

```bash
cd backend
npm run start:dev
```

**Expected Output**:
```
[Nest] Starting Nest application...
[Nest] BullModule dependencies initialized
[Nest] AdminModule dependencies initialized
[Nest] BulkOperationsService registered
[Nest] AuditLogService registered
[Nest] Application successfully started
Taska Platform API is running on: http://localhost:3000
```

**Success Criteria**:
- [ ] No compilation errors
- [ ] Server starts on port 3000
- [ ] Bull queue connects to Redis
- [ ] Swagger docs accessible at http://localhost:3000/api

### Phase 3: API Testing - Bulk Operations 📦

#### 3.1 Swagger UI Testing

1. Open: http://localhost:3000/api
2. Navigate to "Admin - Bulk Operations" section
3. Click "Authorize" and add JWT token

**Test Endpoints**:

**A. Ban Users**
```bash
POST /api/v1/admin/bulk/users/ban

Body:
{
  "userIds": ["user-id-1", "user-id-2"],
  "reason": "Testing bulk ban functionality"
}

Expected Response:
{
  "id": "bulk-op-123",
  "type": "USER_BAN",
  "status": "PENDING",
  "totalItems": 2,
  "processed": 0,
  "succeeded": 0,
  "failed": 0,
  "progress": 0,
  "startedAt": "2025-11-07T10:00:00Z"
}
```

**B. Check Operation Status**
```bash
GET /api/v1/admin/bulk/operations/{operationId}

Expected Response:
{
  "id": "bulk-op-123",
  "status": "PROCESSING" or "COMPLETED",
  "processed": 2,
  "succeeded": 2,
  "failed": 0,
  "progress": 100
}
```

**C. List Operations**
```bash
GET /api/v1/admin/bulk/operations?page=1&limit=10

Expected Response:
{
  "operations": [...],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

#### 3.2 Bulk Operations Test Checklist

- [ ] POST `/admin/bulk/users/ban` - Creates operation
- [ ] POST `/admin/bulk/users/suspend` - Creates operation
- [ ] POST `/admin/bulk/users/verify` - Creates operation
- [ ] POST `/admin/bulk/export` - Creates export job
- [ ] POST `/admin/bulk/email/send` - Creates email job
- [ ] POST `/admin/bulk/content/moderate` - Creates moderation job
- [ ] GET `/admin/bulk/operations` - Lists operations
- [ ] GET `/admin/bulk/operations/:id` - Shows status
- [ ] DELETE `/admin/bulk/operations/:id` - Cancels operation

### Phase 4: API Testing - Activity Logs 📋

#### 4.1 Check Automatic Logging

After performing bulk operation, check audit logs:

```bash
GET /api/v1/admin/logs/audit?page=1&limit=20

Expected Response:
{
  "logs": [
    {
      "id": "log-123",
      "adminId": "admin-user-id",
      "adminName": "Test Admin",
      "action": "USER_BAN",
      "entityType": "USER",
      "entityId": "user-id-1",
      "ipAddress": "127.0.0.1",
      "userAgent": "...",
      "success": true,
      "createdAt": "2025-11-07T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### 4.2 Activity Logs Test Checklist

- [ ] GET `/admin/logs/audit` - Lists all audit logs
- [ ] GET `/admin/logs/audit?action=USER_BAN` - Filters by action
- [ ] GET `/admin/logs/audit?adminId=xxx` - Filters by admin
- [ ] GET `/admin/logs/audit/entity/USER/user-id-1` - Entity audit trail
- [ ] GET `/admin/logs/user-activity/:userId` - User activity
- [ ] GET `/admin/logs/system-events` - System events
- [ ] GET `/admin/logs/admin-summary` - Current admin summary
- [ ] GET `/admin/logs/export?format=csv` - Export logs
- [ ] GET `/admin/logs/statistics` - Dashboard statistics

### Phase 5: Verify Auto-Logging ✨

Perform any admin action and verify it's automatically logged:

1. **Test Action**: Ban a user via regular endpoint
   ```bash
   POST /api/v1/admin/users/:id/ban
   Body: { "reason": "Testing" }
   ```

2. **Verify Log Created**:
   ```bash
   GET /api/v1/admin/logs/audit/entity/USER/:userId
   ```

3. **Expected**: Audit log entry created automatically with:
   - ✅ Action: USER_BAN
   - ✅ IP address captured
   - ✅ User agent captured
   - ✅ Reason included
   - ✅ Success status tracked

### Phase 6: Queue Processing 🔄

#### 6.1 Monitor Queue

```bash
# Check Redis for queues
redis-cli
> KEYS *
> LLEN bull:bulk-operations:wait
> LLEN bull:bulk-operations:active
> LLEN bulk:bulk-operations:completed
```

#### 6.2 Test Queue Processing

1. Create bulk operation (10+ items)
2. Monitor progress in real-time:
   ```bash
   # Continuously check status
   GET /api/v1/admin/bulk/operations/:id

   # Watch progress:
   # processed: 0 → 5 → 10
   # status: PENDING → PROCESSING → COMPLETED
   ```

#### 6.3 Queue Test Checklist

- [ ] Operations added to Redis queue
- [ ] Processor picks up jobs
- [ ] Progress updates in real-time
- [ ] Completed jobs marked correctly
- [ ] Failed items logged with errors
- [ ] Queue retries failed jobs (3 attempts)

---

## 🐛 Troubleshooting

### Issue: Backend Won't Start

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Issue: Redis Connection Failed

**Error**: `ECONNREFUSED localhost:6379`

**Solution**:
```bash
# Verify Redis is running
docker ps | findstr redis
# or
redis-cli ping

# If not running, start Redis
docker start redis
# or restart Redis service
```

### Issue: Prisma Error - Table Not Found

**Error**: `Table 'bulk_operations' doesn't exist`

**Solution**:
```bash
# Run migration
cd backend
npx prisma migrate dev --name add_sprint3_tables

# Verify tables created
npx prisma studio
```

### Issue: Compilation Errors

**Error**: `Cannot find module '../dto/analytics.dto'`

**Solution**:
```typescript
// Temporarily comment out in backend/src/modules/admin/admin.module.ts:
// import { AnalyticsController } from './controllers/analytics.controller';
// import { AnalyticsService } from './services/analytics.service';

// Remove from controllers array:
// controllers: [AdminController, /* AnalyticsController */, ...],

// Remove from providers array:
// providers: [AdminService, /* AnalyticsService */, ...],
```

### Issue: Queue Jobs Not Processing

**Check**:
1. Redis running? `redis-cli ping`
2. Bull processor registered? Check logs for "BulkOperationsProcessor"
3. Queue name correct? "bulk-operations"

**Debug**:
```bash
# Check Redis queues
redis-cli
> KEYS bull:bulk-operations:*
> LLEN bull:bulk-operations:wait
> HGETALL bull:bulk-operations:meta
```

---

## 📊 Expected Test Results

### Success Criteria

#### Bulk Operations
- ✅ All 9 endpoints accessible
- ✅ Operations create successfully
- ✅ Queue processing works
- ✅ Progress tracking updates
- ✅ Status changes (PENDING → PROCESSING → COMPLETED)
- ✅ Error handling works (failed items logged)
- ✅ Cancellation works
- ✅ Swagger docs complete

#### Activity Logs
- ✅ All 8 endpoints accessible
- ✅ Automatic logging works
- ✅ IP address captured
- ✅ User agent captured
- ✅ Before/after states tracked
- ✅ Filtering works (by action, entity, date)
- ✅ Export to CSV works
- ✅ Statistics calculated correctly
- ✅ Swagger docs complete

#### Integration
- ✅ Bulk operations create audit logs
- ✅ Audit interceptor captures all admin actions
- ✅ Database transactions work
- ✅ No memory leaks
- ✅ No unhandled promise rejections

---

## 📝 Test Report Template

```markdown
# Sprint 3 Testing Report

**Date**:
**Tester**:
**Environment**: Development

## Setup
- [ ] Redis running
- [ ] Migration completed
- [ ] Backend started
- [ ] Swagger accessible

## Bulk Operations
- [ ] Ban users endpoint works
- [ ] Suspend users endpoint works
- [ ] Verify users endpoint works
- [ ] Export endpoint works
- [ ] Email endpoint works
- [ ] Moderation endpoint works
- [ ] List operations works
- [ ] Get status works
- [ ] Cancel operation works

## Activity Logs
- [ ] Audit logs endpoint works
- [ ] Entity audit trail works
- [ ] User activity works
- [ ] System events works
- [ ] Admin summary works
- [ ] Export works
- [ ] Statistics works
- [ ] Filtering works

## Auto-Logging
- [ ] Admin actions logged automatically
- [ ] IP address captured
- [ ] User agent captured
- [ ] Success/failure tracked

## Queue Processing
- [ ] Jobs added to queue
- [ ] Processor executes jobs
- [ ] Progress updates
- [ ] Retries on failure

## Issues Found
1.
2.
3.

## Overall Result
- [ ] PASS
- [ ] FAIL (see issues)
```

---

## 🚀 Quick Start Commands

### Full Testing Flow

```bash
# 1. Setup
docker run -d --name redis -p 6379:6379 redis:alpine
cd backend
npx prisma migrate dev --name add_sprint3_tables

# 2. Start Backend
npm run start:dev

# 3. Open Swagger
# Navigate to: http://localhost:3000/api

# 4. Test Bulk Operations
# Use Swagger UI to test all endpoints

# 5. Check Audit Logs
# Verify logs created automatically

# 6. Monitor Queue
redis-cli
> KEYS bull:*
> LLEN bull:bulk-operations:wait

# 7. Check Database
npx prisma studio
# Verify: bulk_operations, audit_logs tables
```

---

## 📚 Additional Resources

### Documentation
- Swagger UI: http://localhost:3000/api
- Prisma Studio: http://localhost:5555 (after `npx prisma studio`)
- Bull Dashboard: (optional) Install bull-board for UI

### Code Locations
- Bulk Operations Service: `backend/src/modules/admin/services/bulk-operations.service.ts`
- Activity Logs Service: `backend/src/modules/admin/services/audit-log.service.ts`
- Audit Interceptor: `backend/src/modules/admin/interceptors/audit-log.interceptor.ts`
- DTOs: `backend/src/modules/admin/dto/`
- Controllers: `backend/src/modules/admin/controllers/`

### Database Tables
- `bulk_operations` - Bulk operation tracking
- `audit_logs` - Admin action audit trail
- `reports` - Report definitions
- `report_executions` - Report generation history

---

**Ready to Test**: Once setup complete!
**Estimated Testing Time**: 1-2 hours for comprehensive testing
**Support**: Check troubleshooting section if issues arise

**Good luck with testing! 🎉**
