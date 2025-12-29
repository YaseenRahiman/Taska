# Taska Android App - Executive Summary & Quick Start

## Project Overview

**App Name:** Taska - Artisan Marketplace
**Target Users:** South African artisans (primary focus on accessibility for low-literacy users)
**Platform:** Android (Min SDK 24, Target SDK 34)
**Development Timeline:** 9 weeks
**Technology Stack:** Kotlin, Jetpack Compose, MVVM Architecture

---

## Key Design Principles

### 1. Accessibility First
- **Large Touch Targets:** Minimum 56dp (exceeds 48dp standard)
- **Simple Language:** Short, clear sentences with visual icons
- **Voice Support:** Voice messages, text-to-speech for descriptions
- **High Contrast:** 4.5:1 contrast ratio minimum
- **Scalable Fonts:** 18sp base body text, scales to 200%

### 2. Offline Capability
- Core features work without internet
- Smart caching of last 50 viewed jobs
- Queue system for offline bids
- Automatic sync when connectivity restored
- Clear offline/online indicators

### 3. Low Data Usage
- Image compression < 500KB per image
- Pagination for all lists
- Efficient API calls with caching
- WebP image format support
- Background sync only on WiFi (configurable)

### 4. Visual Communication
- Icon-first design with text labels
- Color-coded status indicators
- Image galleries for all job posts
- Visual stats dashboard
- Emoji support for quick communication

---

## Core Features

### For Artisans

#### 1. Job Discovery
- **Home Dashboard:** Nearby jobs, stats, quick actions
- **Browse Jobs:** Filter by distance, category, budget, urgency
- **Search:** Keyword search with location filters
- **Notifications:** New jobs matching skills

#### 2. Bidding System
- **Place Bids:** Simple form with budget, timeline, message
- **Voice Messages:** Record audio instead of typing
- **Photo Attachments:** Show previous work examples
- **My Bids:** Track all bids (pending, accepted, rejected)
- **Bid Analytics:** See competition and winning chances

#### 3. Messaging
- **Real-time Chat:** WhatsApp-style interface
- **Voice Messages:** Record and send audio
- **Photo Sharing:** Share job updates with clients
- **Quick Replies:** Pre-written responses ("On my way", "Completed")
- **Notifications:** Push notifications for new messages

#### 4. Profile & Portfolio
- **Skills Management:** Add/edit skills with experience years
- **Portfolio Gallery:** Upload photos of previous work
- **Stats Display:** Jobs completed, success rate, response time
- **Ratings & Reviews:** Display client feedback
- **Verification Status:** Show verified badge

#### 5. Wallet & Earnings
- **Balance Display:** Available, pending, total earnings
- **Transaction History:** All payments received
- **Withdrawals:** Request bank transfers
- **Payment Tracking:** Track job payment status

---

## Design System

### Color Palette (Matches Website)

```
Primary (Teal):     #16A085
Secondary (Navy):   #2C3E50
Accent (Orange):    #E67E22
Success (Green):    #10B981
Warning (Yellow):   #F59E0B
Error (Red):        #EF4444
Background (Cream): #FAF9F7
```

### Typography

```
Hero:     36sp / Bold    (Page titles)
Heading1: 28sp / Bold    (Section titles)
Heading2: 24sp / SemiBold (Card titles)
Body:     18sp / Normal   (Main text - larger for accessibility)
Button:   20sp / Medium   (All buttons)
Caption:  16sp / Normal   (Helper text)
```

### Component Sizes

```
Button Height:      56dp (Large touch target)
Icon Button:        56dp
Card Corner Radius: 12dp
Border Width:       2dp
Icon Sizes:         20dp (small), 28dp (medium), 36dp (large)
```

---

## Technical Architecture

### Architecture Pattern: MVVM + Clean Architecture

```
Presentation Layer (UI)
    ↓
Domain Layer (Business Logic)
    ↓
Data Layer (API + Database)
```

### Key Technologies

**UI Framework:**
- Jetpack Compose (Material 3)
- Navigation Compose
- Accompanist (Permissions, System UI)

**Networking:**
- Retrofit 2 (REST API)
- OkHttp 3 (HTTP client)
- Socket.IO (Real-time messaging)

**Local Storage:**
- Room (SQLite database)
- DataStore (Preferences)
- EncryptedSharedPreferences (Secure storage)

**Dependency Injection:**
- Hilt (Dagger wrapper)

**Async Operations:**
- Coroutines + Flow
- StateFlow for UI state

**Image Loading:**
- Coil (Efficient image caching)

**Location:**
- Google Play Services Location
- FusedLocationProviderClient

**Camera:**
- CameraX (Unified camera API)

**Notifications:**
- Firebase Cloud Messaging

---

## API Integration

### Backend Base URL
```
Production: https://api.taska.co.za
Development: http://localhost:3000
```

### Key Endpoints

