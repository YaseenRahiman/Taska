# User Persistence Issue - Diagnostic Report

## Issue Summary
User reported that created users (e.g., `grahiman02@gmail.com`) disappear after instance restart.

## Root Cause Analysis

### ✅ Database Configuration - CORRECT
- **Database Type**: PostgreSQL
- **Connection**: `postgresql://postgres:x@localhost:5432/taska_dev`
- **Status**: Database schema is in sync with Prisma schema
- **Tables**: All 18 required tables exist and are properly structured

### ✅ User Creation Mechanism - CORRECT
Location: `backend/src/auth/auth.service.ts:56-124`

The registration flow properly persists users to PostgreSQL:
```typescript
const user = await this.prisma.$transaction(async (tx) => {
  const newUser = await tx.user.create({
    data: {
      email,
      passwordHash,
      role: role || UserRole.CLIENT,
      verifiedAt: new Date(),
    },
  });

  await tx.profile.create({
    data: {
      userId: newUser.id,
      firstName,
      lastName,
      phoneNumber,
    },
  });

  // Additional setup...
});
```

### ✅ Database Persistence - VERIFIED
Diagnostic script confirmed:
- Database contains 9 persistent users
- Users created on Oct 28, 2025 are still present
- Test user (`test-registration@example.com`) created at 21:53:03 is persisting

### ❌ ACTUAL PROBLEM IDENTIFIED

The user `grahiman02@gmail.com` **does NOT exist in the database**. This means:

1. **The user was never successfully created**, OR
2. **The user was manually deleted**, OR
3. **The user creation failed silently**

## Current Database State

```
Total Users: 9
├─ Clients: 4
│  ├─ test-registration@example.com (most recent)
│  ├─ john.smith@example.com
│  ├─ sarah.jones@example.com
│  └─ mike.brown@example.com
├─ Artisans: 4
│  ├─ lisa.electrician@example.com
│  ├─ david.plumber@example.com
│  ├─ alex.developer@example.com
│  └─ tom.carpenter@example.com
└─ Admins: 1
   └─ admin@taska.co.za
```

**Note**: `grahiman02@gmail.com` is NOT in this list.

## Seed Data Behavior

Location: `backend/prisma/seed.ts`

The seed file creates:
- System settings
- Categories and subcategories
- 1 admin user
- 3 client users
- 4 artisan users

**Important**: Seed data is created with `skipDuplicates: true` for settings, but users are created without this check. The seed script runs ONLY when explicitly executed with `npx prisma db seed`.

## Why Users Might Seem to "Disappear"

### Scenario 1: Application Not Running Seed on Startup
✅ **VERIFIED**: The application does NOT automatically run seed data on startup.
- `PrismaService` only connects/disconnects
- No `onModuleInit` seeding logic found

### Scenario 2: Database Being Recreated/Reset
Possible causes:
- Running `npx prisma migrate reset` (drops and recreates database)
- Running `npx prisma db push --force-reset`
- Manually dropping/recreating the database

### Scenario 3: User Creation Errors Not Caught
The registration endpoint may be failing silently. Check:
- Frontend error handling
- Network errors during registration
- Validation failures

## Recommendations

### 1. Verify User Creation Flow
Test the registration endpoint:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "grahiman02@gmail.com",
    "password": "SecurePass123!",
    "role": "CLIENT",
    "firstName": "Graham",
    "lastName": "Test"
  }'
```

### 2. Check Application Logs
Review backend logs for:
- Registration errors
- Database connection issues
- Constraint violations

### 3. Monitor Database Operations
Run the diagnostic script before and after server restart:
```bash
cd backend
npx ts-node scripts/test-user-persistence.ts
```

### 4. Verify No Database Resets
Check if any scripts or processes are:
- Running migrations with `--force-reset`
- Dropping the database
- Recreating tables

### 5. Frontend Error Handling
Check frontend registration flow:
- Are errors being displayed to users?
- Is the registration completing successfully?
- Are there network/CORS issues?

## Testing Procedure

### Step 1: Create Test User
```bash
# Via API
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "persistence-test@example.com",
    "password": "Test123!",
    "role": "CLIENT",
    "firstName": "Persistence",
    "lastName": "Test"
  }'
```

### Step 2: Verify User Exists
```bash
cd backend
npx ts-node scripts/test-user-persistence.ts
# Check if persistence-test@example.com appears
```

### Step 3: Restart Backend
```bash
# Stop backend
# Restart backend
npm run start:dev
```

### Step 4: Verify User Still Exists
```bash
npx ts-node scripts/test-user-persistence.ts
# Confirm persistence-test@example.com is still present
```

## Conclusion

**The database persistence is working correctly**. Users ARE being stored in PostgreSQL and survive restarts. The issue is that `grahiman02@gmail.com` was never successfully created in the database, suggesting:

1. Registration request failed
2. Validation error prevented creation
3. User manually deleted the account
4. Frontend error prevented successful registration

**Next Step**: Test the actual registration flow with proper error logging to identify why specific users aren't being created.
