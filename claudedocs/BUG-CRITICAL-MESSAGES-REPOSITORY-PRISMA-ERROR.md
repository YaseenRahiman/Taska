# CRITICAL BUG: Messages Repository Prisma Query Error

## Summary
Messages repository is passing full User objects to Prisma where clauses instead of user IDs, causing Prisma validation errors and blocking all messaging functionality.

## Severity
**CRITICAL** - Blocks core messaging feature

## Impact
- **Affected Tests**: 4 messaging tests (10% of test suite)
- **User Impact**: Cannot list messages, cannot mark as read, cannot get unread count
- **Workflows Broken**: Client-Artisan communication, bid discussions

## Error Evidence

### Error Message
```
Invalid `this.prisma.message.count()` invocation in
C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\backend\src\modules\messages\messages.repository.ts:225:29

Cannot use object where ID expected
  where: {
    OR: [
      {
        senderId: {
          id: "cmgziws4n000fi60o64vaevqw",
          email: "client@test.com",
          passwordHash: "$2b$12$...",
          role: "CLIENT",
          verifiedAt: new Date("2025-10-20T19:23:26.182Z"),
          ...
          profile: { ... }
        }
      },
      { recipientId: { ... } }
    ]
  }
```

### Test Failures
1. **List messages conversation** → 500 Internal Server Error
2. **Mark messages as read** → 400 Bad Request
3. **Get unread message count** → 500 Internal Server Error
4. **Client-Artisan messaging** → 400 Bad Request (cascading failure)

## Root Cause Analysis

### Problem Location
**File**: `backend/src/modules/messages/messages.repository.ts`
**Line**: 225 (and likely similar patterns elsewhere)

### Current (WRONG) Code Pattern
```typescript
// Somewhere in the calling code:
const user = await getUserWithProfile(); // Returns full User object

// In messages.repository.ts:
this.prisma.message.count({
  where: {
    OR: [
      { senderId: user },        // ❌ WRONG: Full object
      { recipientId: user }      // ❌ WRONG: Full object
    ]
  }
})
```

### Expected (CORRECT) Code Pattern
```typescript
// Option 1: Pass userId from caller
this.prisma.message.count({
  where: {
    OR: [
      { senderId: userId },      // ✅ CORRECT: String ID
      { recipientId: userId }    // ✅ CORRECT: String ID
    ]
  }
})

// Option 2: Extract ID in repository
this.prisma.message.count({
  where: {
    OR: [
      { senderId: user.id },     // ✅ CORRECT: Extract ID
      { recipientId: user.id }   // ✅ CORRECT: Extract ID
    ]
  }
})
```

## Investigation Required

### Files to Examine
1. **`backend/src/modules/messages/messages.repository.ts`**
   - Line 225: `this.prisma.message.count()`
   - Search for all Prisma queries using `senderId` or `recipientId`
   - Verify all `where` clauses use scalar IDs, not objects

2. **`backend/src/modules/messages/messages.service.ts`**
   - Check how User objects are passed to repository methods
   - Verify if User objects should be passed or just IDs

3. **`backend/src/modules/messages/messages.controller.ts`**
   - Check `@User()` decorator usage
   - Verify what data structure is being passed to service layer

### Search Patterns
```bash
# Find all Prisma message queries
rg "prisma.message.(findMany|findFirst|count|findUnique)" backend/src/modules/messages/

# Find all senderId/recipientId usage
rg "(senderId|recipientId):" backend/src/modules/messages/

# Find User object passing patterns
rg "@User\(\)" backend/src/modules/messages/
```

## Recommended Fix

### Step 1: Identify All Affected Queries
Search `messages.repository.ts` for all Prisma queries that use User-related filters:
- `senderId`
- `recipientId`
- `userId`

### Step 2: Update Repository Methods
**Before**:
```typescript
async findConversationMessages(user: User, otherUserId: string) {
  return this.prisma.message.findMany({
    where: {
      OR: [
        { senderId: user, recipientId: otherUserId },      // ❌ WRONG
        { senderId: otherUserId, recipientId: user }       // ❌ WRONG
      ]
    }
  });
}
```

**After**:
```typescript
async findConversationMessages(userId: string, otherUserId: string) {
  return this.prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: otherUserId },    // ✅ CORRECT
        { senderId: otherUserId, recipientId: userId }     // ✅ CORRECT
      ]
    }
  });
}
```

### Step 3: Update Service Layer
Update `messages.service.ts` to pass user IDs instead of full User objects:

**Before**:
```typescript
async getMessages(user: User, otherUserId: string) {
  return this.messagesRepository.findConversationMessages(user, otherUserId);
}
```

**After**:
```typescript
async getMessages(user: User, otherUserId: string) {
  return this.messagesRepository.findConversationMessages(user.id, otherUserId);
}
```

### Step 4: Verify Controller Layer
Ensure controllers are passing correct data:
```typescript
@Get('conversation/:userId')
async getConversation(
  @User() user: User,
  @Param('userId') otherUserId: string
) {
  return this.messagesService.getMessages(user, otherUserId);
}
```

## Testing Validation

### Unit Tests
After fix, verify these scenarios:
1. List messages between two users
2. Count unread messages for a user
3. Mark specific message as read
4. Send new message

### E2E Tests
Expected improvements:
- `should send messages between users` → PASS
- `should list messages in conversation` → PASS
- `should mark messages as read` → PASS
- `should get unread message count` → PASS

### Manual Testing
```bash
# Test message listing
curl -X GET http://localhost:3000/api/v1/messages/conversation/{userId} \
  -H "Authorization: Bearer {token}"

# Test unread count
curl -X GET http://localhost:3000/api/v1/messages/unread/count \
  -H "Authorization: Bearer {token}"

# Test mark as read
curl -X POST http://localhost:3000/api/v1/messages/{messageId}/read \
  -H "Authorization: Bearer {token}"
```

## Success Criteria
- ✅ All Prisma queries use scalar IDs (string) not objects
- ✅ Repository methods accept `userId: string` not `user: User`
- ✅ Service layer extracts `user.id` before calling repository
- ✅ E2E tests: 4/4 messaging tests pass
- ✅ Manual testing confirms messages API working
- ✅ No Prisma validation errors in logs

## Priority
**P0 - CRITICAL**: Fix immediately. Blocks core platform feature (client-artisan communication).

## Estimated Effort
**30-60 minutes** - Straightforward pattern fix across repository methods

## Related Issues
- May affect other modules if similar pattern exists (jobs, bids, etc.)
- Consider creating a lint rule or type guard to prevent this pattern

## Agent Assignment
**@agent-backend-architect** - Repository and service layer expert

---

**Reported By**: Quality Engineer (Claude)
**Date**: 2025-10-20
**Status**: 🔴 OPEN - Awaiting Fix
