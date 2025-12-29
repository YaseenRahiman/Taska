# Next Session Prompt for Taska Android Client Portal

## Copy-Paste This Prompt to Continue

```
Continue implementing the Taska Android Client Portal following Option 2 strategy (complete one feature at a time).

CURRENT STATUS:
- ✅ Payment feature COMPLETE (34 files)
- ✅ Reviews feature COMPLETE (24 files)
- ⏳ NEXT: Jobs Extensions OR Bids Management

CONTEXT:
I'm building an Android client portal for the Taska platform (marketplace connecting clients with artisans). Following Clean Architecture with Kotlin + Jetpack Compose. Testing is VERY VERY important (>80% coverage NON-NEGOTIABLE).

COMPLETED FEATURES:
1. Payment Feature (Payment methods, transactions, receipts)
   - Data layer: DTOs, Entity, DAO, Mapper, Repository
   - Domain layer: 4 Use Cases with validation
   - Tests: 5 unit tests (>85%), 2 integration tests (>70%)
   - DI: All modules updated, Database v2

2. Reviews Feature (5-category ratings, review text, images)
   - Data layer: DTOs, Entity, DAO, Mapper, Repository
   - Domain layer: 4 Use Cases (Create, Update, GetJob, GetArtisan)
   - Tests: 5 unit tests (>85%), 2 integration tests (>70%)
   - DI: All modules updated, Database v3

NEXT FEATURES (Choose One):

Option A - Jobs Extensions (Client-Specific Endpoints):
- Implement POST /api/jobs (client creates job)
- Implement PUT /api/jobs/:id (client updates job)
- Implement DELETE /api/jobs/:id (client cancels job)
- Follow same pattern: Data layer → Domain layer → Tests → DI
- Target: >85% unit coverage, >70% integration coverage

Option B - Bids Management:
- Implement GET /api/jobs/:id/bids (client views bids)
- Implement PUT /api/bids/:id/accept (client accepts bid)
- Implement PUT /api/bids/:id/reject (client rejects bid)
- Follow same pattern: Data layer → Domain layer → Tests → DI
- Target: >85% unit coverage, >70% integration coverage

IMPORTANT REQUIREMENTS:
- Testing is CRITICAL - never skip tests to "save time"
- Follow Clean Architecture (Presentation → Domain ← Data)
- Use existing patterns from Payment/Reviews features
- Backend coordination: Use @agent-backend-architect to verify API contracts
- Complete implementation (no TODOs, no placeholders, no mock data)
- Update DI modules and database migrations when needed

PROJECT STRUCTURE:
taska-android/
├── app/src/main/kotlin/za/co/taska/
│   ├── data/
│   │   ├── remote/dto/ (request/response DTOs)
│   │   ├── local/entity/ (Room entities)
│   │   ├── local/dao/ (Room DAOs)
│   │   ├── mapper/ (DTO ↔ Domain ↔ Entity)
│   │   └── repository/ (Repository implementations)
│   ├── domain/
│   │   ├── model/ (Domain models)
│   │   ├── repository/ (Repository interfaces)
│   │   └── usecase/ (Business logic with validation)
│   └── di/ (Hilt DI modules)
├── app/src/test/kotlin/ (Unit tests)
└── app/src/androidTest/kotlin/ (Integration tests)

TECH STACK:
- Kotlin + Jetpack Compose + Material Design 3
- Room Database (offline storage)
- Retrofit + OkHttp (API communication)
- Hilt DI (dependency injection)
- Coroutines + Flow (async operations)
- JUnit 4 + Mockito-Kotlin + Turbine (testing)
- MockWebServer (API integration tests)

TESTING METHODOLOGY:
- Unit tests: >85% coverage target (validation, business logic, repository)
- Integration tests: >70% coverage target (Room DAO, MockWebServer API)
- Test all validation rules, error cases, edge cases
- Test Flow observations with Turbine
- Test API serialization/deserialization

WORKFLOW:
1. Plan the feature implementation (use TodoWrite)
2. Create data layer (DTOs, Entity, DAO, Mapper, Repository)
3. Create domain layer (Use Cases with validation)
4. Write unit tests (>85% coverage)
5. Write integration tests (>70% coverage)
6. Update DI modules (NetworkModule, RepositoryModule, DatabaseModule)
7. Update TaskaDatabase (increment version, add entity, add DAO method)
8. Verify everything compiles and tests pass
9. Create completion summary document

REFERENCE DOCUMENTS:
- Technical Design: claudedocs/android-client-portal-technical-design.md
- Requirements: claudedocs/android-client-portal-requirements.md
- Payment Feature Summary: claudedocs/payment-feature-complete.md
- Reviews Feature Summary: claudedocs/reviews-feature-complete.md

YOUR CHOICE: Which feature should I implement next - Jobs Extensions (Option A) or Bids Management (Option B)?
```

