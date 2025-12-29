# Taska Android Client Portal - Quick Start Guide

**Last Updated:** 2025-10-30

---

## 📋 What Is This?

This is the planning documentation for the **Taska Android Client Portal** - a comprehensive feature set that allows clients to post jobs, manage bids, process payments, and review artisans in the native Android app.

---

## 🚀 Quick Navigation

### 📄 Key Documents

1. **START HERE:** [Executive Summary](./android-client-portal-executive-summary.md)
   - High-level overview
   - What we're building
   - Timeline and budget
   - Success criteria
   - **READ THIS FIRST** (15 min read)

2. **COMPREHENSIVE REQUIREMENTS:** [Requirements Document](./android-client-portal-requirements.md)
   - Complete feature specifications
   - Technical architecture
   - Testing strategy (CRITICAL - emphasized by stakeholder)
   - Gap analysis
   - Risk assessment
   - **READ FOR DETAILED UNDERSTANDING** (60 min read)

3. **IMPLEMENTATION PLAN:** [Roadmap Document](./android-client-portal-roadmap.md)
   - Week-by-week implementation plan
   - Agent coordination strategy
   - Quality gates and checkpoints
   - Testing schedule
   - Deliverables per phase
   - **READ BEFORE STARTING IMPLEMENTATION** (30 min read)

---

## 🎯 Project Overview (30-Second Version)

**What:** Native Android features for clients to post jobs, manage bids, pay artisans, and leave reviews

**Duration:** 8 weeks (320 hours)

**Current Status:**
- Foundation: ✅ 100% complete (authentication, architecture, UI components)
- Client Features: ❌ 0% complete (all new work)
- Testing: ❌ 0% complete (tests don't exist for features that don't exist)

**Priority #1:** TESTING (>80% code coverage mandatory - stakeholder emphasized twice)

**Features:**
1. Post Job (multi-step form)
2. Manage Jobs (list, view, edit, cancel, complete, delete)
3. Review Bids (list, view, accept, reject)
4. Process Payments (Stripe integration)
5. Review Artisans (5-star rating system)
6. Messaging (extend existing system)

---

## 🏗️ Architecture at a Glance

```
Clean Architecture (3 Layers)

Presentation Layer (UI)
├─ Screens (Jetpack Compose)
├─ ViewModels (state management)
└─ Components (reusable UI)

Domain Layer (Business Logic)
├─ Models (Job, Bid, Payment, Review)
├─ Use Cases (business operations)
└─ Repository Interfaces

Data Layer (Infrastructure)
├─ API Services (Retrofit)
├─ Room Database (offline cache)
├─ DTOs (request/response objects)
└─ Mappers (DTO ↔ Domain ↔ Entity)
```

---

## 📊 Current State vs Target State

### What We Have ✅

**Infrastructure:**
- Jetpack Compose UI framework
- Clean Architecture setup
- Hilt dependency injection
- Room database with 3 DAOs
- Retrofit API integration
- Authentication system
- Location services
- Image loading (Coil)
- Navigation Compose

**Screens (Artisan-focused):**
- Login/Register
- Splash
- Artisan Home
- Jobs List (artisan view)
- Bids List (artisan view)
- Profile

### What We Need ❌

**Screens (0 of 11 complete):**
- [ ] Client Home/Dashboard
- [ ] Post Job (4-step wizard)
- [ ] My Jobs List
- [ ] Job Details (client view)
- [ ] Edit Job
- [ ] Bids List (client view)
- [ ] Bid Details
- [ ] Payment
- [ ] Payment Success
- [ ] Review Artisan
- [ ] Messages (extend existing)

**Data Layer (0 of 3 new repos):**
- [ ] BidsRepository (complete implementation)
- [ ] PaymentsRepository (new)
- [ ] ReviewsRepository (new)

**API Services (2 new + extensions):**
- [ ] PaymentsApiService (new)
- [ ] ReviewsApiService (new)
- [ ] JobsApiService (extend with client methods)
- [ ] BidsApiService (extend with client methods)