**Authentication:**
```
POST   /auth/register       - Register new artisan
POST   /auth/login          - Login
POST   /auth/refresh-token  - Refresh JWT
GET    /auth/profile        - Get user profile
POST   /auth/logout         - Logout
```

**Jobs:**
```
GET    /jobs                - Browse jobs (with filters)
GET    /jobs/nearby         - Jobs near location
GET    /jobs/:id            - Job details
GET    /jobs/search         - Search jobs
```

**Bids:**
```
POST   /bids                - Submit bid
GET    /bids/my-bids        - Get artisan's bids
GET    /bids/:id            - Bid details
PATCH  /bids/:id            - Update bid
POST   /bids/:id/withdraw   - Withdraw bid
```

**Messages:**
```
GET    /messages            - Get messages
POST   /messages            - Send message
PATCH  /messages/:id/read   - Mark as read
```

**Uploads:**
```
POST   /jobs/upload-image   - Upload single image
POST   /jobs/upload-images  - Upload multiple images
```

---

## Screen Flow

### Main Navigation (Bottom Tabs)

```
🔥 Home → Dashboard with nearby jobs, stats
🏠 Jobs → Browse all jobs with filters
💬 Messages → Chat with clients
👤 Profile → Settings, portfolio, stats
💰 Wallet → Earnings, transactions, withdrawals
```

### User Journeys

#### Journey 1: New Artisan Registration
```
1. Splash Screen
2. Welcome Screen
3. Registration Step 1: Basic Info (name, phone, email, password)
4. Registration Step 2: Profile (photo, ID, address)
5. Registration Step 3: Skills (categories, experience, portfolio)
6. Registration Step 4: Verification (ID upload, terms)
7. Email Verification
8. Home Dashboard
```

#### Journey 2: Finding & Bidding on Job
```
1. Home Dashboard (shows nearby jobs)
2. Browse Jobs (filter by distance, budget, category)
3. Job Details (view description, photos, location, client info)
4. Place Bid (enter price, timeline, message, attach photos)
5. Bid Confirmation
6. My Bids (track bid status)
7. Chat with Client (if bid accepted)
```

#### Journey 3: Managing Active Job
```
1. My Bids → Accepted Bids
2. Job Details → View requirements
3. Messages → Communicate with client
4. Job Completion → Mark as complete
5. Review Prompt → Receive rating from client
6. Wallet → Payment released
```

---

## Accessibility Features

### Visual Accessibility
- ✅ Large text (18sp base, scales to 200%)
- ✅ High contrast colors (4.5:1 ratio)
- ✅ Large touch targets (56dp minimum)
- ✅ Clear visual hierarchy
- ✅ Icon + text labels

### Screen Reader Support
- ✅ TalkBack optimized navigation
- ✅ Content descriptions for all images
- ✅ Semantic role annotations
- ✅ Logical focus order
- ✅ Helpful announcements

### Input Alternatives
- ✅ Voice messages (speak instead of type)
- ✅ Camera input (photos for details)
- ✅ Quick replies (pre-written messages)
- ✅ Template bids (sample messages)

### Language Support
- ✅ English (default)
- ✅ Afrikaans
- ✅ Zulu
- ✅ Easy language switching

---

## Offline Mode

### What Works Offline

✅ **View cached jobs:** Last 50 jobs viewed
✅ **View bids:** All your submitted bids
✅ **View messages:** Last 100 messages per conversation
✅ **View profile:** Your profile and portfolio
✅ **Place bids:** Queued for sync when online
✅ **Draft messages:** Saved and sent when online

### What Requires Internet

❌ Browse new jobs
❌ Search jobs
❌ Real-time messaging
❌ Wallet operations
❌ Profile updates
❌ Image uploads

### Sync Strategy

When connectivity restored:
1. Upload queued bids (highest priority)
2. Send pending messages
3. Refresh job listings
4. Update bid statuses
5. Sync wallet balance
6. Download new messages

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold Start | < 2 seconds | Time to first screen |
| Memory Usage | < 150MB average | Active usage |
| Battery Drain | < 5% per hour | Active usage |
| Network Usage | < 10MB per hour | Browsing jobs |
| FPS | 60 FPS | Scrolling lists |
| Image Load | < 1 second | Per image |
| API Response | < 500ms | Per request |

---

## Security Measures

### Authentication
- JWT tokens with 24-hour expiry
- Refresh tokens for seamless renewal
- Biometric authentication option
- Secure token storage (EncryptedSharedPreferences)
- Auto-logout after 30 minutes inactivity

### Data Protection
- HTTPS-only connections
- Certificate pinning
- SQL injection prevention (Room)
- Input validation and sanitization
- ProGuard code obfuscation

### Privacy
- Location data encrypted
- Sensitive data never cached
- Clear privacy policy
- POPIA compliance (SA data protection)

---

## Multi-Agent Development Plan

### Agent Roles

