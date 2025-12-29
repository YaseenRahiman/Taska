# Taska Platform - Technical Architecture

**Version**: 1.0.0
**Last Updated**: 2025-10-19
**Architecture Type**: Monolithic with Microservice-ready modules

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Database Design](#database-design)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Design](#api-design)
7. [Real-Time Communication](#real-time-communication)
8. [Payment Processing](#payment-processing)
9. [Security Architecture](#security-architecture)
10. [Scalability & Performance](#scalability--performance)
11. [Monitoring & Logging](#monitoring--logging)

---

## System Overview

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐      │
│  │  Web Browser  │  │ Mobile Browser│  │  Admin Panel │      │
│  │   (Next.js)   │  │   (Next.js)   │  │   (Next.js)  │      │
│  └───────┬───────┘  └───────┬───────┘  └──────┬───────┘      │
└──────────┼──────────────────┼──────────────────┼──────────────┘
           │                  │                  │
           │  HTTP/HTTPS      │  WebSocket       │
           │  REST API        │  Real-time       │
           │                  │                  │
┌──────────▼──────────────────▼──────────────────▼──────────────┐
│                     APPLICATION LAYER                          │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              NestJS API Gateway                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │   Auth   │ │   Jobs   │ │   Bids   │ │ Payments │  │   │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │   │
│  │       │            │            │            │          │   │
│  │  ┌────┴────────────┴────────────┴────────────┴──────┐  │   │
│  │  │           Business Logic Layer                    │  │   │
│  │  │  • Services  • Repositories  • DTOs              │  │   │
│  │  └────┬────────────┬────────────┬────────────┬──────┘  │   │
│  └───────┼────────────┼────────────┼────────────┼─────────┘   │
└──────────┼────────────┼────────────┼────────────┼─────────────┘
           │            │            │            │
┌──────────▼────────────▼────────────▼────────────▼─────────────┐
│                      DATA LAYER                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ PostgreSQL │  │   Redis    │  │ File Store │              │
│  │ (Primary)  │  │  (Cache)   │  │ (S3/Local) │              │
│  └────────────┘  └────────────┘  └────────────┘              │
└────────────────────────────────────────────────────────────────┘
           │            │            │
┌──────────▼────────────▼────────────▼───────────────────────────┐
│                  EXTERNAL SERVICES                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐     │
│  │  Stripe  │  │ PayFast  │  │  Email   │  │  SMS/Push │     │
│  │ Payments │  │ Payments │  │ Service  │  │Notifications│     │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘     │
└────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns**: Clear boundaries between modules and layers
2. **DRY (Don't Repeat Yourself)**: Shared utilities and common modules
3. **SOLID Principles**: Applied throughout backend services
4. **API-First Design**: Backend exposes RESTful API consumed by frontend
5. **Type Safety**: TypeScript end-to-end for compile-time error detection
6. **Scalability**: Modular design ready for microservice extraction

---

## Backend Architecture

### NestJS Module Structure

```
backend/src/
├── auth/                       # Authentication Module
│   ├── auth.controller.ts      # Login, register, logout endpoints
│   ├── auth.service.ts         # Auth business logic
│   ├── auth.module.ts          # Module configuration
│   ├── dto/                    # Data Transfer Objects
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   └── change-password.dto.ts
│   ├── guards/                 # Authorization guards
│   │   ├── jwt-auth.guard.ts   # JWT authentication
│   │   └── roles.guard.ts      # Role-based access control
│   └── strategies/             # Passport strategies
│       ├── jwt.strategy.ts     # JWT validation
│       └── local.strategy.ts   # Username/password validation
│
├── modules/
│   ├── jobs/                   # Job Management Module
│   │   ├── jobs.controller.ts  # HTTP endpoints
│   │   ├── jobs.service.ts     # Business logic
│   │   ├── jobs.repository.ts  # Database operations
│   │   ├── jobs.module.ts      # Module configuration
│   │   ├── dto/                # Request/response DTOs
│   │   ├── entities/           # Domain entities
│   │   └── services/           # Specialized services
│   │       ├── job-matching.service.ts    # Location-based matching
│   │       └── image-processing.service.ts # Image handling
│   │
│   ├── bids/                   # Bidding System Module
│   │   ├── bids.controller.ts
│   │   ├── bids.service.ts
│   │   ├── bids.repository.ts
│   │   └── bids.module.ts
│   │
│   ├── payments/               # Payment Processing Module
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── payments.module.ts
│   │   └── services/
│   │       ├── stripe.service.ts    # Stripe integration
│   │       ├── payfast.service.ts   # PayFast integration
│   │       └── escrow.service.ts    # Escrow management
│   │
│   ├── messages/               # Messaging System Module
│   │   ├── messages.gateway.ts      # WebSocket gateway
│   │   ├── messages.controller.ts   # REST endpoints
│   │   ├── messages.service.ts
│   │   └── messages.module.ts
│   │
│   ├── reviews/                # Review System Module
│   │   ├── reviews.controller.ts
│   │   ├── reviews.service.ts
│   │   └── reviews.module.ts
│   │
│   ├── categories/             # Category Management Module
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   └── categories.module.ts
│   │
│   └── admin/                  # Admin Operations Module
│       ├── admin.controller.ts
│       ├── admin.service.ts
│       └── admin.module.ts
│
├── common/                     # Shared Utilities
│   ├── decorators/             # Custom decorators
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/                 # Shared guards
│   │   └── roles.guard.ts
│   ├── filters/                # Exception filters
│   │   ├── http-exception.filter.ts
│   │   └── prisma-exception.filter.ts
│   ├── interceptors/           # Request/response interceptors
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/                  # Validation pipes
│   │   └── validation.pipe.ts
│   └── utils/                  # Utility functions
│       ├── password.util.ts
│       └── date.util.ts
│
├── config/                     # Configuration
│   ├── env.validation.ts       # Environment variable validation
│   └── configuration.ts        # App configuration
│
├── database/                   # Database Service
│   └── prisma.service.ts       # Prisma client wrapper
│
├── health/                     # Health Checks
│   ├── health.controller.ts
│   ├── health.service.ts
│   └── health.module.ts
│
├── users/                      # User Management
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
│
├── app.module.ts               # Root application module
└── main.ts                     # Application entry point
```

### Request Flow

```
1. HTTP Request
   ↓
2. Middleware Layer
   ├─ CORS validation
   ├─ Helmet security headers
   ├─ Rate limiting
   └─ Request logging
   ↓
3. Guard Layer
   ├─ JWT authentication (JwtAuthGuard)
   ├─ Role-based authorization (RolesGuard)
   └─ Custom business logic guards
   ↓
4. Pipe Layer
   ├─ Validation pipe (class-validator)
   ├─ Transform pipe (DTOs)
   └─ Parse pipes (ParseIntPipe, etc.)
   ↓
5. Controller Layer
   ├─ Route handling
   ├─ Request parameter extraction
   └─ Service method invocation
   ↓
6. Service Layer
   ├─ Business logic execution
   ├─ Repository/database calls
   ├─ External service calls
   └─ Error handling
   ↓
7. Repository Layer
   ├─ Prisma queries
   ├─ Database transactions
   └─ Data mapping
   ↓
8. Interceptor Layer (Response)
   ├─ Response transformation
   ├─ Success logging
   └─ Performance metrics
   ↓
9. Exception Filter (if error)
   ├─ Error formatting
   ├─ Error logging
   └─ User-friendly error response
   ↓
10. HTTP Response
```

### Service Layer Pattern

```typescript
// Example: jobs.service.ts

@Injectable()
export class JobsService {
  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly jobMatchingService: JobMatchingService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggerService,
  ) {}

  async createJob(userId: string, createJobDto: CreateJobDto): Promise<Job> {
    this.logger.log(`Creating job for user ${userId}`);

    // 1. Validate business rules
    await this.validateJobCreation(userId, createJobDto);

    // 2. Create job in database
    const job = await this.jobsRepository.create({
      ...createJobDto,
      clientId: userId,
      status: 'OPEN',
    });

    // 3. Find matching artisans
    const matchedArtisans = await this.jobMatchingService.findMatches(job);

    // 4. Send notifications
    await this.notificationsService.notifyArtisans(matchedArtisans, job);

    // 5. Return created job
    return job;
  }

  private async validateJobCreation(
    userId: string,
    dto: CreateJobDto,
  ): Promise<void> {
    // Business validation logic
  }
}
```

### Repository Pattern

```typescript
// Example: jobs.repository.ts

@Injectable()
export class JobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.JobCreateInput): Promise<Job> {
    return this.prisma.job.create({
      data,
      include: {
        category: true,
        client: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Job | null> {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        category: true,
        client: {
          include: {
            profile: true,
          },
        },
        bids: {
          include: {
            artisan: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Job[]> {
    // PostGIS-style proximity search using raw SQL
    return this.prisma.$queryRaw`
      SELECT * FROM jobs
      WHERE status = 'OPEN'
        AND (
          6371 * acos(
            cos(radians(${latitude}))
            * cos(radians(latitude))
            * cos(radians(longitude) - radians(${longitude}))
            + sin(radians(${latitude}))
            * sin(radians(latitude))
          )
        ) <= ${radiusKm}
      ORDER BY created_at DESC
    `;
  }
}
```

---

## Frontend Architecture

### Next.js App Router Structure

```
frontend/src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (providers)
│   ├── page.tsx                # Landing page
│   ├── loading.tsx             # Loading UI
│   ├── error.tsx               # Error boundary
│   ├── not-found.tsx           # 404 page
│   │
│   ├── (auth)/                 # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── register/
│   │   │   └── page.tsx        # Registration page
│   │   └── verify-email/
│   │       └── page.tsx        # Email verification
│   │
│   ├── client/                 # Client portal
│   │   ├── layout.tsx          # Client layout
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Client dashboard
│   │   ├── jobs/
│   │   │   ├── page.tsx        # Job list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx    # Job details
│   │   │   └── create/
│   │   │       └── page.tsx    # Create job
│   │   └── messages/
│   │       └── page.tsx        # Messages
│   │
│   ├── artisan/                # Artisan portal
│   │   ├── layout.tsx          # Artisan layout
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Artisan dashboard
│   │   ├── jobs/
│   │   │   ├── page.tsx        # Browse jobs
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Job details + bid
│   │   ├── bids/
│   │   │   └── page.tsx        # My bids
│   │   └── profile/
│   │       └── page.tsx        # Profile management
│   │
│   └── admin/                  # Admin portal
│       ├── layout.tsx          # Admin layout
│       ├── dashboard/
│       │   └── page.tsx        # Admin dashboard
│       ├── users/
│       │   └── page.tsx        # User management
│       └── moderation/
│           └── page.tsx        # Content moderation
│
├── components/
│   ├── ui/                     # Base UI components
│   │   ├── button.tsx          # Button component
│   │   ├── card.tsx            # Card component
│   │   ├── badge.tsx           # Badge component
│   │   ├── tabs.tsx            # Tabs component
│   │   ├── dialog.tsx          # Dialog component
│   │   └── select.tsx          # Select component
│   │
│   ├── providers/              # Context providers
│   │   ├── auth-provider.tsx   # Authentication context
│   │   ├── theme-provider.tsx  # Theme context
│   │   ├── query-provider.tsx  # React Query provider
│   │   └── toast-provider.tsx  # Toast notifications
│   │
│   ├── auth/                   # Auth components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   └── client/                 # Client-specific components
│       ├── JobCard.tsx
│       ├── JobForm.tsx
│       └── BidList.tsx
│
├── lib/
│   ├── api.ts                  # Axios API client
│   ├── utils.ts                # Utility functions (cn, etc.)
│   └── validations/            # Zod schemas
│       ├── job.schema.ts
│       └── auth.schema.ts
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts              # Auth hook
│   ├── useJobs.ts              # Jobs data fetching
│   ├── useBids.ts              # Bids data fetching
│   └── useWebSocket.ts         # WebSocket connection
│
└── styles/
    └── globals.css             # Global styles + Tailwind
```

### Component Architecture

```
┌─────────────────────────────────────────┐
│           App Layout                    │
│  ┌───────────────────────────────────┐  │
│  │       Provider Tree                │  │
│  │  ┌──────────────────────────────┐ │  │
│  │  │    AuthProvider              │ │  │
│  │  │  ┌────────────────────────┐  │ │  │
│  │  │  │   ThemeProvider        │  │ │  │
│  │  │  │  ┌──────────────────┐  │  │ │  │
│  │  │  │  │  QueryProvider   │  │  │ │  │
│  │  │  │  │  ┌────────────┐  │  │  │ │  │
│  │  │  │  │  │ Page       │  │  │  │ │  │
│  │  │  │  │  │ Component  │  │  │  │ │  │
│  │  │  │  │  └────────────┘  │  │  │ │  │
│  │  │  │  └──────────────────┘  │  │ │  │
│  │  │  └────────────────────────┘  │ │  │
│  │  └──────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

Page Component Breakdown:
┌─────────────────────────────────────────┐
│          Page Component                 │
│  ┌───────────────────────────────────┐  │
│  │    Feature Components              │  │
│  │  ┌─────────┐  ┌─────────┐        │  │
│  │  │ JobList │  │BidForm  │        │  │
│  │  └────┬────┘  └────┬────┘        │  │
│  │       │            │              │  │
│  │  ┌────▼─────────────▼────┐       │  │
│  │  │   UI Components        │       │  │
│  │  │  • Button              │       │  │
│  │  │  • Card                │       │  │
│  │  │  • Badge               │       │  │
│  │  └────────────────────────┘       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### State Management Strategy

**Server State (React Query)**:
```typescript
// For data fetched from API
const { data: jobs, isLoading, error } = useQuery({
  queryKey: ['jobs', filters],
  queryFn: () => api.getJobs(filters),
});

const createJob = useMutation({
  mutationFn: (data) => api.createJob(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['jobs']);
  },
});
```

**Client State (Zustand)**:
```typescript
// For UI state (modals, filters, etc.)
interface UIStore {
  isJobModalOpen: boolean;
  setJobModalOpen: (open: boolean) => void;
}

const useUIStore = create<UIStore>((set) => ({
  isJobModalOpen: false,
  setJobModalOpen: (open) => set({ isJobModalOpen: open }),
}));
```

**Auth State (Context)**:
```typescript
// Global authentication state
const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth methods...

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Database Design

### Entity Relationship Diagram

```
┌──────────┐
│   User   │
└────┬─────┘
     │ 1:1
     ├───────────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────────┐
│ Profile │  │ArtisanSpecializ. │
└─────────┘  └──────────────────┘
     │
     │ 1:n (as client)
     ├────────────┐
     │            │
     ▼            │
┌─────────┐       │
│   Job   │       │
└────┬────┘       │
     │            │
     │ 1:n        │ 1:n (as artisan)
     ├────┐       │
     │    │       │
     ▼    ▼       ▼
┌──────┐ ┌──────────┐
│ Bid  │ │ Message  │
└──────┘ └──────────┘
     │
     │ 1:1 (accepted bid)
     │
     ▼
┌─────────┐
│ Payment │
└────┬────┘
     │
     │ 1:1
     │
     ▼
┌──────────┐
│  Review  │
└──────────┘

Additional Relations:
User ─── 1:1 ─── Wallet
User ─── 1:n ─── Notification
User ─── 1:n ─── ActivityLog
```

### Key Database Indexes

Performance-critical indexes:

```prisma
// User indexes
@@index([email])           // Login lookup
@@index([role])            // Role filtering
@@index([createdAt])       // User listing
@@index([verifiedAt])      // Verified users

// Job indexes
@@index([clientId])        // Client's jobs
@@index([categoryId])      // Category filtering
@@index([status])          // Status filtering
@@index([latitude, longitude])  // Location search
@@index([createdAt])       // Recent jobs

// Bid indexes
@@index([jobId])           // Job's bids
@@index([artisanId])       // Artisan's bids
@@index([status])          // Bid status filtering
@@unique([jobId, artisanId])  // One bid per job per artisan

// Message indexes
@@index([jobId])           // Job conversation
@@index([senderId])        // Sent messages
@@index([receiverId])      // Received messages

// Payment indexes
@@index([jobId])           // Job payments
@@index([payerId])         // User's payments
@@index([payeeId])         // User's earnings
@@index([status])          // Payment status
```

### Database Transactions

Critical operations use transactions:

```typescript
// Example: Accept bid transaction
async acceptBid(bidId: string, clientId: string): Promise<AcceptBidResult> {
  return this.prisma.$transaction(async (tx) => {
    // 1. Verify bid ownership
    const bid = await tx.bid.findUnique({
      where: { id: bidId },
      include: { job: true },
    });

    if (bid.job.clientId !== clientId) {
      throw new ForbiddenException('Not job owner');
    }

    // 2. Update bid status
    const acceptedBid = await tx.bid.update({
      where: { id: bidId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    // 3. Update job status
    await tx.job.update({
      where: { id: bid.jobId },
      data: { status: 'IN_PROGRESS' },
    });

    // 4. Reject other bids
    await tx.bid.updateMany({
      where: {
        jobId: bid.jobId,
        id: { not: bidId },
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    });

    // 5. Create payment record
    const payment = await tx.payment.create({
      data: {
        jobId: bid.jobId,
        payerId: bid.job.clientId,
        payeeId: bid.artisanId,
        amount: bid.amount,
        status: 'PENDING',
        escrowStatus: 'HELD',
      },
    });

    return { bid: acceptedBid, payment };
  });
}
```

---

## Authentication & Authorization

### JWT Token Structure

**Access Token** (24h expiry):
```json
{
  "sub": "user_clxxx123456789",
  "email": "user@example.com",
  "role": "CLIENT",
  "iat": 1609459200,
  "exp": 1609545600
}
```

**Refresh Token** (7d expiry):
```json
{
  "sub": "user_clxxx123456789",
  "tokenId": "refresh_token_uuid",
  "iat": 1609459200,
  "exp": 1610064000
}
```

### Role-Based Access Control (RBAC)

```typescript
// Roles hierarchy
enum UserRole {
  CLIENT = 'CLIENT',       // Can post jobs, accept bids
  ARTISAN = 'ARTISAN',     // Can submit bids, complete jobs
  ASSESSOR = 'ASSESSOR',   // Can verify artisans, resolve disputes
  ADMIN = 'ADMIN',         // Full platform access
}

// Permission matrix
const permissions = {
  CLIENT: ['job:create', 'job:update:own', 'bid:view', 'bid:accept'],
  ARTISAN: ['bid:create', 'bid:update:own', 'job:view', 'job:complete'],
  ASSESSOR: ['artisan:verify', 'dispute:resolve', 'review:moderate'],
  ADMIN: ['*'], // All permissions
};
```

### Guards Implementation

```typescript
// JWT Authentication Guard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}

// Role-Based Authorization Guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No role requirement
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### Usage in Controllers

```typescript
@Controller('jobs')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class JobsController {

  @Post()
  @Roles(UserRole.CLIENT) // Only clients can create jobs
  @UseGuards(RolesGuard)
  async createJob(
    @CurrentUser() user: User,
    @Body() createJobDto: CreateJobDto,
  ) {
    return this.jobsService.create(user.id, createJobDto);
  }

  @Get()
  @Public() // Override auth requirement
  async listJobs(@Query() filters: JobFiltersDto) {
    return this.jobsService.findAll(filters);
  }
}
```

---

## API Design

### RESTful Conventions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/jobs` | List jobs | Optional |
| GET | `/jobs/:id` | Get job details | Required |
| POST | `/jobs` | Create job | CLIENT only |
| PATCH | `/jobs/:id` | Update job | Owner only |
| DELETE | `/jobs/:id` | Delete job | Owner/ADMIN |
| POST | `/jobs/:id/publish` | Publish draft | Owner only |
| POST | `/jobs/:id/cancel` | Cancel job | Owner/ADMIN |

### Response Formats

**Success Response**:
```json
{
  "data": {
    "id": "job_123",
    "title": "Fix Kitchen Sink",
    "status": "OPEN"
  },
  "meta": {
    "timestamp": "2025-10-19T10:00:00Z"
  }
}
```

**List Response**:
```json
{
  "data": [
    { "id": "job_1", "title": "Job 1" },
    { "id": "job_2", "title": "Job 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "meta": {
    "timestamp": "2025-10-19T10:00:00Z"
  }
}
```

**Error Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "budgetMin",
      "message": "Budget minimum must be a positive number"
    }
  ],
  "timestamp": "2025-10-19T10:00:00Z",
  "path": "/api/v1/jobs"
}
```

### API Versioning

```typescript
// main.ts
app.setGlobalPrefix('api/v1');

// Future versions
// app.setGlobalPrefix('api/v2');
```

---

## Real-Time Communication

### WebSocket Gateway

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  // Authenticate connection
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  // Send message
  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.create({
      senderId: client.data.userId,
      receiverId: data.receiverId,
      content: data.content,
      jobId: data.jobId,
    });

    // Emit to receiver
    this.server
      .to(`user:${data.receiverId}`)
      .emit('message:received', message);

    return message;
  }
}
```

### WebSocket Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `message:send` | Client → Server | `{ receiverId, content, jobId }` | Send message |
| `message:received` | Server → Client | `{ id, senderId, content, createdAt }` | New message |
| `notification:new` | Server → Client | `{ type, title, message }` | New notification |
| `bid:received` | Server → Client | `{ jobId, bidId, artisanId }` | New bid on job |
| `job:updated` | Server → Client | `{ jobId, status }` | Job status changed |

---

## Payment Processing

### Payment Flow Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   PAYMENT LIFECYCLE                       │
│                                                           │
│  1. BID ACCEPTED                                         │
│     ├─ Create payment record (status: PENDING)          │
│     ├─ Escrow status: HELD                              │
│     └─ Notify both parties                              │
│                                                           │
│  2. CLIENT PAYMENT                                       │
│     ├─ Stripe/PayFast payment intent                    │
│     ├─ Client confirms payment                          │
│     ├─ Payment status: PROCESSING → COMPLETED           │
│     └─ Funds held in escrow                             │
│                                                           │
│  3. JOB COMPLETION                                       │
│     ├─ Artisan marks job complete                       │
│     ├─ Client reviews and approves                      │
│     ├─ Platform fee calculated                          │
│     └─ Release escrow initiated                         │
│                                                           │
│  4. ESCROW RELEASE                                       │
│     ├─ Escrow status: HELD → RELEASED                   │
│     ├─ Transfer to artisan wallet                       │
│     ├─ Platform fee deducted                            │
│     └─ Wallet transaction recorded                      │
│                                                           │
│  5. WITHDRAWAL (Optional)                                │
│     ├─ Artisan requests withdrawal                      │
│     ├─ Bank transfer initiated                          │
│     └─ Withdrawal status: PENDING → COMPLETED           │
└──────────────────────────────────────────────────────────┘
```

### Escrow State Machine

```
PAYMENT CREATED (PENDING)
         │
         ▼
  PAYMENT PROCESSING
         │
         ├──────┐
         │      │ (success)
         ▼      ▼
   PAYMENT     ESCROW
  COMPLETED     HELD
                 │
                 ├────────┐
                 │        │ (dispute)
                 │        ▼
                 │   ESCROW DISPUTED
                 │        │
                 │        ├──────┐
                 │        │      │
                 │        ▼      ▼
                 │   RELEASED  REFUNDED
                 │
                 │ (job complete + approval)
                 ▼
             ESCROW RELEASED
                 │
                 ▼
          WALLET CREDITED
```

---

## Security Architecture

### Security Layers

1. **Network Layer**:
   - HTTPS enforcement
   - CORS configuration
   - Rate limiting (IP-based)

2. **Application Layer**:
   - Helmet.js security headers
   - Input validation (class-validator)
   - Output sanitization
   - SQL injection prevention (Prisma)

3. **Authentication Layer**:
   - Password hashing (bcrypt, 12 rounds)
   - JWT token signing
   - Token rotation
   - Session management

4. **Authorization Layer**:
   - Role-based access control
   - Resource ownership validation
   - Permission checks

### Security Best Practices

```typescript
// 1. Password hashing
const hashedPassword = await bcrypt.hash(password, 12);

// 2. JWT secret rotation
const accessToken = this.jwtService.sign(payload, {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
});

// 3. Input validation
@IsEmail()
@IsNotEmpty()
email: string;

// 4. SQL injection prevention (Prisma)
const user = await this.prisma.user.findUnique({
  where: { email }, // Parameterized query
});

// 5. Rate limiting
@Throttle(5, 60) // 5 requests per 60 seconds
@Post('login')
async login() {}
```

---

## Scalability & Performance

### Performance Optimization Strategies

1. **Database Query Optimization**:
   - Strategic indexing
   - Query result limiting
   - Efficient JOIN operations
   - Connection pooling

2. **Caching Strategy**:
   ```typescript
   // Redis caching for expensive operations
   @Cacheable('jobs:nearby', 300) // 5 minute cache
   async findNearbyJobs(lat: number, lng: number) {
     return this.jobsRepository.findNearby(lat, lng);
   }
   ```

3. **Pagination**:
   ```typescript
   @Get()
   async listJobs(@Query() query: JobQueryDto) {
     const { page = 1, limit = 20 } = query;
     return this.jobsService.paginate(page, limit, query);
   }
   ```

4. **API Response Compression**:
   ```typescript
   // main.ts
   app.use(compression());
   ```

5. **Image Optimization**:
   - Next.js Image component
   - Lazy loading
   - WebP format conversion
   - CDN delivery

### Horizontal Scaling Readiness

Current architecture supports scaling:

```
        Load Balancer
              │
      ┌───────┼───────┐
      │       │       │
   App 1   App 2   App 3
      │       │       │
      └───────┼───────┘
              │
    ┌─────────┴─────────┐
    │                   │
PostgreSQL          Redis
(Primary +     (Cluster)
 Replicas)
```

---

## Monitoring & Logging

### Logging Strategy

```typescript
// Winston logger configuration
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Usage
this.logger.log('Job created', { jobId, userId });
this.logger.error('Payment failed', { error, paymentId });
```

### Health Check Endpoints

```
GET /health
├─ Basic health check
└─ Response: { status: 'ok', uptime: 86400 }

GET /health/detailed
├─ Comprehensive health check
├─ Database connectivity
├─ Redis connectivity
├─ External services status
└─ Response time metrics
```

---

**Last Updated**: 2025-10-19
**Architecture Version**: 1.0.0
**Document Maintained By**: Taska Development Team
