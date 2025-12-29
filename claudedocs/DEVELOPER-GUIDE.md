# Taska Platform - Developer Guide

**Version**: 1.0.0
**Last Updated**: 2025-01-09

Complete developer guide for the Taska Platform - connecting skilled artisans with clients in South Africa.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Architecture Overview](#architecture-overview)
5. [Database Management](#database-management)
6. [API Integration](#api-integration)
7. [Authentication Flow](#authentication-flow)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v9.x or higher
- **PostgreSQL**: v14.x or higher
- **Redis**: v7.x or higher (optional, for caching)
- **Git**: Latest version

### Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-org/taska-platform.git
cd taska-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Configuration

#### Backend (.env)

Create `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/taska_dev"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# API Configuration
PORT=3000
NODE_ENV="development"
API_VERSION="v1"

# CORS
CORS_ORIGINS="http://localhost:3001,http://localhost:3000"

# Email (Development - use Mailtrap or similar)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-mailtrap-user"
SMTP_PASSWORD="your-mailtrap-password"
EMAIL_FROM="noreply@taska.co.za"

# Payment Providers
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYFAST_MERCHANT_ID="your-merchant-id"
PAYFAST_MERCHANT_KEY="your-merchant-key"
PAYFAST_PASSPHRASE="your-passphrase"

# Redis (Optional)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880  # 5MB

# Rate Limiting
RATE_LIMIT_TTL=900  # 15 minutes
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL="debug"
```

#### Frontend (.env.local)

Create `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
NEXT_PUBLIC_WS_URL="ws://localhost:3000"

# Application
NEXT_PUBLIC_APP_NAME="Taska"
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Google Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### Database Setup

```bash
cd backend

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed
```

### Start Development Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Access**:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1
- API Docs: http://localhost:3000/api/docs

---

## Project Structure

```
taska-platform/
├── backend/
│   ├── src/
│   │   ├── auth/                # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/             # Data Transfer Objects
│   │   │   ├── guards/          # Auth guards
│   │   │   └── strategies/      # Passport strategies
│   │   ├── modules/
│   │   │   ├── jobs/            # Job management
│   │   │   ├── bids/            # Bidding system
│   │   │   ├── payments/        # Payment processing
│   │   │   ├── messages/        # Real-time messaging
│   │   │   ├── reviews/         # Review system
│   │   │   └── admin/           # Admin operations
│   │   ├── common/
│   │   │   ├── decorators/      # Custom decorators
│   │   │   ├── guards/          # Role guards
│   │   │   ├── pipes/           # Validation pipes
│   │   │   ├── interceptors/    # Request/response interceptors
│   │   │   ├── filters/         # Exception filters
│   │   │   ├── logging/         # Winston logger
│   │   │   ├── monitoring/      # Health checks, metrics
│   │   │   └── caching/         # Redis cache service
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── schema.prisma    # Database schema
│   │   ├── health/              # Health check endpoints
│   │   ├── users/               # User management
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   │   ├── api-integration.e2e-spec.ts
│   │   ├── user-journeys.e2e-spec.ts
│   │   └── setup-e2e.ts
│   ├── prisma/
│   │   ├── migrations/          # Database migrations
│   │   ├── schema.prisma
│   │   └── seed.ts              # Database seeding
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/          # Auth route group
│   │   │   ├── dashboard/
│   │   │   ├── jobs/
│   │   │   └── artisan/
│   │   ├── components/
│   │   │   ├── ui/              # Base UI components
│   │   │   ├── providers/       # Context providers
│   │   │   ├── mobile/          # Mobile components
│   │   │   └── features/        # Feature components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/
│   │   │   ├── api.ts           # API client
│   │   │   ├── utils.ts         # Utility functions
│   │   │   └── validations.ts   # Form validations
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── types/               # TypeScript types
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── claudedocs/                  # Project documentation
│   ├── API-DOCUMENTATION.md
│   ├── FRONTEND-COMPONENTS.md
│   ├── DEVELOPER-GUIDE.md
│   └── test-quality-report.md
│
└── README.md
```

---

## Development Workflow

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/job-filtering

# 2. Make changes and commit
git add .
git commit -m "feat: Add job filtering by category and location"

# 3. Push to remote
git push origin feature/job-filtering

# 4. Create Pull Request on GitHub
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new job filtering options
fix: Resolve bid submission validation error
docs: Update API documentation for payments
style: Format code with Prettier
refactor: Simplify job matching algorithm
test: Add E2E tests for bidding flow
chore: Update dependencies
```

### Code Quality Checks

**Before Committing**:
```bash
# Backend
cd backend
npm run lint          # ESLint check
npm run format        # Prettier format
npm run type-check    # TypeScript check
npm run test          # Run tests

# Frontend
cd frontend
npm run lint          # Next.js lint
npm run format        # Prettier format
npm run type-check    # TypeScript check
```

### Creating New Features

#### 1. Backend Module

```bash
cd backend
nest generate module modules/notifications
nest generate service modules/notifications
nest generate controller modules/notifications
```

#### 2. Frontend Component

```bash
cd frontend/src/components/features
mkdir notifications
touch notifications/NotificationList.tsx
touch notifications/NotificationItem.tsx
touch notifications/index.ts
```

#### 3. Database Changes

```bash
# 1. Update schema.prisma
# 2. Create migration
cd backend
npx prisma migrate dev --name add_notifications_table

# 3. Generate Prisma Client
npm run db:generate
```

---

## Architecture Overview

### Backend Architecture (NestJS)

```
Request Flow:
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Guards (Auth, Roles)   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Controller             │ ← Handles HTTP requests
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Service (Business      │ ← Business logic
│  Logic)                 │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Repository (Prisma)    │ ← Data access
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Database (PostgreSQL)  │
└─────────────────────────┘
```

### Frontend Architecture (Next.js)

```
Component Hierarchy:
┌──────────────────────────┐
│  App Layout (Providers)  │
└──────┬───────────────────┘
       │
       ├── AuthProvider
       ├── ThemeProvider
       ├── QueryProvider
       └── ToastProvider
              │
              ▼
       ┌────────────────┐
       │  Page Component│
       └──────┬─────────┘
              │
              ├── Feature Components
              │   └── Use Custom Hooks
              │       └── API Client
              │
              └── UI Components
```

---

## Database Management

### Prisma Schema Overview

**Key Models**:
- `User`: User accounts (CLIENT, ARTISAN, ADMIN, ASSESSOR)
- `Profile`: User profile information
- `Job`: Job postings
- `Bid`: Bids on jobs
- `Payment`: Payment transactions
- `Message`: Chat messages
- `Review`: Reviews and ratings
- `Wallet`: Artisan wallets

### Common Operations

**Create Migration**:
```bash
npx prisma migrate dev --name your_migration_name
```

**Reset Database**:
```bash
npx prisma migrate reset
```

**View Database**:
```bash
npx prisma studio
```

**Generate Client**:
```bash
npx prisma generate
```

### Seeding Data

Edit `backend/prisma/seed.ts` to add test data:

```typescript
async function main() {
  // Create categories
  await prisma.category.createMany({
    data: [
      { name: 'Plumbing', description: 'Plumbing services' },
      { name: 'Electrical', description: 'Electrical services' },
    ],
  });

  // Create test users
  const client = await prisma.user.create({
    data: {
      email: 'client@test.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'CLIENT',
      profile: {
        create: {
          firstName: 'Test',
          lastName: 'Client',
        },
      },
    },
  });
}
```

Run seed:
```bash
npm run db:seed
```

---

## API Integration

### Using the API Client

**Frontend (src/lib/api.ts)**:

```typescript
import { api } from '@/lib/api';

// Get all jobs
const jobs = await api.getJobs({ status: 'OPEN', city: 'Cape Town' });

// Create job
const newJob = await api.createJob({
  title: 'Fix Kitchen Sink',
  description: 'Urgent repair needed',
  categoryId: 'cat_plumbing_001',
  budgetMin: 500,
  budgetMax: 1000,
  // ... other fields
});

// Submit bid
const bid = await api.createBid({
  jobId: 'job_12345',
  amount: 750,
  estimatedDays: 2,
  message: 'I can help with this',
});
```

### With React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Fetch jobs
export function useJobs(filters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.getJobs(filters),
  });
}

// Create job
export function useCreateJob() {
  return useMutation({
    mutationFn: (data) => api.createJob(data),
    onSuccess: () => {
      // Invalidate and refetch jobs
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
```

### Error Handling

```typescript
try {
  const job = await api.createJob(jobData);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation errors
    console.error('Validation errors:', error.response.data.errors);
  } else if (error.response?.status === 401) {
    // Unauthorized - token refresh handled automatically
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

---

## Authentication Flow

### Registration Flow

```
Client                    Frontend                Backend                 Database
  │                         │                        │                       │
  │  1. Fill form           │                        │                       │
  │ ───────────────────────>│                        │                       │
  │                         │                        │                       │
  │                         │  2. POST /auth/register│                       │
  │                         │ ──────────────────────>│                       │
  │                         │                        │                       │
  │                         │                        │  3. Hash password     │
  │                         │                        │  4. Create user       │
  │                         │                        │ ─────────────────────>│
  │                         │                        │                       │
  │                         │                        │  5. User created      │
  │                         │                        │<──────────────────────│
  │                         │                        │                       │
  │                         │  6. Send verify email  │                       │
  │                         │<───────────────────────│                       │
  │                         │                        │                       │
  │  7. Redirect to         │                        │                       │
  │     verify-email page   │                        │                       │
  │<────────────────────────│                        │                       │
```

### Login Flow

```
Client                    Frontend                Backend                 Database
  │                         │                        │                       │
  │  1. Enter credentials   │                        │                       │
  │ ───────────────────────>│                        │                       │
  │                         │                        │                       │
  │                         │  2. POST /auth/login   │                       │
  │                         │ ──────────────────────>│                       │
  │                         │                        │                       │
  │                         │                        │  3. Find user         │
  │                         │                        │ ─────────────────────>│
  │                         │                        │<──────────────────────│
  │                         │                        │                       │
  │                         │                        │  4. Verify password   │
  │                         │                        │  5. Generate tokens   │
  │                         │                        │                       │
  │                         │  6. Return tokens      │                       │
  │                         │<───────────────────────│                       │
  │                         │                        │                       │
  │  7. Store tokens        │                        │                       │
  │  8. Redirect to         │                        │                       │
  │     dashboard           │                        │                       │
  │<────────────────────────│                        │                       │
```

### Token Refresh Flow

```
Client                    Frontend                Backend
  │                         │                        │
  │  1. API call (401)      │                        │
  │ ───────────────────────>│                        │
  │                         │                        │
  │                         │  2. Intercept 401      │
  │                         │  3. POST /auth/        │
  │                         │     refresh-token      │
  │                         │ ──────────────────────>│
  │                         │                        │
  │                         │  4. Verify refresh     │
  │                         │     token              │
  │                         │  5. Generate new       │
  │                         │     access token       │
  │                         │                        │
  │                         │  6. Return new token   │
  │                         │<───────────────────────│
  │                         │                        │
  │  7. Retry original      │                        │
  │     request with        │                        │
  │     new token           │                        │
  │<────────────────────────│                        │
```

---

## Testing Strategy

### Unit Tests

**Backend (Jest)**:
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:cov           # With coverage
```

**Example Test**:
```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService, JwtService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should hash password on registration', async () => {
    const result = await service.register({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(result.userId).toBeDefined();
  });
});
```

### E2E Tests

```bash
cd backend
npm run test:e2e           # Run E2E tests
```

**Fix E2E Test Errors** (from test report):
```bash
# Fix TypeScript errors in setup-e2e.ts
# 1. Remove duplicate export at line 276
# 2. Fix type annotation: getAuthHeaders(): Record<string, string>
# 3. Fix Jest config: "moduleNameMapping" → "moduleNameMapper"
```

### Frontend Tests

```bash
cd frontend
npm test                   # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

**Example Test**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders and handles click', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## Deployment

### Production Build

**Backend**:
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend**:
```bash
cd frontend
npm run build
npm start
```

### Environment Variables

**Production .env** (backend):
- Change all secrets (JWT, database, payment keys)
- Set `NODE_ENV=production`
- Configure production database URL
- Use production payment credentials
- Set up email service (SendGrid, AWS SES)

### Docker Deployment

```dockerfile
# Dockerfile (backend)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/taska
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3000/api/v1

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: taska
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Run**:
```bash
docker-compose up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error**: `Can't reach database server at localhost:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify connection
psql -U postgres -c "SELECT 1"
```

#### 2. Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run start:dev
```

#### 3. Prisma Client Out of Sync

**Error**: `Prisma schema has changed, please run prisma generate`

**Solution**:
```bash
cd backend
npm run db:generate
```

#### 4. Frontend Build Errors

**Error**: `Module not found: Can't resolve '@/components/...'`

**Solution**:
- Check `tsconfig.json` paths configuration
- Verify file paths are correct
- Restart dev server

#### 5. Authentication Issues

**Error**: `401 Unauthorized`

**Solution**:
- Check if token is being sent in headers
- Verify token hasn't expired
- Check JWT secret in .env matches

### Debug Mode

**Backend**:
```bash
npm run start:debug
```

Connect debugger to port 9229 in VS Code.

**Frontend**:
```bash
npm run dev
```

Use browser DevTools and React Developer Tools.

---

## Best Practices

### Code Organization

1. **Keep Controllers Thin**: Business logic in services
2. **Use DTOs**: Validate and transform data
3. **Type Everything**: Strong TypeScript typing
4. **Error Handling**: Proper try-catch and error filters
5. **Logging**: Use Winston logger, not console.log

### Security

1. **Never Commit Secrets**: Use .env files
2. **Validate Input**: Use class-validator
3. **Sanitize Output**: Prevent XSS
4. **Rate Limiting**: Protect endpoints
5. **HTTPS Only**: In production

### Performance

1. **Database Indexing**: Index frequently queried fields
2. **Caching**: Use Redis for expensive queries
3. **Pagination**: Always paginate large datasets
4. **Lazy Loading**: Load data as needed
5. **Image Optimization**: Use Next.js Image component

---

## Additional Resources

- **API Documentation**: `/claudedocs/API-DOCUMENTATION.md`
- **Frontend Components**: `/claudedocs/FRONTEND-COMPONENTS.md`
- **Test Report**: `/claudedocs/test-quality-report.md`
- **NestJS Docs**: https://docs.nestjs.com
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

## Support & Contributing

**Questions**: dev@taska.co.za
**Issues**: GitHub Issues
**Contributing**: See CONTRIBUTING.md

---

**Last Updated**: 2025-01-09
**Maintained By**: Taska Development Team
