# Taska Mobile App - Architecture & Implementation Plan

**Date**: October 23, 2025
**Framework**: React Native with TypeScript
**Target**: Android (API 26+ / Android 8.0+)

---

## Phase 2: Architecture & Project Setup

### 2.1 Project Initialization

#### Step 1: Create React Native Project
```bash
# Navigate to project root
cd C:\Users\Yaseen\OneDrive\Documents\Investments\Taska

# Create React Native project with TypeScript template
npx react-native@latest init TaskaMobile --template react-native-template-typescript

# Move into mobile directory
cd TaskaMobile
```

#### Step 2: Install Core Dependencies

**Navigation & UI**
```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-paper react-native-vector-icons
npm install react-native-gesture-handler react-native-reanimated
```

**State Management & API**
```bash
npm install zustand axios socket.io-client
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
```

**Storage & Security**
```bash
npm install @react-native-async-storage/async-storage
npm install react-native-keychain
npm install react-native-mmkv
```

**Media & Location**
```bash
npm install react-native-image-picker
npm install react-native-image-resizer
npm install react-native-fast-image
npm install @react-native-community/geolocation
npm install react-native-maps
```

**Notifications & Utilities**
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging @react-native-firebase/crashlytics
npm install react-native-permissions
npm install date-fns
```

**Development Dependencies**
```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
npm install --save-dev detox detox-cli
npm install --save-dev @types/react @types/react-native
npm install --save-dev eslint prettier eslint-config-prettier
```

#### Step 3: Configure TypeScript

Create/update `tsconfig.json`:
```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2019", "es2020.promise", "es2020.bigint", "es2020.string"],
    "jsx": "react-native",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@api/*": ["api/*"],
      "@components/*": ["components/*"],
      "@screens/*": ["screens/*"],
      "@navigation/*": ["navigation/*"],
      "@store/*": ["store/*"],
      "@hooks/*": ["hooks/*"],
      "@services/*": ["services/*"],
      "@utils/*": ["utils/*"],
      "@types/*": ["types/*"],
      "@constants/*": ["constants/*"],
      "@assets/*": ["assets/*"]
    }
  },
  "include": ["src/**/*", "__tests__/**/*"],
  "exclude": ["node_modules", "android", "ios"]
}
```

#### Step 4: Setup Project Structure

```bash
mkdir -p src/{api,components,screens,navigation,store,hooks,services,utils,constants,types,assets}
mkdir -p src/components/{common,jobs,bids,messages,profile}
mkdir -p src/screens/{auth,jobs,bids,messages,profile}
mkdir -p __tests__/{unit,integration,e2e}
```

---

## 2.2 Core Architecture Components

### API Client Configuration

**File**: `src/api/client.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { getSecureToken, saveSecureToken, clearSecureTokens } from '@utils/storage';
import { API_BASE_URL } from '@constants/config';

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await getSecureToken('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Refresh token
            const newAccessToken = await this.refreshAccessToken();

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout user
            await clearSecureTokens();
            // Navigate to login screen (will be handled by auth store)
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = await getSecureToken('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await saveSecureToken('accessToken', accessToken);
        await saveSecureToken('refreshToken', newRefreshToken);

        return accessToken;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
```

### Authentication State Management

**File**: `src/store/auth.store.ts`

```typescript
import { create } from 'zustand';
import { User } from '@types/user.types';
import { authApi } from '@api/auth.api';
import { saveSecureToken, getSecureToken, clearSecureTokens } from '@utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      const { accessToken, refreshToken, user } = response.data;

      await saveSecureToken('accessToken', accessToken);
      await saveSecureToken('refreshToken', refreshToken);

      set({
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      const { accessToken, refreshToken, user } = response.data;

      await saveSecureToken('accessToken', accessToken);
      await saveSecureToken('refreshToken', refreshToken);

      set({
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false
      });
      throw error;
    }
  },

  logout: async () => {
    await clearSecureTokens();
    set({
      user: null,
      isAuthenticated: false,
      error: null
    });
  },

  loadUser: async () => {
    const token = await getSecureToken('accessToken');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authApi.getCurrentUser();
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      await clearSecureTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  clearError: () => set({ error: null }),
}));
```

### Navigation Structure

**File**: `src/navigation/AppNavigator.tsx`

```typescript
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '@store/auth.store';
import AuthNavigator from './AuthNavigator';
import ClientNavigator from './ClientNavigator';
import ArtisanNavigator from './ArtisanNavigator';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.role === 'CLIENT' ? (
          <Stack.Screen name="Client" component={ClientNavigator} />
        ) : (
          <Stack.Screen name="Artisan" component={ArtisanNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 2.3 Environment Configuration

**File**: `.env`

```env
# API Configuration
API_BASE_URL=http://10.0.2.2:3000/api/v1
SOCKET_URL=http://10.0.2.2:3000

# Note: 10.0.2.2 is the Android emulator's alias for localhost
# For physical devices, use your computer's IP address (e.g., http://192.168.1.100:3000)

# Firebase Configuration (for production)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_PROJECT_ID=taska-mobile

# Feature Flags
ENABLE_BIOMETRIC_AUTH=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_OFFLINE_MODE=true
```

**File**: `src/constants/config.ts`

```typescript
import { Platform } from 'react-native';

// For development, use appropriate localhost alias
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api/v1';
    }
    // iOS simulator can use localhost directly
    return 'http://localhost:3000/api/v1';
  }
  // Production API URL
  return process.env.API_BASE_URL || 'https://api.taska.co.za/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');

export const CONFIG = {
  apiTimeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  enableBiometricAuth: process.env.ENABLE_BIOMETRIC_AUTH === 'true',
  enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
  enableOfflineMode: process.env.ENABLE_OFFLINE_MODE === 'true',
};
```

---

## 2.4 Utility Functions

**File**: `src/utils/storage.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

// Secure storage for sensitive data (tokens, passwords)
export const saveSecureToken = async (key: string, value: string): Promise<void> => {
  try {
    await Keychain.setGenericPassword(key, value, { service: `taska.${key}` });
  } catch (error) {
    console.error(`Error saving secure token ${key}:`, error);
    throw error;
  }
};

export const getSecureToken = async (key: string): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: `taska.${key}` });
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error(`Error getting secure token ${key}:`, error);
    return null;
  }
};

export const clearSecureTokens = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: 'taska.accessToken' });
    await Keychain.resetGenericPassword({ service: 'taska.refreshToken' });
  } catch (error) {
    console.error('Error clearing secure tokens:', error);
  }
};

// Regular storage for non-sensitive data
export const saveData = async (key: string, value: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving data ${key}:`, error);
  }
};

