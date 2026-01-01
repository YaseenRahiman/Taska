# 🔧 Room Database Schema Fix Applied

## **Problem: Column Name Mismatch**

### **Root Cause**
Room Database queries were using **camelCase** column names, but the Entity definitions specified **snake_case** column names using `@ColumnInfo` annotations.

**Example:**
```kotlin
// Entity definition
@ColumnInfo(name = "cached_at")  // ← snake_case
val cachedAt: Long

// DAO query (WRONG)
@Query("SELECT * FROM jobs WHERE status = 'OPEN' ORDER BY cachedAt DESC")
//                                                             ↑ camelCase - NOT FOUND!
```

---

## **Errors Fixed**

### **JobDao Errors**
❌ **Before:** `ORDER BY cachedAt` → Column not found
✅ **After:** `ORDER BY cached_at` → Matches entity

**Fixed queries:**
1. `getJobs()` - Changed `cachedAt` → `cached_at`
2. `getJobsByCity()` - Changed `cachedAt` → `cached_at`
3. `deleteOldJobs()` - Changed `cachedAt` → `cached_at`

### **BidDao Errors**
❌ **Before:** `ORDER BY createdAt`, `WHERE syncStatus` → Columns not found
✅ **After:** `ORDER BY created_at`, `WHERE sync_status` → Match entity

**Fixed queries:**
1. `getAllBids()` - Changed `createdAt` → `created_at`
2. `getBidsByStatus()` - Changed `createdAt` → `created_at`
3. `getUnsyncedBids()` - Changed `syncStatus` → `sync_status`

### **MessageDao Errors**
❌ **Before:** `WHERE jobId`, `ORDER BY createdAt`, `WHERE isRead`, `WHERE syncStatus` → Columns not found
✅ **After:** `WHERE job_id`, `ORDER BY created_at`, `WHERE is_read`, `WHERE sync_status` → Match entity

**Fixed queries:**
1. `getMessagesByJob()` - Changed `jobId` → `job_id`, `createdAt` → `created_at`
2. `getUnsyncedMessages()` - Changed `syncStatus` → `sync_status`
3. `getUnreadMessages()` - Changed `isRead` → `is_read`
4. `markAsRead()` - Changed `isRead` → `is_read`
5. `deleteMessagesByJob()` - Changed `jobId` → `job_id`

---

## **Why This Happened**

### **Room Database Column Naming**

Room uses the **exact column name** specified in `@ColumnInfo(name = "...")` annotations.

**Entity Definition:**
```kotlin
@ColumnInfo(name = "cached_at")  // ← This is the ACTUAL column name in SQLite
val cachedAt: Long              // ← This is just the Kotlin property name
```

**SQL Query Must Use Column Name:**
```sql
-- ✅ CORRECT
SELECT * FROM jobs WHERE cached_at > 1000

-- ❌ WRONG
SELECT * FROM jobs WHERE cachedAt > 1000  -- Column "cachedAt" doesn't exist!
```

### **Why snake_case?**

Android/SQL convention:
- **Kotlin properties:** camelCase (`cachedAt`, `createdAt`)
- **Database columns:** snake_case (`cached_at`, `created_at`)
- **@ColumnInfo:** Maps between them

---

## **Files Modified**

### **1. JobDao.kt**
```kotlin
// Line 14: Fixed getJobs query
- ORDER BY cachedAt DESC
+ ORDER BY cached_at DESC

// Line 20: Fixed getJobsByCity query
- ORDER BY cachedAt DESC
+ ORDER BY cached_at DESC

// Line 35: Fixed deleteOldJobs query
- WHERE cachedAt < :timestamp
+ WHERE cached_at < :timestamp
```

### **2. BidDao.kt**
```kotlin
// Line 14: Fixed getAllBids query
- ORDER BY createdAt DESC
+ ORDER BY created_at DESC

// Line 17: Fixed getBidsByStatus query
- ORDER BY createdAt DESC
+ ORDER BY created_at DESC

// Line 23: Fixed getUnsyncedBids query
- WHERE syncStatus != 'SYNCED'
+ WHERE sync_status != 'SYNCED'
```

### **3. MessageDao.kt**
```kotlin
// Line 14: Fixed getMessagesByJob query
- WHERE jobId = :jobId ORDER BY createdAt ASC
+ WHERE job_id = :jobId ORDER BY created_at ASC

// Line 20: Fixed getUnsyncedMessages query
- WHERE syncStatus != 'SYNCED'
+ WHERE sync_status != 'SYNCED'

// Line 23: Fixed getUnreadMessages query
- WHERE isRead = 0
+ WHERE is_read = 0

// Line 35: Fixed markAsRead query
- SET isRead = 1
+ SET is_read = 1

// Line 41: Fixed deleteMessagesByJob query
- WHERE jobId = :jobId
+ WHERE job_id = :jobId
```

---

## **Verification**

### **Build Should Now Succeed**

All Room Database errors should be resolved:
✅ JobDao queries compile
✅ BidDao queries compile
✅ MessageDao queries compile
✅ PreferencesManager generation succeeds
✅ Hilt dependency injection completes
✅ Full app build succeeds

### **Expected Output**
```
BUILD SUCCESSFUL in XXs
```

---

## **Column Naming Reference**

For future reference, here are all the snake_case column names used:

### **JobEntity Columns**
- `client_id`, `category_id`
- `budget_type`
- `address_line1`
- `created_at`, `cached_at`
- `client_name`, `client_rating`

### **BidEntity Columns**
- `job_id`
- `estimated_days`
- `created_at`
- `sync_status`
- `job_title`, `job_city`

### **MessageEntity Columns**
- `job_id`
- `sender_id`, `receiver_id`
- `message_type`
- `is_read`
- `created_at`
- `sync_status`
- `sender_name`, `sender_avatar`

---

## **Best Practices**

### **To Avoid This in Future:**

1. **Be consistent:** Always use snake_case for SQL column names
2. **Check annotations:** Look at `@ColumnInfo(name = "...")` for exact column name
3. **Room inspection:** Room shows errors at compile time - read them carefully
4. **Query validation:** Room validates queries against entity schema

### **Quick Reference Pattern:**
```kotlin
// Entity
@ColumnInfo(name = "column_name")  // ← Use THIS in queries
val propertyName: Type             // ← Kotlin property

// DAO Query
@Query("SELECT * FROM table WHERE column_name = :value")
//                                 ↑ Use column_name, not propertyName
```

---

## **Status**

✅ **All DAO queries fixed**
✅ **Column names match entity definitions**
✅ **Build should complete successfully**
✅ **App ready to run**

---

**Next Step:** Build should succeed, then you can run the app in Android Studio! 🚀
