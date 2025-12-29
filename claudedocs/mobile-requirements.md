# Taska Mobile App - Requirements Document

**Version**: 1.0.0
**Date**: October 23, 2025
**Platform**: Android (Primary), iOS (Secondary - Architecture Support)
**Framework Recommendation**: React Native

---

## Executive Summary

This document defines the requirements for native mobile applications for the Taska platform, a South African marketplace connecting clients with skilled artisans. The mobile app will provide core functionality from the web platform optimized for mobile usage patterns, with special consideration for South African market conditions (data usage, offline capability, network reliability).

---

## 1. Platform Context

### 1.1 Existing Infrastructure
- **Backend API**: RESTful API at `http://localhost:3000/api/v1`
- **Authentication**: JWT-based with refresh tokens
- **Real-time**: Socket.io for messaging and notifications
- **Database**: PostgreSQL with Prisma ORM
- **Payment**: Stripe integration (ZAR currency)
- **Tech Stack**: NestJS backend, Next.js web frontend

### 1.2 Test Users
- **Client**: client@test.com (password: Test123!)
- **Artisan**: artisan@test.com (password: Test123!)

---

## 2. Mobile-Specific Requirements

### 2.1 South African Market Considerations

#### Data Usage Optimization
- **Priority**: HIGH
- **Requirements**:
  - Image compression and lazy loading
  - Configurable image quality settings (Low/Medium/High)
  - Data usage tracking and warnings
  - Optional "Data Saver Mode" that limits images and background sync
  - Efficient API payload optimization (pagination, field selection)

#### Offline Capability
- **Priority**: HIGH
- **Requirements**:
  - Cache recently viewed jobs for offline viewing
  - Queue actions when offline (bid submissions, messages) with sync on reconnection
  - Clear offline status indicators
  - Local storage for user profile and preferences
  - Offline-first messaging with message queue

#### Network Reliability
- **Priority**: HIGH
- **Requirements**:
  - Robust retry logic for failed requests
  - Graceful degradation when network is slow
  - Request timeout handling with user feedback
  - Background sync for non-critical updates

### 2.2 Mobile-Native Features

#### Push Notifications
- **Priority**: HIGH
- **Use Cases**:
  - New job posted (matching artisan criteria)
  - Bid received (for clients)
  - Bid accepted/rejected (for artisans)
  - New message received
  - Payment status updates
  - Job status changes
- **Requirements**:
  - Firebase Cloud Messaging (FCM) for Android
  - Apple Push Notification Service (APNS) for iOS
  - In-app notification center
  - Notification preferences management
  - Deep linking to relevant app screens

#### Location Services
- **Priority**: HIGH
- **Use Cases**:
  - Auto-detect user location for job search
  - "Jobs Near Me" feature for artisans
  - Location-based job recommendations
  - Map view of jobs (Google Maps integration)
- **Requirements**:
  - Request location permissions
  - Background location updates (opt-in)
  - Geofencing for job alerts
  - Distance calculation and display

#### Camera Integration
- **Priority**: MEDIUM
- **Use Cases**:
  - Job posting - capture photos of work site
  - Bid submission - attach portfolio photos
  - Messaging - send photos
  - Profile picture upload
  - Progress updates - document work stages
- **Requirements**:
  - Camera access permission
  - Image compression before upload
  - Multiple photo selection
  - Photo cropping and basic editing
  - Gallery access

#### Biometric Authentication
- **Priority**: MEDIUM
- **Use Cases**:
  - Quick login with fingerprint/face ID
  - Secure payment confirmation
- **Requirements**:
  - Fingerprint authentication support
  - Face ID support (iOS)
  - Fallback to PIN/password
  - Device security requirement check

---

## 3. User Roles and Journeys

### 3.1 CLIENT User Journey

#### MVP Features (Phase 1)
1. **Authentication**
   - Register new account (email, password, role selection)
   - Login with email/password
   - Biometric login (opt-in)
   - Password reset flow

