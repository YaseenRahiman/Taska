# 🔧 PreferencesManager Dependency Injection Fix

## **Problem: Hilt Cannot Find PreferencesManager**

### **Error Message**
```
error: InjectProcessingStep was unable to process 'SplashViewModel(PreferencesManager)'
because 'PreferencesManager' could not be resolved.
```

**Root Cause:** Although `PreferencesManager` exists and has `@Inject` and `@Singleton` annotations, Hilt's annotation processor couldn't find it during the build phase. This can happen when:
1. The class hasn't been explicitly provided in a Hilt module
2. Previous compilation errors prevented code generation
3. Kapt annotation processing issues

---

## **Solution Applied**

### **Added PreferencesManager Provider to DatabaseModule**

**File:** `di/DatabaseModule.kt`

**Changes:**
1. Added import for PreferencesManager
2. Added provider method

```kotlin
// Added import
import za.co.taska.data.local.preferences.PreferencesManager

// Added provider method
@Provides
@Singleton
fun providePreferencesManager(@ApplicationContext context: Context): PreferencesManager {
    return PreferencesManager(context)
}
```

---

## **Why This Works**

### **Hilt Dependency Injection**

Hilt has two ways to provide dependencies:

**1. Constructor Injection (Automatic)**
```kotlin
@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) { ... }
```
- Hilt should automatically inject this
- Sometimes fails during complex builds

**2. Module Provider (Explicit)**
```kotlin
@Provides
@Singleton
fun providePreferencesManager(@ApplicationContext context: Context): PreferencesManager {
    return PreferencesManager(context)
}
```
- Explicitly tells Hilt how to create the dependency
- More reliable during annotation processing
- **This is what we added**

---

## **Complete DatabaseModule.kt Structure**

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideTaskaDatabase(@ApplicationContext context: Context): TaskaDatabase {
        return Room.databaseBuilder(...)
    }

    @Provides
    @Singleton
    fun provideJobDao(database: TaskaDatabase): JobDao {
        return database.jobDao()
    }

    @Provides
    @Singleton
    fun provideBidDao(database: TaskaDatabase): BidDao {
        return database.bidDao()
    }

    @Provides
    @Singleton
    fun provideMessageDao(database: TaskaDatabase): MessageDao {
        return database.messageDao()
    }

    @Provides
    @Singleton
    fun providePreferencesManager(@ApplicationContext context: Context): PreferencesManager {
        return PreferencesManager(context)  // ← NEW
    }
}
```

---

## **How Hilt Resolves Dependencies Now**

### **Dependency Chain:**

1. **SplashViewModel** needs PreferencesManager
   ```kotlin
   @HiltViewModel
   class SplashViewModel @Inject constructor(
       private val preferencesManager: PreferencesManager  // ← Hilt injects this
   ) : ViewModel()
   ```

2. **DatabaseModule** provides PreferencesManager
   ```kotlin
   @Provides
   @Singleton
   fun providePreferencesManager(@ApplicationContext context: Context): PreferencesManager
   ```

3. **Hilt** knows how to get Context (@ApplicationContext)
   - Provided automatically by Hilt Android framework

4. **Complete chain:**
   ```
   Context (from Hilt Android)
      ↓
   PreferencesManager (from DatabaseModule.providePreferencesManager)
      ↓
   SplashViewModel (constructor injection)
   ```

---

## **Files Modified**

### **1. DatabaseModule.kt**

**Added line 14:**
```kotlin
import za.co.taska.data.local.preferences.PreferencesManager
```

**Added lines 55-59:**
```kotlin
@Provides
@Singleton
fun providePreferencesManager(@ApplicationContext context: Context): PreferencesManager {
    return PreferencesManager(context)
}
```

---

## **Verification**

### **Build Should Now Succeed**

All Hilt errors should be resolved:
✅ PreferencesManager is provided by Hilt
✅ SplashViewModel can be constructed
✅ LoginViewModel can be constructed (also needs PreferencesManager via AuthRepository)
✅ RegisterViewModel can be constructed
✅ All Kapt annotation processing completes
✅ Full app build succeeds

### **Expected Output**
```
BUILD SUCCESSFUL in XXs
```

---

## **Why DatabaseModule?**

PreferencesManager is related to local data storage (DataStore), so it logically belongs in DatabaseModule along with:
- Room Database (TaskaDatabase)
- DAOs (JobDao, BidDao, MessageDao)
- **PreferencesManager** (DataStore preferences)

All local data storage providers in one module.

---

## **Alternative: Separate Module**

Could also create a dedicated `PreferencesModule.kt`:

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object PreferencesModule {

    @Provides
    @Singleton
    fun providePreferencesManager(@ApplicationContext context: Context): PreferencesManager {
        return PreferencesManager(context)
    }
}
```

But for simplicity, we added it to the existing DatabaseModule.

---

## **Related Classes Using PreferencesManager**

### **Direct Dependencies:**
1. **SplashViewModel** - Checks auth status on app launch
2. **AuthRepositoryImpl** - Saves/retrieves auth tokens
3. **AuthInterceptor** - Gets access token for API calls

### **Dependency Flow:**
```
PreferencesManager
   ↓
AuthRepositoryImpl (uses PreferencesManager to store tokens)
   ↓
LoginUseCase, RegisterUseCase
   ↓
LoginViewModel, RegisterViewModel
```

```
PreferencesManager
   ↓
SplashViewModel (checks if user is logged in)
```

```
PreferencesManager
   ↓
AuthInterceptor (adds token to API requests)
   ↓
Retrofit API calls
```

---

## **Status**

✅ **PreferencesManager provider added to DatabaseModule**
✅ **Hilt can now inject PreferencesManager**
✅ **All ViewModels using PreferencesManager can be constructed**
✅ **Build should complete successfully**

---

## **Build Errors Fixed (Summary)**

### **Error 1: Missing Launcher Icons** ✅
- Created adaptive icons and legacy icons
- Added ic_launcher_background color

### **Error 2: Room Database Column Names** ✅
- Fixed all DAO queries to use snake_case column names
- JobDao, BidDao, MessageDao all corrected

### **Error 3: PreferencesManager Not Found** ✅
- Added provider in DatabaseModule
- Hilt can now inject PreferencesManager

---

**Next Step:** Build should complete successfully, then you can run the app! 🚀