**ViewModels (0 of 7):**
- [ ] PostJobViewModel
- [ ] ClientJobsViewModel
- [ ] JobDetailsViewModel
- [ ] BidsViewModel
- [ ] PaymentViewModel
- [ ] ReviewViewModel
- [ ] EditJobViewModel

**Use Cases (0 of 15):**
- [ ] CreateJobUseCase
- [ ] UpdateJobUseCase
- [ ] DeleteJobUseCase
- [ ] PublishJobUseCase
- [ ] GetMyJobsUseCase
- [ ] GetJobBidsUseCase
- [ ] AcceptBidUseCase
- [ ] RejectBidUseCase
- [ ] InitiatePaymentUseCase
- [ ] GetPaymentStatusUseCase
- [ ] CreateReviewUseCase
- ... (and more)

**Tests (0 tests for 0 features):**
- [ ] Unit tests for ViewModels
- [ ] Unit tests for Use Cases
- [ ] Unit tests for Repositories
- [ ] Integration tests for DAOs
- [ ] Integration tests for API services
- [ ] UI tests for all screens
- [ ] E2E tests for critical flows

---

## 📈 Implementation Timeline

```
Week 1: Foundation (Data Layer)
├─ Create API services
├─ Create domain models
├─ Implement repositories
├─ Setup Room database
└─ Write unit tests
    Target: >85% coverage

Week 2: Job Posting
├─ PostJobViewModel
├─ 4-step UI screens
├─ Image upload
├─ Location picker
└─ Write UI + E2E tests
    Target: >80% coverage

Week 3: Job Management
├─ Job list screen
├─ Job details screen
├─ Edit job screen
├─ Job actions (cancel/complete/delete)
└─ Write tests
    Target: >80% coverage

Week 4: Bid Management
├─ Bids list screen
├─ Bid details screen
├─ Accept/reject logic
├─ Real-time updates
└─ Write tests
    Target: >80% coverage

Week 5: Payment Integration
├─ Payment screens
├─ Stripe SDK integration
├─ Payment processing
├─ Receipt generation
└─ Write tests + security audit
    Target: >85% coverage

Week 6: Reviews
├─ Review screen
├─ Rating components
├─ Review submission
├─ Review history
└─ Write tests
    Target: >80% coverage

Week 7: Testing & Polish
├─ Run full test suite
├─ Fix all bugs
├─ Performance optimization
├─ Accessibility improvements
└─ Achieve >80% coverage
    Target: ALL tests passing

Week 8: Beta & Release
├─ Internal beta
├─ External beta (10+ users)
├─ Feedback incorporation
└─ Production release
    Target: <1% crash rate
```

---

## 🧪 Testing Strategy (CRITICAL!)

### Why Testing is #1 Priority

**Stakeholder explicitly stated:**
> "Testing is **VERY VERY important**"

This was emphasized **TWICE** in the original request. Testing is not optional.

### Coverage Targets (Non-Negotiable)

```
Overall:      >80%  ⭐ PRIMARY SUCCESS METRIC
Unit:         >85%
Integration:  >70%
UI:           >60%
Critical:     100%  ⭐ NO EXCEPTIONS
```

### Testing Approach

**Test-Driven Development (TDD):**
- Write tests alongside implementation (NOT after)
- Every PR requires tests
- Coverage cannot decrease
- CI/CD blocks merge if tests fail

**Test Types:**
1. **Unit Tests** (40%) - ViewModels, Use Cases, Mappers
2. **Integration Tests** (30%) - API + Database
3. **UI Tests** (20%) - Compose UI testing
4. **E2E Tests** (10%) - Complete user flows

**Quality Gates:**
- End of each phase: Tests passing + coverage met
- Before each PR merge: Tests passing + no regression
- Before release: ALL tests passing + >80% coverage

---

## 🚦 Next Steps

### For Stakeholders (Review Phase)