2. **Job Management**
   - Create new job posting
     - Title, description, category selection
     - Budget (fixed/hourly/negotiable)
     - Urgency level
     - Location (auto-detect or manual entry)
     - Photo uploads (up to 5 photos)
     - Requirements checklist
   - View my jobs (draft, open, in progress, completed)
   - Edit draft jobs
   - Publish draft jobs
   - Cancel jobs

3. **Browse Bids**
   - View all bids for a job
   - See artisan profile and ratings
   - Accept/reject bids
   - Compare bids side-by-side

4. **Messaging**
   - Real-time chat with artisans
   - Send text messages
   - Send photos
   - Message notifications
   - Unread message indicators

5. **Profile**
   - View/edit profile
   - Upload profile picture
   - Manage payment methods
   - View transaction history
   - Settings (notifications, privacy, data usage)

#### Future Features (Phase 2+)
- Payment processing
- Job progress tracking
- Review and rating system
- Job history and analytics
- Favorite artisans

### 3.2 ARTISAN User Journey

#### MVP Features (Phase 1)
1. **Authentication**
   - Same as client (reuse components)

2. **Job Discovery**
   - Browse all open jobs
   - Filter by:
     - Category/specialization
     - Location (distance from me)
     - Budget range
     - Urgency level
   - Search by keywords
   - Sort by (newest, budget, distance, urgency)
   - "Jobs Near Me" with map view
   - Save/bookmark jobs

3. **Bidding**
   - Submit bid on job
     - Bid amount
     - Estimated completion time
     - Personal message to client
     - Attach portfolio photos
   - View my bids (pending, accepted, rejected)
   - Withdraw bid
   - Edit pending bids

4. **Messaging**
   - Same as client (reuse components)

5. **Profile**
   - View/edit profile
   - Add specializations
   - Upload portfolio photos
   - Add certifications
   - View earnings and statistics
   - Settings

#### Future Features (Phase 2+)
- Project management tools
- Earnings and wallet management
- Reviews and ratings received
- Performance analytics
- Calendar and scheduling

---

## 4. Core Features Breakdown

### 4.1 Authentication Module

#### User Stories
```
US-AUTH-001: As a user, I want to register with email and password, so I can create an account
US-AUTH-002: As a user, I want to select my role (CLIENT or ARTISAN) during registration
US-AUTH-003: As a user, I want to login with email/password, so I can access my account
US-AUTH-004: As a user, I want to use biometric login, so I can quickly access the app
US-AUTH-005: As a user, I want to reset my password if I forget it
US-AUTH-006: As a user, I want my session to persist, so I don't have to login every time
US-AUTH-007: As a user, I want to logout securely
```

#### API Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/reset-password` - Request password reset
- `POST /auth/verify-email` - Verify email address
- `GET /auth/me` - Get current user profile

#### Technical Requirements
- JWT token storage in secure storage (react-native-keychain)
- Automatic token refresh before expiration
- Biometric authentication using react-native-biometrics
- Form validation using Zod
- Error handling for network failures

### 4.2 Job Browsing Module (Artisan)

#### User Stories
```
US-JOB-001: As an artisan, I want to see all open jobs, so I can find work opportunities
US-JOB-002: As an artisan, I want to filter jobs by category, location, and budget
US-JOB-003: As an artisan, I want to search jobs by keywords
US-JOB-004: As an artisan, I want to see jobs near my location
US-JOB-005: As an artisan, I want to view job details (description, budget, client info, location)
US-JOB-006: As an artisan, I want to see job photos
US-JOB-007: As an artisan, I want to bookmark jobs for later
```

#### API Endpoints
- `GET /jobs` - List all jobs with filters
  - Query params: search, categoryId, minBudget, maxBudget, city, province, latitude, longitude, radius, page, limit
- `GET /jobs/nearby` - Get jobs near location
- `GET /jobs/:id` - Get job details
- `GET /categories` - Get job categories

#### Technical Requirements
- Infinite scroll pagination (load more on scroll)
- Pull-to-refresh functionality
- Image lazy loading and caching
- Location permission handling
- Map view using react-native-maps
- Job card component (reusable)

