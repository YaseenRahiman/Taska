# Taska Platform - Master Documentation Index

**Version**: 1.0.0
**Last Updated**: 2025-10-19
**Status**: Production Ready

Welcome to the Taska Platform documentation. This comprehensive guide provides everything you need to understand, develop, deploy, and maintain the platform that connects skilled artisans with clients across South Africa.

---

## Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| [Architecture](#architecture) | System design and technical architecture | Developers, Architects |
| [Developer Guide](#developer-guide) | Development setup and workflows | Developers |
| [API Documentation](#api-documentation) | REST API reference and examples | Frontend Developers, Integrators |
| [Frontend Components](#frontend-components) | React component library and patterns | Frontend Developers |
| [Testing Guide](#testing-guide) | Testing strategies and execution | QA Engineers, Developers |
| [Deployment Guide](#deployment-guide) | Production deployment procedures | DevOps, System Administrators |

---

## Platform Overview

### What is Taska?

Taska is a comprehensive marketplace platform that bridges the gap between skilled artisans (plumbers, electricians, carpenters, etc.) and clients seeking quality services in South Africa. The platform provides:

- **For Clients**: Easy job posting, artisan discovery, secure payments, and quality assurance
- **For Artisans**: Job opportunities, bid management, earnings tracking, and reputation building
- **For Admins**: Platform oversight, user verification, dispute resolution, and analytics

### Technology Stack

#### Backend
- **Framework**: NestJS 10.x (Node.js/TypeScript)
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO for messaging and notifications
- **Payment Processing**: Stripe (international) + PayFast (South African)
- **Caching**: Redis (optional but recommended)
- **File Storage**: Local/S3-compatible storage

#### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: Zustand + React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Type Safety**: TypeScript 5.2

#### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (planned)
- **Monitoring**: Winston logging + Health checks
- **Security**: Helmet.js, rate limiting, CORS configuration

---

## Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Client App  │  │ Artisan App  │  │  Admin Panel │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         └─────────────────┼─────────────────┘              │
└─────────────────────────┬─┬─────────────────────────────────┘
                          │ │
                    HTTP  │ │  WebSocket
                          │ │
┌─────────────────────────▼─▼─────────────────────────────────┐
│                   API GATEWAY (NestJS)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth Module │  │  Job Module  │  │  Bid Module  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│  ┌──────┴───────────────────┴─────────────────┴───────┐    │
│  │              Business Logic Layer                   │    │
│  └──────┬───────────────────┬─────────────────┬───────┘    │
└─────────┼───────────────────┼─────────────────┼────────────┘
          │                   │                 │
┌─────────▼─────────┐ ┌───────▼──────┐ ┌───────▼──────────┐
│   PostgreSQL      │ │    Redis     │ │  Payment APIs    │
│   (Primary DB)    │ │   (Cache)    │ │  Stripe/PayFast  │
└───────────────────┘ └──────────────┘ └──────────────────┘
```

**[Read Full Architecture Documentation →](./ARCHITECTURE.md)**

### Key Architectural Decisions

1. **Monorepo Structure**: Backend and frontend in single repository for easier coordination
2. **Role-Based Access Control (RBAC)**: Four distinct user roles with granular permissions
3. **Escrow Payment System**: Secure fund holding until job completion
4. **Real-time Communication**: WebSocket-based messaging and notifications
5. **Location-Based Matching**: PostGIS-style proximity search for job discovery
6. **Modular Backend**: NestJS modules for scalability and maintainability

---

## Developer Guide

### Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v9.x or higher
- **PostgreSQL**: v14.x or higher
- **Redis**: v7.x (optional but recommended)
- **Git**: Latest version

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/taska-platform.git
cd taska-platform

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:migrate
npm run db:seed
npm run start:dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your configuration
npm run dev
```

**Access Points**:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1
- API Documentation: http://localhost:3000/api/docs

**[Read Full Developer Guide →](./DEVELOPER-GUIDE.md)**

---

## API Documentation

### Authentication Endpoints

All authenticated requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Core API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Authentication | `/auth` | User registration, login, password management |
| Jobs | `/jobs` | Job posting, search, management |
| Bids | `/bids` | Artisan bidding system |
| Payments | `/payments` | Payment processing and escrow |
| Messages | `/messages` | Real-time messaging |
| Reviews | `/reviews` | Rating and review system |
| Admin | `/admin` | Platform administration |
| Health | `/health` | System health checks |

### Example API Call

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

// Create a job
const job = await api.post('/jobs', {
  title: 'Fix Kitchen Sink',
  description: 'Urgent plumbing repair needed',
  categoryId: 'cat_plumbing_001',
  budgetMin: 500,
  budgetMax: 1000,
  budgetType: 'FIXED',
  urgencyLevel: 'HIGH',
  city: 'Cape Town',
  province: 'Western Cape'
});
```

**[Read Full API Documentation →](./API-DOCUMENTATION.md)**

---

## Frontend Components

### Component Library

The frontend uses a custom component library built on:
- **Radix UI**: Accessible, unstyled component primitives
- **Tailwind CSS**: Utility-first styling
- **Class Variance Authority (CVA)**: Type-safe variant management

### Core Components

| Component | Purpose | Location |
|-----------|---------|----------|
| Button | Versatile button with variants | `components/ui/button.tsx` |
| Card | Content container | `components/ui/card.tsx` |
| Badge | Status indicators | `components/ui/badge.tsx` |
| Tabs | Tabbed interfaces | `components/ui/tabs.tsx` |
| Dialog | Modal dialogs | `components/ui/dialog.tsx` |
| Select | Dropdown selections | `components/ui/select.tsx` |

### Provider Components

| Provider | Purpose | Location |
|----------|---------|----------|
| AuthProvider | Authentication state | `components/providers/auth-provider.tsx` |
| ThemeProvider | Dark/light mode | `components/providers/theme-provider.tsx` |
| QueryProvider | React Query setup | `components/providers/query-provider.tsx` |
| ToastProvider | Notifications | `components/providers/toast-provider.tsx` |

### Usage Example

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';

export function DashboardCard() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome, {user?.profile?.firstName}!</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Create New Job</Button>
      </CardContent>
    </Card>
  );
}
```

**[Read Full Frontend Components Guide →](./FRONTEND-COMPONENTS.md)**

---

## Testing Guide

### Testing Strategy

The platform employs a comprehensive testing strategy:

1. **Unit Tests**: Component and function-level testing
2. **Integration Tests**: API endpoint testing
3. **End-to-End Tests**: User journey testing with Playwright
4. **Manual Testing**: UAT checklists for critical flows

### Test Coverage Targets

| Area | Target Coverage | Current Status |
|------|----------------|----------------|
| Backend Services | ≥80% | In Progress |
| Backend Controllers | ≥70% | In Progress |
| Frontend Components | ≥60% | Planned |
| E2E Critical Flows | 100% | In Progress |

### Running Tests

```bash
# Backend unit tests
cd backend
npm test
npm run test:watch
npm run test:cov

# Backend E2E tests
npm run test:e2e

# Frontend tests
cd frontend
npm test
npm run test:coverage

# E2E tests (Playwright)
cd ../
npm run test:e2e
npm run test:e2e:ui  # Interactive mode
```

**[Read Full Testing Guide →](./TESTING-GUIDE.md)**

---

## Deployment Guide

### Environment Configuration

The platform requires different configurations for each environment:

| Environment | Purpose | Configuration |
|-------------|---------|---------------|
| Development | Local development | `.env` + `.env.local` |
| Staging | Pre-production testing | Environment variables |
| Production | Live platform | Secure environment variables |

### Deployment Options

1. **Docker Compose**: Simplest deployment for small-scale
2. **Kubernetes**: Scalable cloud deployment
3. **Serverless**: Next.js on Vercel + Backend on Railway/Render

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Payment provider credentials verified
- [ ] Email service configured
- [ ] Monitoring and logging enabled
- [ ] Backups configured
- [ ] Load testing completed

**[Read Full Deployment Guide →](./DEPLOYMENT.md)**

---

## Database Schema

### Core Models

```
User ──┬─── Profile (1:1)
       ├─── Jobs (1:n) - as client
       ├─── Bids (1:n) - as artisan
       ├─── Messages (1:n) - sent/received
       ├─── Reviews (1:n) - given/received
       ├─── Wallet (1:1) - artisan only
       └─── Notifications (1:n)

Job ────┬─── Bids (1:n)
        ├─── Messages (1:n)
        ├─── Payments (1:n)
        └─── Reviews (1:1)

Payment ─── Escrow Status (HELD → RELEASED/REFUNDED)
```

### User Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| CLIENT | Create jobs, accept bids, make payments | Job posters |
| ARTISAN | Submit bids, message clients, receive payments | Service providers |
| ADMIN | Full platform access, user management | Platform administrators |
| ASSESSOR | Verify artisans, review disputes | Quality assurance |

**Schema File**: `backend/prisma/schema.prisma`

---

## Authentication & Authorization

### Authentication Flow

```
1. User Registration
   ├─ Email + Password validation
   ├─ Password hashing (bcrypt)
   ├─ User creation in database
   └─ Verification email sent

2. Email Verification
   ├─ Token validation
   ├─ Account activation
   └─ Auto-login (new feature)

3. Login
   ├─ Credentials validation
   ├─ JWT token generation
   │  ├─ Access Token (24h)
   │  └─ Refresh Token (7d)
   └─ Role-based redirect

4. Protected Routes
   ├─ JWT validation middleware
   ├─ Role-based guards
   └─ Permission checks
```

### Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token rotation
- Rate limiting on auth endpoints
- CORS protection
- Helmet.js security headers
- Input validation with class-validator
- SQL injection prevention (Prisma ORM)
- XSS protection

---

## Real-Time Features

### WebSocket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `message:sent` | Server → Client | New message received |
| `notification:new` | Server → Client | New notification |
| `bid:received` | Server → Client | New bid on job |
| `job:updated` | Server → Client | Job status changed |
| `payment:completed` | Server → Client | Payment processed |

### WebSocket Connection

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: accessToken
  }
});

// Listen for messages
socket.on('message:sent', (data) => {
  console.log('New message:', data);
});

// Send message
socket.emit('message:send', {
  receiverId: 'user_123',
  content: 'Hello!'
});
```

---

## Payment Processing

### Supported Payment Methods

1. **Stripe**: International payments (credit/debit cards)
2. **PayFast**: South African payments (EFT, credit cards, mobile money)

### Escrow System

```
Payment Flow:
1. Client accepts bid → Payment initiated
2. Funds held in escrow (HELD status)
3. Job completed → Client approval
4. Funds released to artisan (RELEASED status)
5. Platform fee deducted automatically
```

### Payment States

| State | Description |
|-------|-------------|
| PENDING | Payment initiated but not completed |
| PROCESSING | Payment provider processing |
| COMPLETED | Payment successful |
| FAILED | Payment failed |
| REFUNDED | Payment refunded to client |

### Escrow States

| State | Description |
|-------|-------------|
| HELD | Funds held pending job completion |
| RELEASED | Funds released to artisan |
| DISPUTED | Dispute raised, funds frozen |
| REFUNDED | Funds returned to client |

---

## Recent Updates & Fixes

### October 2025 Updates

**Registration & Authentication**:
- ✅ Fixed registration flow auto-login
- ✅ Resolved TypeScript compilation errors
- ✅ Improved error handling and validation
- ✅ Added phone number validation for South African numbers

**Backend Infrastructure**:
- ✅ Configured JWT strategy and guards
- ✅ Enhanced health check endpoints
- ✅ Fixed Prisma schema relationships
- ✅ Added comprehensive logging

**Frontend Improvements**:
- ✅ Implemented client dashboard
- ✅ Added job creation flow
- ✅ Enhanced authentication provider
- ✅ Improved error boundary handling

**Testing**:
- ✅ Playwright E2E test setup
- ✅ Backend integration tests
- ✅ UAT test suite and data generation
- ⏳ Improving test coverage (ongoing)

---

## Development Workflow

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/job-filtering

# 2. Make changes and commit
git add .
git commit -m "feat: Add job filtering by location"

# 3. Push to remote
git push origin feature/job-filtering

# 4. Create Pull Request on GitHub
```

### Commit Message Convention

Following [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code formatting
refactor: Code restructuring
test: Test additions/modifications
chore: Build process or tooling changes
```

### Code Quality Gates

Before committing:
```bash
# Backend
npm run lint
npm run format
npm run type-check
npm test

# Frontend
npm run lint
npm run format
npm run type-check
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify connection string in .env
DATABASE_URL="postgresql://user:password@localhost:5432/taska_dev"
```

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run start:dev
```

#### Prisma Client Out of Sync
```bash
# Regenerate Prisma Client
npm run db:generate

# Create new migration
npm run db:migrate dev --name describe_changes
```

#### Frontend Module Not Found
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

---

## Project Structure

```
taska-platform/
├── backend/
│   ├── src/
│   │   ├── auth/                # Authentication module
│   │   ├── modules/
│   │   │   ├── jobs/            # Job management
│   │   │   ├── bids/            # Bidding system
│   │   │   ├── payments/        # Payment processing
│   │   │   ├── messages/        # Messaging system
│   │   │   ├── reviews/         # Review system
│   │   │   ├── admin/           # Admin operations
│   │   │   └── categories/      # Category management
│   │   ├── common/              # Shared utilities
│   │   ├── config/              # Configuration
│   │   ├── database/            # Database service
│   │   └── main.ts              # Application entry
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # Database migrations
│   │   └── seed.ts              # Seed data
│   └── test/                    # E2E tests
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   │   ├── (auth)/          # Auth pages
│   │   │   ├── client/          # Client pages
│   │   │   ├── artisan/         # Artisan pages
│   │   │   └── admin/           # Admin pages
│   │   ├── components/
│   │   │   ├── ui/              # Base UI components
│   │   │   ├── providers/       # Context providers
│   │   │   ├── auth/            # Auth components
│   │   │   └── client/          # Client components
│   │   ├── lib/
│   │   │   ├── api.ts           # API client
│   │   │   └── utils.ts         # Utilities
│   │   └── hooks/               # Custom hooks
│   └── public/                  # Static assets
│
├── claudedocs/                  # Documentation
│   ├── README.md                # This file
│   ├── ARCHITECTURE.md          # Architecture docs
│   ├── DEVELOPER-GUIDE.md       # Development guide
│   ├── API-DOCUMENTATION.md     # API reference
│   ├── FRONTEND-COMPONENTS.md   # Component guide
│   ├── TESTING-GUIDE.md         # Testing guide
│   └── DEPLOYMENT.md            # Deployment guide
│
├── tests/                       # E2E Playwright tests
├── docker-compose.yml           # Docker configuration
└── README.md                    # Project README
```

---

## Contributing

### Development Standards

1. **Code Style**: Follow ESLint and Prettier configurations
2. **TypeScript**: Strong typing, no `any` types
3. **Testing**: Write tests for new features
4. **Documentation**: Update docs for significant changes
5. **Commits**: Follow conventional commit format
6. **PRs**: Include description, testing steps, and screenshots

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Update relevant documentation
4. Run all quality checks
5. Submit PR with clear description
6. Address review feedback
7. Squash merge to `main`

---

## Support & Resources

### Internal Documentation
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Developer Guide**: [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md)
- **API Docs**: [API-DOCUMENTATION.md](./API-DOCUMENTATION.md)
- **Frontend Guide**: [FRONTEND-COMPONENTS.md](./FRONTEND-COMPONENTS.md)
- **Testing**: [TESTING-GUIDE.md](./TESTING-GUIDE.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)

### External Resources
- **NestJS**: https://docs.nestjs.com
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com/docs

### Contact
- **Developer Support**: dev@taska.co.za
- **Bug Reports**: GitHub Issues
- **Feature Requests**: GitHub Discussions

---

## License

MIT License - See LICENSE file for details

---

**Maintained by**: Taska Development Team
**Last Updated**: 2025-10-19
**Version**: 1.0.0