| Agent | Responsibility | Weeks Active |
|-------|---------------|--------------|
| **ARCH-01** | Architecture, build config, infrastructure | 1-2, 5, 7-9 |
| **DATA-01** | API, database, repositories, offline mode | 1-2, 5 |
| **UI-01** | Design system, components, screens | 1, 3-5, 7 |
| **AUTH-01** | Authentication, security, notifications | 2, 4 |
| **FEAT-01** | Jobs, bidding, messaging features | 3-4 |
| **FEAT-02** | Profile, wallet, settings features | 4-5 |
| **TEST-01** | Testing, quality assurance | 3-8 |
| **QA-01** | Quality gates, final validation | 1-9 |

### Development Phases

**Phase 1 (Week 1):** Project foundation, architecture setup
**Phase 2 (Week 2):** Authentication, offline mode, location services
**Phase 3 (Week 3-4):** Jobs browsing, bidding, image handling
**Phase 4 (Week 5-6):** Messaging, profile, wallet
**Phase 5 (Week 7-8):** Polish, optimization, accessibility
**Phase 6 (Week 9):** Release, monitoring, post-launch

### Quality Gates

After each phase, **QA-01** validates:
- ✓ All features working as designed
- ✓ No critical bugs
- ✓ Tests passing (>80% coverage)
- ✓ Performance benchmarks met
- ✓ Accessibility standards met
- ✓ Security audit passed

**No phase begins until previous phase approved by QA-01.**

---

## Testing Strategy

### Unit Tests (>80% coverage)
- ViewModels business logic
- Repository data operations
- Use case validation
- Data mappers
- Utility functions

### UI Tests
- Screen navigation flows
- Form validation
- User interaction scenarios
- Accessibility testing
- Screenshot tests

### Integration Tests
- API integration
- Database operations
- Offline sync
- Real-time messaging
- Payment flows

### Device Testing Matrix
- **Flagship:** Samsung Galaxy S23, Pixel 7
- **Mid-range:** Samsung A54, Xiaomi Redmi Note
- **Budget:** Samsung A14, Tecno Spark
- **Tablets:** Samsung Tab A8
- **OS Versions:** Android 10-14

---

## Release Strategy

### Beta Testing (Week 9)

**Internal Alpha (Day 1-2):**
- Team testing
- Core flow validation
- Crash monitoring

**Closed Beta (Day 3-4):**
- 50 artisan testers
- Real-world usage
- Feedback collection

**Open Beta (Day 5-7):**
- 500 artisan testers
- Performance monitoring
- Bug fixes

**Production Rollout (Week 10+):**
- 10% rollout (monitor 2 days)
- 50% rollout (monitor 3 days)
- 100% rollout

### Success Criteria

**Technical:**
- Crash-free rate > 99%
- ANR rate < 0.5%
- Performance targets met

**User:**
- App rating > 4.2 stars
- Day 7 retention > 40%
- Feature adoption > 70%

---

## Next Steps

### Immediate Actions

1. **Review Design Specs:**
   - Read `android-app-design.md` for full technical details
   - Understand all screen designs and flows
   - Review API integration requirements

2. **Review Execution Plan:**
   - Read `android-multi-agent-execution-plan.md`
   - Understand agent roles and responsibilities
   - Note quality gate requirements

3. **Setup Development Environment:**
   - Install Android Studio (latest stable)
   - Setup Android SDK 24-34
   - Configure emulators for testing

4. **Confirm Requirements:**
   - Validate backend API is accessible
   - Confirm Socket.IO server ready
   - Verify Firebase project created
   - Check Google Play Console access

### Ready to Start?

**Command to begin Phase 1:**
```
@ARCH-01 @DATA-01 @UI-01 Initialize Phase 1: Project Foundation
```

All agents will work in parallel on their assigned streams, with **QA-01** monitoring progress and enforcing quality gates.

---

## Questions & Support

### Technical Questions
- Architecture decisions → ARCH-01
- API/Database issues → DATA-01
- UI/Design questions → UI-01
- Security concerns → AUTH-01

### Project Questions
- Timeline/scheduling → QA-01
- Quality standards → QA-01
- Testing requirements → TEST-01

### Documentation
- Full technical spec: `android-app-design.md`
- Execution plan: `android-multi-agent-execution-plan.md`
- This summary: `android-app-executive-summary.md`

---

## Success Vision

**In 9 weeks, we will deliver:**

A production-ready Android app that enables South African artisans to:
- Discover nearby jobs effortlessly
- Submit professional bids quickly
- Communicate with clients seamlessly
- Manage their earnings securely
- Build their reputation through reviews

**With a focus on:**
- Simplicity (3 taps to any feature)
- Accessibility (works for all literacy levels)
- Reliability (works offline, low data usage)
- Performance (fast, smooth, battery-efficient)
- Security (safe, private, compliant)

**Ready to build something amazing! 🚀**