### 4.3 Job Posting Module (Client)

#### User Stories
```
US-POST-001: As a client, I want to create a job post with title, description, budget
US-POST-002: As a client, I want to select a job category
US-POST-003: As a client, I want to add photos to my job post
US-POST-004: As a client, I want to set job location (auto-detect or manual)
US-POST-005: As a client, I want to save job as draft
US-POST-006: As a client, I want to publish my job post
US-POST-007: As a client, I want to view my posted jobs
US-POST-008: As a client, I want to edit draft jobs
US-POST-009: As a client, I want to cancel a job
```

#### API Endpoints
- `POST /jobs` - Create new job
- `GET /jobs/my-jobs` - Get client's jobs
- `PUT /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job
- `PUT /jobs/:id/publish` - Publish draft job
- `POST /jobs/upload-image` - Upload job image

#### Technical Requirements
- Multi-step form with validation
- Camera and gallery integration using react-native-image-picker
- Image compression using react-native-image-resizer
- Location picker with map
- Draft auto-save
- Form state management

### 4.4 Bidding Module

#### User Stories
```
US-BID-001: As an artisan, I want to submit a bid on a job
US-BID-002: As an artisan, I want to include a message with my bid
US-BID-003: As an artisan, I want to attach portfolio photos to my bid
US-BID-004: As an artisan, I want to view my submitted bids
US-BID-005: As an artisan, I want to withdraw a pending bid
US-BID-006: As a client, I want to see all bids on my job
US-BID-007: As a client, I want to view artisan profile when reviewing bids
US-BID-008: As a client, I want to accept a bid
US-BID-009: As a client, I want to reject a bid
```

#### API Endpoints
- `POST /bids` - Submit bid
- `GET /bids` - Get user's bids
- `GET /jobs/:id/bids` - Get all bids for a job
- `PUT /bids/:id/accept` - Accept bid
- `PUT /bids/:id/reject` - Reject bid
- `DELETE /bids/:id` - Withdraw bid

#### Technical Requirements
- Bid form with validation
- Portfolio photo attachment
- Bid comparison view
- Artisan profile preview
- Real-time bid notifications

### 4.5 Messaging Module

#### User Stories
```
US-MSG-001: As a user, I want to send text messages to other users
US-MSG-002: As a user, I want to send photos in messages
US-MSG-003: As a user, I want to see message history
US-MSG-004: As a user, I want to receive real-time messages
US-MSG-005: As a user, I want to see unread message count
US-MSG-006: As a user, I want push notifications for new messages
US-MSG-007: As a user, I want to see when the other user is typing
```

#### API Endpoints
- `GET /messages` - Get message threads
- `GET /messages/:jobId` - Get messages for a job
- `POST /messages` - Send message
- `PUT /messages/:id/read` - Mark message as read
- WebSocket events:
  - `message:new` - New message received
  - `message:typing` - User typing indicator

#### Technical Requirements
- Socket.io client integration
- Real-time message updates
- Message queue for offline messages
- Image upload in messages
- Typing indicators
- Message read receipts
- Push notification integration

---

## 5. Non-Functional Requirements

### 5.1 Performance
- App launch time: < 3 seconds on mid-range device
- Screen transition: < 300ms
- API response handling: < 500ms
- Image loading: Progressive with placeholders
- Smooth scrolling: 60fps
- Memory usage: < 150MB on average

### 5.2 Security
- Secure token storage (Keychain/Keystore)
- HTTPS only for API calls
- Input validation on all forms
- Protection against XSS and injection attacks
- Biometric authentication with device security check
- Secure image uploads

### 5.3 Accessibility
- Screen reader support
- Minimum touch target size: 44x44 points
- Sufficient color contrast (WCAG AA)
- Text resizing support
- Keyboard navigation support

### 5.4 Localization
- **MVP**: English only
- **Future**: Afrikaans, Zulu, Xhosa support
- Date/time formatting (South African standards)
- Currency: ZAR (Rand)

### 5.5 Analytics and Monitoring
- Crash reporting (Firebase Crashlytics)
- Analytics events (user actions, screen views)
- Performance monitoring
- Error tracking and logging

---

## 6. Technical Architecture Recommendations

### 6.1 Framework: React Native

**Rationale**:
- Code sharing with existing Next.js web app (React components, utilities)
- Single codebase for Android and iOS
- Large ecosystem and community support
- Mature tooling and libraries
- Native performance for most use cases
- Hot reload for faster development

**Alternatives Considered**:
- Flutter: Great performance but requires learning Dart, no code reuse
- Native Android (Kotlin): Best performance but iOS requires separate development

### 6.2 Recommended Tech Stack

#### Core
- **Framework**: React Native 0.72+
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Zustand (lightweight, same as web)
- **API Client**: Axios with interceptors
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form + Zod validation

#### UI Components
- **Base**: React Native Paper or React Native Elements
- **Icons**: React Native Vector Icons
- **Images**: React Native Fast Image (caching)
- **Maps**: React Native Maps
- **Camera**: React Native Image Picker

#### Storage
- **Secure Storage**: React Native Keychain
- **Local Storage**: AsyncStorage or MMKV (faster)
- **Offline Cache**: React Query with persistence

#### Push Notifications
- **Android**: Firebase Cloud Messaging (FCM)
- **iOS**: Apple Push Notification Service (APNS)
- **Library**: React Native Firebase or Notifee

#### Testing
- **Unit Tests**: Jest
- **Component Tests**: React Native Testing Library
- **E2E Tests**: Detox or Appium
- **Code Quality**: ESLint, Prettier, TypeScript

#### DevOps
- **CI/CD**: GitHub Actions or Bitrise
- **App Distribution**: Firebase App Distribution (beta testing)
- **Crash Reporting**: Firebase Crashlytics
- **Analytics**: Firebase Analytics or Mixpanel

### 6.3 Project Structure

```
mobile/
├── android/                 # Android native code
├── ios/                    # iOS native code (future)
├── src/
│   ├── api/               # API client and endpoints
│   │   ├── client.ts      # Axios instance with interceptors
│   │   ├── auth.api.ts    # Auth endpoints
│   │   ├── jobs.api.ts    # Jobs endpoints
│   │   ├── bids.api.ts    # Bids endpoints
│   │   └── messages.api.ts # Messages endpoints
│   ├── components/        # Reusable components
│   │   ├── common/        # Button, Input, Card, etc.
│   │   ├── jobs/          # JobCard, JobList, JobFilter
│   │   ├── bids/          # BidCard, BidList
│   │   └── messages/      # MessageBubble, ChatInput
│   ├── screens/           # Screen components
│   │   ├── auth/          # Login, Register, ForgotPassword
│   │   ├── jobs/          # JobList, JobDetails, CreateJob
│   │   ├── bids/          # BidList, BidDetails, CreateBid
│   │   ├── messages/      # MessageList, ChatScreen
│   │   └── profile/       # Profile, Settings
│   ├── navigation/        # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── ClientNavigator.tsx
│   │   └── ArtisanNavigator.tsx
│   ├── store/            # State management (Zustand)
│   │   ├── auth.store.ts
│   │   ├── jobs.store.ts
│   │   └── messages.store.ts
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   └── useSocket.ts
│   ├── services/         # Business logic services
│   │   ├── auth.service.ts
│   │   ├── location.service.ts
│   │   ├── notification.service.ts
│   │   └── socket.service.ts
│   ├── utils/            # Helper functions
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── storage.ts
│   │   └── imageCompression.ts
│   ├── constants/        # App constants
│   │   ├── config.ts
│   │   ├── colors.ts
│   │   └── api.ts
│   ├── types/            # TypeScript types
│   │   ├── user.types.ts
│   │   ├── job.types.ts
│   │   ├── bid.types.ts
│   │   └── api.types.ts
│   └── assets/           # Images, fonts, etc.
├── __tests__/            # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env                  # Environment variables
├── app.json             # App configuration
├── package.json
└── tsconfig.json
```

---

## 7. MVP Feature Priority

### Phase 1 (MVP - Week 1-2): Core Functionality
**Target**: Beta-ready Android app

1. **Authentication** (2-3 days)
   - Register, Login, Logout
   - JWT token management
   - Basic profile setup

2. **Job Browsing** (2-3 days)
   - Job list with pagination
   - Job details view
   - Basic filtering (category, location)
   - Job search

3. **Job Posting** (2 days)
   - Create job form
   - Photo uploads
   - Save as draft
   - Publish job

4. **Bidding** (2 days)
   - Submit bid
   - View bids (artisan)
   - Review bids (client)
   - Accept/reject bid

5. **Messaging** (2-3 days)
   - Message list
   - Chat screen
   - Real-time messaging
   - Text and photo messages

### Phase 2 (Enhancement - Week 3-4): Polish & Optimization
1. Push notifications
2. Biometric authentication
3. Offline capability
4. Data saver mode
5. Advanced filtering and search
6. Map view for jobs
7. Performance optimization

### Phase 3 (Advanced - Month 2+): Additional Features
1. Payment processing
2. Reviews and ratings
3. Job progress tracking
4. Wallet management (artisan)
5. Analytics dashboard
6. iOS app
7. Advanced search with ML recommendations

---

## 8. Success Criteria

### Technical Success
- ✅ Android app runs on emulator and physical devices (Android 8.0+)
- ✅ All core user journeys functional (auth, browse, bid, message)
- ✅ API integration tested and working
- ✅ 80%+ unit test coverage
- ✅ No critical bugs or crashes
- ✅ App size < 50MB
- ✅ Performance targets met (load time, responsiveness)

### User Experience Success
- ✅ Intuitive navigation and UI
- ✅ Smooth animations and transitions
- ✅ Clear error messages and feedback
- ✅ Works on slow network connections
- ✅ Accessible to users with disabilities
- ✅ Data usage is reasonable (< 10MB per hour of active use)

### Business Success
- ✅ Feature parity with web app for MVP features
- ✅ Ready for beta testing with real users
- ✅ Architecture supports future iOS development
- ✅ Codebase is maintainable and well-documented
- ✅ CI/CD pipeline set up for automated builds

---

## 9. Risks and Mitigations

### Risk 1: Network Reliability in South Africa
**Impact**: High
**Mitigation**:
- Implement robust offline capability
- Add retry logic with exponential backoff
- Provide clear network status indicators
- Cache frequently accessed data

### Risk 2: Data Usage Concerns
**Impact**: High
**Mitigation**:
- Implement data saver mode
- Compress images aggressively
- Optimize API payloads
- Show data usage statistics

### Risk 3: Device Fragmentation (Android)
**Impact**: Medium
**Mitigation**:
- Support Android 8.0+ (covers 95%+ devices)
- Test on multiple screen sizes and resolutions
- Use responsive layouts and density-independent pixels
- Test on low-end devices

### Risk 4: Complex Real-time Messaging
**Impact**: Medium
**Mitigation**:
- Use proven Socket.io library
- Implement message queue for offline messages
- Add comprehensive error handling
- Test with poor network conditions

### Risk 5: Development Timeline
**Impact**: Medium
**Mitigation**:
- Clear MVP scope definition
- Reuse web app components and logic where possible
- Parallel development and testing
- Regular progress checkpoints

---

## 10. Testing Strategy

### 10.1 Unit Testing
- **Target Coverage**: 80%+
- **Framework**: Jest
- **Focus Areas**:
  - Utility functions
  - API client methods
  - State management (Zustand stores)
  - Form validation logic
  - Business logic services

### 10.2 Component Testing
- **Framework**: React Native Testing Library
- **Focus Areas**:
  - Component rendering
  - User interactions
  - Props handling
  - State changes
  - Navigation flows

### 10.3 Integration Testing
- **Framework**: Jest with API mocking
- **Focus Areas**:
  - API integration
  - Socket.io communication
  - State management flow
  - Navigation integration
  - Storage operations

### 10.4 E2E Testing
- **Framework**: Detox or Appium
- **Critical User Flows**:
  1. Registration → Login → Browse Jobs
  2. Login → Create Job → Publish
  3. Login → Submit Bid
  4. Login → Accept Bid → Message
  5. Login → Send Message → Receive Reply

### 10.5 Manual Testing
- Test on real Android devices (various models)
- Test on different network conditions (3G, 4G, WiFi, offline)
- Test with different screen sizes
- Test accessibility features
- Beta testing with real users

---

## 11. Documentation Deliverables

1. **Setup Guide** (`SETUP.md`)
   - Development environment setup
   - Running on emulator
   - Running on physical device
   - Environment configuration

2. **Architecture Documentation** (`ARCHITECTURE.md`)
   - Project structure explanation
   - State management patterns
   - API integration approach
   - Navigation structure
   - Component organization

3. **API Integration Guide** (`API.md`)
   - API endpoints reference
   - Authentication flow
   - Error handling
   - Socket.io events
   - Request/response examples

4. **Testing Guide** (`TESTING.md`)
   - Running tests
   - Writing new tests
   - E2E test setup
   - Testing best practices
   - Coverage reports

5. **Deployment Guide** (`DEPLOYMENT.md`)
   - Building release APK
   - Signing configuration
   - Firebase App Distribution setup
   - Google Play Store preparation
   - CI/CD pipeline

6. **User Guide** (for testers)
   - App features overview
   - User flows walkthrough
   - Known issues
   - Feedback submission process

---

## 12. Next Steps

### Immediate Actions (After Requirements Approval)

1. **Setup Development Environment**
   - Install React Native CLI
   - Setup Android Studio and emulator
   - Configure project structure
   - Setup Git repository

2. **Initialize Project**
   - Create React Native project
   - Install core dependencies
   - Configure TypeScript
   - Setup navigation structure
   - Configure API client

3. **Setup Testing Infrastructure**
   - Configure Jest
   - Setup React Native Testing Library
   - Configure Detox for E2E tests
   - Create test utilities and mocks

4. **Implement Authentication** (First Feature)
   - Login screen
   - Register screen
   - Token management
   - Protected routes
   - User context

5. **Iterative Feature Development**
   - Follow priority order from Section 7
   - Test each feature before moving to next
   - Regular integration and deployment

---

## Appendix A: User Stories Summary

### Authentication (7 stories)
- US-AUTH-001 to US-AUTH-007

### Job Browsing (7 stories)
- US-JOB-001 to US-JOB-007

### Job Posting (9 stories)
- US-POST-001 to US-POST-009

### Bidding (9 stories)
- US-BID-001 to US-BID-009

### Messaging (7 stories)
- US-MSG-001 to US-MSG-007

**Total**: 39 user stories for MVP

---

## Appendix B: API Endpoints Reference

### Authentication
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/refresh-token`
- POST `/auth/reset-password`
- GET `/auth/me`

### Jobs
- GET `/jobs` (with filters)
- GET `/jobs/nearby`
- GET `/jobs/:id`
- GET `/jobs/my-jobs`
- POST `/jobs`
- PUT `/jobs/:id`
- PUT `/jobs/:id/publish`
- DELETE `/jobs/:id`

### Bids
- GET `/bids`
- GET `/jobs/:id/bids`
- POST `/bids`
- PUT `/bids/:id/accept`
- PUT `/bids/:id/reject`
- DELETE `/bids/:id`

### Messages
- GET `/messages`
- GET `/messages/:jobId`
- POST `/messages`
- PUT `/messages/:id/read`

### Categories
- GET `/categories`

### User Profile
- GET `/users/:id`
- PUT `/users/:id`
- POST `/users/upload-avatar`

---

**End of Requirements Document**