1. **Read Executive Summary** (15 min)
   - Understand what's being built
   - Confirm scope and timeline
   - Review success criteria

2. **Review Requirements** (optional deep dive, 60 min)
   - Detailed feature specifications
   - Technical architecture
   - Testing strategy

3. **Approve or Request Changes**
   - Any scope adjustments?
   - Timeline concerns?
   - Testing strategy acceptable?

4. **Business Decisions Needed:**
   - Confirm platform fee percentage (15%?)
   - Which payment methods to support initially?
   - Review edit window duration (7 days?)
   - MVP vs full feature set?

### For Developers (Implementation Phase)

1. **Read All Three Documents** (105 min total)
   - Executive Summary
   - Requirements Document
   - Roadmap Document

2. **Setup Environment**
   - Ensure backend is running
   - Verify API endpoints accessible
   - Test database connection
   - Install Stripe SDK
   - Install Google Maps SDK (if not present)

3. **Start Phase 1: Design**
   - Invoke `/sc:design` agent
   - Input: Requirements document
   - Output: Technical design document
   - Duration: ~8 hours

4. **Continue with Implementation**
   - Follow roadmap week by week
   - Write tests alongside code
   - Pass quality gates before next phase
   - Track coverage metrics weekly

---

## 📊 Success Metrics

### Functional Success ✅
- All 6 features working correctly
- All offline scenarios handled
- Real-time updates working
- Payment processing secure

### Quality Success ✅ (CRITICAL)
- **>80% overall coverage**
- **>85% unit test coverage**
- **>70% integration test coverage**
- **>60% UI test coverage**
- **100% critical path coverage**
- Zero critical bugs

### Performance Success ✅
- Job posting: <3 seconds
- Image upload: <5 seconds per image
- Startup time: <2 seconds
- Smooth 60fps scrolling
- Memory usage: <150MB

### UX Success ✅
- Intuitive navigation
- Clear error messages
- Accessibility score: >90
- Material Design 3 compliant
- Beta feedback: >4.0/5.0

---

## 🔍 Quick Reference

### File Locations

**Requirements Documents:**
```
claudedocs/
├─ android-client-portal-quickstart.md        (this file)
├─ android-client-portal-executive-summary.md (overview)
├─ android-client-portal-requirements.md      (detailed specs)
└─ android-client-portal-roadmap.md           (implementation plan)
```

**Android Code:**
```
taska-android/app/src/main/kotlin/za/co/taska/
├─ data/          (repositories, API services, DTOs, mappers)
├─ domain/        (models, use cases, repository interfaces)
├─ presentation/  (screens, ViewModels, components)
├─ di/            (Hilt modules)
└─ ...
```

**Tests:**
```
taska-android/app/src/
├─ test/          (unit tests)
└─ androidTest/   (integration + UI tests)
```

**Backend:**
```
backend/src/modules/
├─ jobs/          (jobs controller, service, repository)
├─ bids/          (bids controller, service, repository)
├─ payments/      (payments controller, service)
└─ reviews/       (reviews controller, service)
```

### Command Reference

**Start Design Phase:**
```bash
/sc:design
# Input: Requirements document
# Output: Technical design document
```

**Start Implementation:**
```bash
/sc:implement
# Input: Design document
# Output: Code implementation
```

**Run Tests:**
```bash
/sc:test
# Input: Implemented code
# Output: Test suite + coverage report
```

**Troubleshoot Issues:**
```bash
/sc:troubleshoot
# Input: Bug reports, test failures
# Output: Bug fixes, optimizations
```

**Generate Documentation:**
```bash
/sc:document
# Input: Complete implementation
# Output: API docs, user guides
```

### API Endpoints (Backend)

**Base URL (Debug):** `http://10.0.2.2:3000/api/v1/`
**Base URL (Production):** `https://api.taska.co.za/api/v1/`