export const getData = async <T = any>(key: string): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error getting data ${key}:`, error);
    return null;
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data ${key}:`, error);
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};
```

---

## 2.5 Type Definitions

**File**: `src/types/user.types.ts`

```typescript
export enum UserRole {
  CLIENT = 'CLIENT',
  ARTISAN = 'ARTISAN',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  profilePictureUrl: string | null;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  isVerified: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
```

**File**: `src/types/job.types.ts`

```typescript
export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum BudgetType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  NEGOTIABLE = 'NEGOTIABLE',
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Job {
  id: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  budget: number;
  budgetType: BudgetType;
  urgency: UrgencyLevel;
  status: JobStatus;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  images: string[];
  requirements: string[];
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  client?: User;
  category?: Category;
  _count?: {
    bids: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
}

export interface JobFilters {
  search?: string;
  categoryId?: string;
  minBudget?: number;
  maxBudget?: number;
  budgetType?: BudgetType;
  urgency?: UrgencyLevel;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
  page?: number;
  limit?: number;
}
```

---

## 2.6 Android Configuration

### Update `android/app/build.gradle`

Add permissions and features:

```gradle
android {
    defaultConfig {
        // ... existing config
        minSdkVersion 26  // Android 8.0+
        targetSdkVersion 33
        multiDexEnabled true
    }

    // Enable Hermes
    project.ext.react = [
        enableHermes: true
    ]
}

dependencies {
    // ... existing dependencies

    // Firebase
    implementation platform('com.google.firebase:firebase-bom:32.0.0')
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-crashlytics'

    // Image processing
    implementation 'com.github.bumptech.glide:glide:4.15.1'
}
```

### Update `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:theme="@style/AppTheme"
      android:usesCleartextTraffic="true">

      <!-- Main Activity -->
      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>

      <!-- Firebase Messaging Service -->
      <service
        android:name="com.google.firebase.messaging.FirebaseMessagingService"
        android:exported="false">
        <intent-filter>
          <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
      </service>

    </application>

</manifest>
```

---

## 2.7 Implementation Priority

### Week 1: Project Setup & Authentication
1. **Day 1-2**: Project initialization, dependency installation, basic structure
2. **Day 3-4**: API client setup, authentication state management
3. **Day 5**: Login and registration screens

### Week 2: Core Features
1. **Day 1-2**: Job browsing (artisan)
2. **Day 3**: Job posting (client)
3. **Day 4**: Bidding system
4. **Day 5**: Messaging foundation

---

## 2.8 Development Commands

```bash
# Start Metro bundler
npm start

# Run on Android emulator
npm run android

# Run on physical device (connect via USB with debugging enabled)
adb devices
npm run android

# Build release APK
cd android
./gradlew assembleRelease

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Lint and format
npm run lint
npm run format

# Type check
npm run type-check
```

---

## 2.9 Next Steps After Setup

1. **Validate Setup**: Run app on emulator, verify hot reload works
2. **Test API Connection**: Make test request to backend API
3. **Implement Authentication**: Login/register screens with full flow
4. **Implement First Feature**: Job browsing for artisans
5. **Iterative Development**: Add features one by one with testing

---

## 2.10 Common Issues & Solutions

### Issue 1: Cannot connect to backend API
**Solution**:
- Android emulator: Use `http://10.0.2.2:3000`
- Physical device: Use computer's IP address
- Check firewall allows incoming connections
- Ensure backend is running

### Issue 2: Metro bundler issues
**Solution**:
```bash
npm start -- --reset-cache
rm -rf node_modules
npm install
```

### Issue 3: Android build fails
**Solution**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Issue 4: Native module linking issues
**Solution**:
```bash
npx react-native link
cd android
./gradlew clean
cd ..
npm run android
```

---

**End of Architecture Plan**