---

## Alternative: Use SuperClaude /sc:task Command

```
/sc:task "Continue implementing Taska Android Client Portal. Payment and Reviews features complete (58 files total). Choose next feature: Jobs Extensions OR Bids Management. Follow Clean Architecture, achieve >85% unit test coverage and >70% integration test coverage. Use patterns from completed features. Context in claudedocs/NEXT_SESSION_PROMPT.md"
```

---

## Alternative: Use SuperClaude /sc:implement Command

```
/sc:implement "Taska Android Client Portal - Next Feature

STATUS: Payment ✅ Reviews ✅ → Jobs Extensions OR Bids Management

REQUIREMENTS:
- Clean Architecture (Data → Domain layers only, no Presentation yet)
- Testing: >85% unit, >70% integration (NON-NEGOTIABLE)
- Follow patterns from Payment/Reviews features
- Complete implementation (no TODOs/placeholders)

CONTEXT DOCS:
- Technical Design: claudedocs/android-client-portal-technical-design.md
- Requirements: claudedocs/android-client-portal-requirements.md
- Payment Summary: claudedocs/payment-feature-complete.md
- Reviews Summary: claudedocs/reviews-feature-complete.md

Choose feature and implement end-to-end with comprehensive tests."
```

---

## Alternative: Load Session Context with /sc:load

```
/sc:load "Taska Android Client Portal development session. Review claudedocs/ for context: requirements, technical design, Payment feature (34 files), Reviews feature (24 files). Next: Jobs Extensions OR Bids Management. Clean Architecture + comprehensive testing required."
```

---

## Recommended Approach (Most Comprehensive)

**Step 1:** Load context
```
/sc:load "Taska Android Client Portal - continuing development after Payment and Reviews features"
```

**Step 2:** Get recommendation
```
/sc:task "Analyze completed Payment and Reviews features in claudedocs/, recommend whether to implement Jobs Extensions or Bids Management next based on:
1. Logical feature dependency order
2. Client user flow (what clients need most)
3. Complexity and implementation risk
4. Testing coverage considerations

Provide recommendation with rationale."
```

**Step 3:** Implement chosen feature
```
/sc:implement "[CHOSEN FEATURE] for Taska Android Client Portal

Follow patterns from Payment/Reviews features:
- Data layer: DTOs, Entity, DAO, Mapper, Repository
- Domain layer: Use Cases with validation
- Tests: >85% unit, >70% integration
- DI: Update modules, migrate database

See claudedocs/ for requirements and technical design."
```

---

## Quick Start (If You Want Me to Decide)

```
Continue Taska Android Client Portal development. Payment and Reviews features complete (58 files, >85% test coverage).

Analyze claudedocs/android-client-portal-requirements.md and claudedocs/android-client-portal-technical-design.md, then:

1. Recommend next feature: Jobs Extensions OR Bids Management
2. Provide rationale based on client user flow and dependencies
3. Implement chosen feature following established patterns
4. Achieve >85% unit test coverage and >70% integration test coverage

Use Clean Architecture, Kotlin + Compose, Room + Retrofit + Hilt. Testing is CRITICAL.
```

---

## Session Continuity Files

These files contain full context for next session:

1. **claudedocs/NEXT_SESSION_PROMPT.md** (this file)
2. **claudedocs/android-client-portal-requirements.md** - Complete requirements
3. **claudedocs/android-client-portal-technical-design.md** - Architecture and patterns
4. **claudedocs/payment-feature-complete.md** - Payment feature summary
5. **claudedocs/reviews-feature-complete.md** - Reviews feature summary

---

## Key Reminders for Next Session

✅ **DO:**
- Follow Clean Architecture strictly
- Write tests BEFORE marking feature complete
- Use existing Payment/Reviews patterns
- Update DI modules and database migrations
- Create completion summary when done

❌ **DON'T:**
- Skip tests to "save time" (testing is CRITICAL)
- Create TODOs or placeholders
- Deviate from established patterns
- Forget to increment database version
- Mix presentation layer (ViewModels/UI) with data/domain

---

## Expected Outcome

By end of next session, you should have:
- ✅ Feature data layer complete (DTOs, Entity, DAO, Mapper, Repository)
- ✅ Feature domain layer complete (Use Cases with validation)
- ✅ Unit tests >85% coverage
- ✅ Integration tests >70% coverage
- ✅ DI modules updated
- ✅ Database migrated to next version
- ✅ Completion summary document created
- ✅ All code compiling and tests passing

Total: ~20-25 new files following established patterns.