**Jobs:**
- `POST /jobs` - Create job
- `GET /jobs/my-jobs` - Get client jobs
- `PATCH /jobs/:id` - Update job
- `PUT /jobs/:id/publish` - Publish draft
- `PUT /jobs/:id/cancel` - Cancel job
- `PUT /jobs/:id/complete` - Complete job
- `DELETE /jobs/:id` - Delete job
- `POST /jobs/upload-image` - Upload image

**Bids:**
- `GET /bids/job/:jobId` - Get job bids
- `GET /bids/job/:jobId/analytics` - Get bid analytics
- `POST /bids/:id/accept` - Accept bid
- `POST /bids/:id/reject` - Reject bid

**Payments:**
- `POST /payments` - Initiate payment
- `GET /payments/:id` - Get payment status
- `GET /payments/history` - Get payment history

**Reviews:**
- `POST /reviews` - Create review
- `GET /reviews/job/:jobId` - Get job reviews

---

## ❓ Common Questions

**Q: Why is testing emphasized so much?**
A: The stakeholder explicitly stated testing is "VERY VERY important" (twice). This is the #1 priority and >80% coverage is a mandatory success criterion.

**Q: Can we reduce scope to ship faster?**
A: Possible, but needs stakeholder approval. Recommend minimum: Job posting + Bid management (Features 1-3). Can defer payments and reviews to v2.

**Q: What if we can't achieve 80% coverage?**
A: Not acceptable. Coverage target is mandatory. Either extend timeline or reduce scope, but do not compromise on testing.

**Q: Do we need all dependencies?**
A: Most are already present. Need to add: Stripe SDK (critical), Google Maps SDK (if using Google Maps for location picker).

**Q: Is the backend ready?**
A: Yes, all required endpoints are implemented and tested. Backend is not a blocker.

**Q: What about the web frontend?**
A: This is ONLY for the Android app. Web frontend is a separate project.

**Q: Can we reuse artisan screens for client?**
A: Some components (JobCard, etc.) can be shared, but client workflows are different enough to require separate screens.

---

## 📞 Getting Help

**For Questions About:**
- **Requirements:** Re-read requirements document, check specific feature sections
- **Implementation:** Review roadmap document, check phase tasks
- **Testing:** Review testing strategy section in requirements document
- **Architecture:** Check architecture section in requirements or executive summary
- **Backend APIs:** Check backend controller files or Swagger docs

**Need Clarification?**
Ask specific questions about any section. Reference document + section for fastest response.

---

## ✅ Checklist Before Starting

### Stakeholder Review
- [ ] Read executive summary
- [ ] Understand scope and timeline
- [ ] Review success criteria
- [ ] Make business decisions (fees, payment methods, etc.)
- [ ] Approve requirements or request changes

### Development Setup
- [ ] Read all three planning documents
- [ ] Understand architecture and design patterns
- [ ] Verify backend is accessible
- [ ] Install required SDKs (Stripe, Maps)
- [ ] Setup test environment
- [ ] Configure CI/CD for automated testing

### Ready to Start
- [ ] Requirements approved
- [ ] Design document ready (from /sc:design)
- [ ] Environment setup complete
- [ ] Team aligned on priorities (TESTING!)
- [ ] Schedule planned (8 weeks, weekly checkpoints)

---

## 🎯 Key Takeaways

1. **Testing is #1 Priority** - >80% coverage mandatory
2. **Strong Foundation** - 80% of infrastructure already exists
3. **Realistic Timeline** - 8 weeks with clear milestones
4. **Phased Delivery** - Working software each week
5. **Quality Focus** - TDD approach, quality gates, CI/CD
6. **Well-Defined Scope** - 6 core features, clearly specified
7. **Backend Ready** - All APIs implemented and tested
8. **High Confidence** - Clear plan, manageable risks

---

**READY TO START? → Read [Executive Summary](./android-client-portal-executive-summary.md) next!**

---

*Last Updated: 2025-10-30*
*Questions? Check the comprehensive requirements document or implementation roadmap.*
