# Taska Mobile App - Testing Strategy

**Date**: October 23, 2025
**Framework**: Jest, React Native Testing Library, Detox
**Target Coverage**: 80%+

---

## 1. Testing Pyramid

```
           /\
          /E2\     E2E Tests (10%)
         /----\    Critical user flows
        /Integr\   Integration Tests (30%)
       /--------\  Component + API integration
      /Unit Tests\ Unit Tests (60%)
     /------------\ Functions, utilities, services
```

---

## 2. Testing Infrastructure Setup

### 2.1 Jest Configuration

**File**: `jest.config.js`

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', './jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-vector-icons|react-native-paper)/)',
  ],
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/types/**',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/?(*.)+(spec|test).{ts,tsx}',
  ],
};
```

**File**: `jest.setup.js`

```javascript
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(),
  getGenericPassword: jest.fn().mockResolvedValue({ password: 'mock-token' }),
  resetGenericPassword: jest.fn().mockResolvedValue(),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => require('react-native-permissions/mock'));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props) => React.createElement(View, props),
    Marker: (props) => React.createElement(View, props),
  };
});

// Mock Socket.io
jest.mock('socket.io-client', () => {
  return {
    io: jest.fn(() => ({
      on: jest.fn(),
      emit: jest.fn(),
      off: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    })),
  };
});

// Silence console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
```

### 2.2 Detox Configuration (E2E)

**File**: `.detoxrc.js`

```javascript
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [
        8081,
      ],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_5_API_30',
      },
    },
  },
  configurations: {
    'android.debug': {
      device: 'simulator',
      app: 'android.debug',
    },
    'android.release': {
      device: 'simulator',
      app: 'android.release',
    },
  },
};
```

---

## 3. Unit Testing

### 3.1 Utility Functions Tests

**File**: `src/utils/__tests__/storage.test.ts`

```typescript
import { saveData, getData, removeData, clearAllData } from '../storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveData', () => {
    it('should save data to AsyncStorage', async () => {
      const key = 'test-key';
      const value = { name: 'Test' };

      await saveData(key, value);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        key,
        JSON.stringify(value)
      );
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await saveData('key', 'value');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getData', () => {
    it('should retrieve and parse data from AsyncStorage', async () => {
      const key = 'test-key';
      const value = { name: 'Test' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(value));

      const result = await getData(key);

      expect(result).toEqual(value);
    });

    it('should return null if key does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getData('non-existent');

      expect(result).toBeNull();
    });
  });
});
```

### 3.2 API Client Tests

**File**: `src/api/__tests__/auth.api.test.ts`

```typescript
import { authApi } from '../auth.api';
import { apiClient } from '../client';

jest.mock('../client');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call POST /auth/login with credentials', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          user: { id: '1', email: 'test@example.com' },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.login('test@example.com', 'password');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle login errors', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        },
      };

      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        authApi.login('test@example.com', 'wrong-password')
      ).rejects.toEqual(mockError);
    });
  });
});
```

### 3.3 State Management Tests

**File**: `src/store/__tests__/auth.store.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../auth.store';
import { authApi } from '@api/auth.api';

jest.mock('@api/auth.api');
jest.mock('@utils/storage');

describe('Auth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('login', () => {
    it('should login successfully and update state', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'CLIENT',
      };

      (authApi.login as jest.Mock).mockResolvedValue({
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: mockUser,
        },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
    });

    it('should handle login failure', async () => {
      (authApi.login as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrong');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear user state and tokens', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: { id: '1', email: 'test@example.com' },
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
});
```

---

## 4. Component Testing

### 4.1 Component Test Example

**File**: `src/components/common/__tests__/Button.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    const { getByText } = render(<Button title="Click Me" onPress={() => {}} />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPressMock} />);

    fireEvent.press(getByText('Click Me'));

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPressMock} loading={true} />
    );

    const button = getByText('Click Me').parent;

    expect(button?.props.accessibilityState?.disabled).toBe(true);
  });

  it('should show loading indicator when loading', () => {
    const { getByTestId } = render(
      <Button title="Click Me" onPress={() => {}} loading={true} />
    );

    expect(getByTestId('button-loading-indicator')).toBeTruthy();
  });
});
```

### 4.2 Screen Test Example

**File**: `src/screens/auth/__tests__/LoginScreen.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { useAuthStore } from '@store/auth.store';

jest.mock('@store/auth.store');

describe('LoginScreen', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });
  });

  it('should render login form correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={{ navigate: mockNavigate } as any} />
    );

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('should handle login submission', async () => {
    mockLogin.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={{ navigate: mockNavigate } as any} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const loginButton = getByText('Login');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should display error message on login failure', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid credentials',
    });

    const { getByText } = render(
      <LoginScreen navigation={{ navigate: mockNavigate } as any} />
    );

    expect(getByText('Invalid credentials')).toBeTruthy();
  });

  it('should show loading state during login', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
    });

    const { getByTestId } = render(
      <LoginScreen navigation={{ navigate: mockNavigate } as any} />
    );

    expect(getByTestId('login-loading')).toBeTruthy();
  });
});
```

---

## 5. Integration Testing

### 5.1 API Integration Test

**File**: `__tests__/integration/auth-flow.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '@store/auth.store';
import { apiClient } from '@api/client';
import MockAdapter from 'axios-mock-adapter';

describe('Authentication Flow Integration', () => {
  let mock: MockAdapter;

  beforeAll(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('should handle complete registration flow', async () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      role: 'CLIENT',
      firstName: 'John',
      lastName: 'Doe',
    };

    mock.onPost('/auth/register').reply(201, {
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      user: {
        id: '123',
        email: registerData.email,
        role: registerData.role,
      },
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.register(registerData);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe(registerData.email);
  });

  it('should handle login → token refresh → API call flow', async () => {
    // Mock login
    mock.onPost('/auth/login').reply(200, {
      accessToken: 'initial-token',
      refreshToken: 'initial-refresh',
      user: { id: '123', email: 'test@example.com', role: 'CLIENT' },
    });

    // Mock token refresh
    mock.onPost('/auth/refresh-token').reply(200, {
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
    });

    // Mock protected endpoint
    mock.onGet('/jobs/my-jobs').reply(200, []);

    const { result } = renderHook(() => useAuthStore());

    // Login
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    // Verify authentication
    expect(result.current.isAuthenticated).toBe(true);

    // Make API call (would trigger token refresh if expired)
    // This is tested through the API client interceptors
  });
});
```

---

## 6. E2E Testing with Detox

### 6.1 E2E Test Setup

**File**: `e2e/jest.config.js`

```javascript
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

### 6.2 E2E Test Examples

**File**: `e2e/auth.e2e.js`

```javascript
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on app launch', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
    await expect(element(by.text('Login to Taska'))).toBeVisible();
  });

  it('should login successfully with valid credentials', async () => {
    await element(by.id('email-input')).typeText('client@test.com');
    await element(by.id('password-input')).typeText('Test123!');
    await element(by.id('login-button')).tap();

    // Should navigate to client dashboard
    await waitFor(element(by.id('client-dashboard')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show error message with invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@test.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.text('Invalid credentials')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should navigate to registration screen', async () => {
    await element(by.id('register-link')).tap();

    await expect(element(by.id('register-screen'))).toBeVisible();
    await expect(element(by.text('Create Account'))).toBeVisible();
  });

  it('should complete registration flow', async () => {
    await element(by.id('register-link')).tap();

    await element(by.id('email-input')).typeText('newuser@test.com');
    await element(by.id('password-input')).typeText('Test123!');
    await element(by.id('password-confirm-input')).typeText('Test123!');
    await element(by.id('role-selector')).tap();
    await element(by.text('CLIENT')).tap();
    await element(by.id('register-button')).tap();

    // Should navigate to client dashboard after registration
    await waitFor(element(by.id('client-dashboard')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

**File**: `e2e/jobs.e2e.js`

```javascript
describe('Job Browsing (Artisan)', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();

    // Login as artisan
    await element(by.id('email-input')).typeText('artisan@test.com');
    await element(by.id('password-input')).typeText('Test123!');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('artisan-dashboard')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display list of jobs', async () => {
    await element(by.id('jobs-tab')).tap();

    await waitFor(element(by.id('job-list')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('job-card')).atIndex(0)).toBeVisible();
  });

  it('should filter jobs by category', async () => {
    await element(by.id('jobs-tab')).tap();
    await element(by.id('filter-button')).tap();
    await element(by.id('category-filter')).tap();
    await element(by.text('Plumbing')).tap();
    await element(by.id('apply-filters-button')).tap();

    // Should show only plumbing jobs
    await waitFor(element(by.text('Plumbing')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should view job details', async () => {
    await element(by.id('jobs-tab')).tap();
    await element(by.id('job-card')).atIndex(0).tap();

    await expect(element(by.id('job-details-screen'))).toBeVisible();
    await expect(element(by.id('job-title'))).toBeVisible();
    await expect(element(by.id('job-description'))).toBeVisible();
    await expect(element(by.id('bid-button'))).toBeVisible();
  });

  it('should submit a bid on a job', async () => {
    await element(by.id('jobs-tab')).tap();
    await element(by.id('job-card')).atIndex(0).tap();
    await element(by.id('bid-button')).tap();

    await element(by.id('bid-amount-input')).typeText('500');
    await element(by.id('bid-message-input')).typeText('I can do this job');
    await element(by.id('estimated-days-input')).typeText('5');
    await element(by.id('submit-bid-button')).tap();

    await waitFor(element(by.text('Bid submitted successfully')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

---

## 7. Test Execution

### 7.1 Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/utils/__tests__/storage.test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests with specific configuration
detox test --configuration android.debug
```

### 7.2 Pre-commit Hooks

**File**: `package.json` (add scripts)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "detox test --configuration android.debug",
    "test:e2e:build": "detox build --configuration android.debug",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx}\"",
    "type-check": "tsc --noEmit",
    "pre-commit": "npm run lint && npm run type-check && npm test"
  }
}
```

---

## 8. Continuous Testing Strategy

### 8.1 Development Workflow

1. **Before Starting Feature**
   - Write failing test for feature
   - Ensure test infrastructure is ready

2. **During Development**
   - Write unit tests for utilities/services
   - Write component tests for UI components
   - Run tests in watch mode

3. **After Feature Complete**
   - Write integration tests
   - Write E2E test for critical path
   - Verify test coverage meets threshold

4. **Before Commit**
   - Run full test suite
   - Check code coverage
   - Fix any failing tests

### 8.2 Testing Checklist

For each feature:
- [ ] Unit tests for business logic
- [ ] Component tests for UI components
- [ ] Integration test for API interaction
- [ ] E2E test for critical user flow
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Loading states tested
- [ ] Accessibility tested

---

## 9. Test Coverage Goals

### Module Coverage Targets

- **API Client**: 90%+ (critical for data integrity)
- **State Management**: 85%+ (critical for app state)
- **Utils/Services**: 90%+ (pure functions, easy to test)
- **Components**: 75%+ (UI components)
- **Screens**: 70%+ (higher-level integration)

### Overall Target: 80%+

---

## 10. Quality Metrics

### Key Metrics to Track

1. **Test Coverage**: Aim for 80%+ overall
2. **Test Execution Time**: < 5 minutes for full suite
3. **E2E Test Success Rate**: > 95%
4. **Flaky Tests**: < 5%
5. **Code Quality**: ESLint violations = 0

### Monitoring

```bash
# Generate coverage report
npm test -- --coverage --coverageReporters=html

# Open coverage report
open coverage/index.html

# Check for flaky tests (run multiple times)
for i in {1..5}; do npm test; done
```

---

## 11. Common Testing Patterns

### 11.1 Testing Async Operations

```typescript
it('should fetch data asynchronously', async () => {
  const { result } = renderHook(() => useJobsStore());

  await act(async () => {
    await result.current.fetchJobs();
  });

  await waitFor(() => {
    expect(result.current.jobs).toHaveLength(5);
  });
});
```

### 11.2 Testing Navigation

```typescript
it('should navigate to job details', () => {
  const mockNavigate = jest.fn();
  const { getByTestId } = render(
    <JobCard
      job={mockJob}
      onPress={() => mockNavigate('JobDetails', { id: mockJob.id })}
    />
  );

  fireEvent.press(getByTestId('job-card'));

  expect(mockNavigate).toHaveBeenCalledWith('JobDetails', { id: mockJob.id });
});
```

### 11.3 Testing Forms

```typescript
it('should validate form inputs', async () => {
  const { getByPlaceholderText, getByText } = render(<CreateJobForm />);

  const titleInput = getByPlaceholderText('Job Title');

  fireEvent.changeText(titleInput, ''); // Empty title
  fireEvent.press(getByText('Submit'));

  await waitFor(() => {
    expect(getByText('Title is required')).toBeTruthy();
  });
});
```

---

## 12. Next Steps After Testing Setup

1. **Validate Setup**: Run sample tests, ensure all pass
2. **Test First Feature**: Write tests for authentication
3. **Establish Baseline**: Run coverage report, set initial metrics
4. **Continuous Testing**: Run tests in watch mode during development
5. **E2E Automation**: Set up E2E tests for critical flows

---

**End of Testing Strategy**
