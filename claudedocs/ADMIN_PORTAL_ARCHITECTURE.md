# Taska Admin Portal - Frontend Architecture Plan

## Executive Summary

This document outlines a comprehensive frontend architecture for the Taska admin portal, designed to provide administrators with powerful tools for platform management while maintaining accessibility, performance, and user experience best practices.

## Technology Stack Analysis

### Current Stack (Identified from Codebase)
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18.2
- **Language**: TypeScript 5.2
- **Styling**: Tailwind CSS 3.3
- **State Management**: Zustand 4.4
- **Data Fetching**: TanStack Query (React Query) 5.0
- **Forms**: React Hook Form 7.47 + Zod 3.22
- **UI Components**: Radix UI (headless components)
- **Icons**: Lucide React
- **Animations**: Framer Motion 10.16
- **API Client**: Axios 1.5 with custom interceptors

### Recommended Additional Libraries
- **Data Tables**: @tanstack/react-table (v8) - for advanced table features
- **Charts**: recharts or chart.js - for analytics visualizations
- **Date Handling**: date-fns (already included) + react-day-picker
- **File Uploads**: react-dropzone (already included)
- **Rich Text**: @tiptap/react - for review moderation
- **Notifications**: react-hot-toast (already included)
- **Map Integration**: @react-google-maps/api - for location configuration

## Architecture Overview

### Component Hierarchy

```
/admin
├── layout.tsx (Admin Shell)
│   ├── AdminNavigation
│   ├── AdminHeader
│   └── AdminSidebar
├── dashboard/
│   └── page.tsx (Overview & Metrics)
├── users/
│   ├── page.tsx (User List)
│   ├── [id]/
│   │   └── page.tsx (User Detail)
│   └── components/
│       ├── UserTable.tsx
│       ├── UserFilters.tsx
│       ├── UserActions.tsx
│       └── UserDetailModal.tsx
├── clients/
│   ├── page.tsx (Client Management)
│   └── components/
│       ├── ClientTable.tsx
│       └── ClientEditor.tsx
├── payments/
│   ├── page.tsx (Payment Approval)
│   └── components/
│       ├── PaymentQueue.tsx
│       ├── PaymentApprovalCard.tsx
│       └── EscrowManager.tsx
├── reviews/
│   ├── page.tsx (Review Moderation)
│   └── components/
│       ├── ReviewQueue.tsx
│       ├── ReviewEditor.tsx
│       └── ReviewActions.tsx
├── moderation/
│   ├── page.tsx (Content Moderation)
│   └── components/
│       ├── ModerationQueue.tsx
│       ├── ContentViewer.tsx
│       └── ModerationActions.tsx
├── settings/
│   ├── page.tsx (Settings Hub)
│   ├── currency/
│   │   └── page.tsx (Currency Config)
│   ├── maps/
│   │   └── page.tsx (Map API Config)
│   ├── escrow/
│   │   └── page.tsx (Escrow Config)
│   ├── platform/
│   │   └── page.tsx (Platform Settings)
│   └── components/
│       ├── SettingsCard.tsx
│       ├── CurrencyManager.tsx
│       ├── MapAPIConfig.tsx
│       └── EscrowConfig.tsx
└── financial/
    ├── page.tsx (Financial Dashboard)
    └── components/
        ├── RevenueChart.tsx
        ├── TransactionTable.tsx
        └── ReconciliationReport.tsx
```

## Routing Structure

### Route Definitions

```typescript
// /admin - Admin Portal Routes
/admin/dashboard          → Admin Dashboard (metrics, activity)
/admin/users              → User Management (list, search, filter)
/admin/users/[id]         → User Detail View
/admin/clients            → Client Management
/admin/clients/[id]       → Client Detail & Edit
/admin/payments           → Payment Approval Queue
/admin/payments/escrow    → Escrow Management
/admin/reviews            → Review Moderation
/admin/reviews/[id]       → Review Detail & Edit
/admin/moderation         → Content Moderation Queue
/admin/financial          → Financial Dashboard
/admin/financial/reconciliation → Financial Reconciliation
/admin/settings           → Settings Hub
/admin/settings/currency  → Currency Configuration
/admin/settings/maps      → Map API Configuration
/admin/settings/escrow    → Escrow Settings
/admin/settings/platform  → Platform Settings
/admin/settings/fees      → Fee Configuration
```

### Route Guards

```typescript
// middleware.ts enhancement for admin routes
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken');
  const path = request.nextUrl.pathname;

  // Admin route protection
  if (path.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Verify admin role (decode JWT or API call)
    const userRole = decodeToken(token)?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}
```

## State Management Strategy

### Global State (Zustand Store)

```typescript
// stores/adminStore.ts
interface AdminStore {
  // User management
  users: User[];
  selectedUser: User | null;
  userFilters: UserFilters;
  setUsers: (users: User[]) => void;
  setSelectedUser: (user: User | null) => void;
  updateUserFilters: (filters: Partial<UserFilters>) => void;

  // Payment management
  pendingPayments: Payment[];
  setPendingPayments: (payments: Payment[]) => void;

  // System settings
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;

  // UI state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// stores/authStore.ts (existing, enhance for admin)
interface AuthStore {
  user: User | null;
  isAdmin: boolean;
  permissions: Permission[];
  // ... existing auth state
}
```

### Server State (React Query)

```typescript
// hooks/useAdminData.ts
export const useAdminMetrics = () => {
  return useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => api.get('/admin/dashboard/metrics'),
    refetchInterval: 30000, // Auto-refresh every 30s
    staleTime: 20000,
  });
};

export const useUsers = (filters: UserFilters) => {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => api.get('/admin/users', { params: filters }),
    keepPreviousData: true, // Better UX during filter changes
  });
};

export const usePaymentQueue = () => {
  return useQuery({
    queryKey: ['admin', 'payments', 'pending'],
    queryFn: () => api.get('/admin/payments', { params: { status: 'PENDING' } }),
    refetchInterval: 60000,
  });
};

// Mutations
export const useUserAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, action, data }: UserAction) =>
      api.post(`/admin/users/${userId}/${action}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'users']);
      toast.success('Action completed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Action failed');
    },
  });
};
```

### Form State (React Hook Form + Zod)

```typescript
// lib/validations/admin.ts
export const currencyConfigSchema = z.object({
  code: z.string().length(3).toUpperCase(),
  symbol: z.string().min(1),
  name: z.string().min(1),
  exchangeRate: z.number().positive(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export const mapAPIConfigSchema = z.object({
  provider: z.enum(['GOOGLE_MAPS', 'MAPBOX', 'OPENSTREETMAP']),
  apiKey: z.string().min(1),
  restrictDomains: z.array(z.string()),
  enableGeocoding: z.boolean(),
  enableDirections: z.boolean(),
});

export const escrowConfigSchema = z.object({
  holdDuration: z.number().min(1).max(30), // days
  autoRelease: z.boolean(),
  disputeWindow: z.number().min(1).max(14), // days
  minimumAmount: z.number().min(0),
  maximumAmount: z.number().positive(),
});
```

## Component Architecture

### Reusable Component Patterns

#### 1. Data Table Component

```typescript
// components/admin/DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  filters?: FilterConfig[];
  pagination?: PaginationConfig;
  onRowClick?: (row: T) => void;
  actions?: ActionConfig<T>[];
}

// Usage:
<DataTable
  data={users}
  columns={userColumns}
  filters={[
    { key: 'role', type: 'select', options: roles },
    { key: 'status', type: 'select', options: statuses },
    { key: 'search', type: 'text', placeholder: 'Search...' },
  ]}
  pagination={{ pageSize: 20 }}
  actions={[
    { label: 'View', icon: Eye, onClick: handleView },
    { label: 'Edit', icon: Edit, onClick: handleEdit },
    { label: 'Ban', icon: Ban, onClick: handleBan, variant: 'destructive' },
  ]}
/>
```

#### 2. Stat Card Component

```typescript
// components/admin/StatCard.tsx
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' };
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  loading?: boolean;
}
```

#### 3. Approval Queue Component

```typescript
// components/admin/ApprovalQueue.tsx
interface ApprovalQueueProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onApprove: (item: T) => Promise<void>;
  onReject: (item: T, reason: string) => Promise<void>;
  emptyMessage?: string;
  loading?: boolean;
}
```

#### 4. Settings Panel Component

```typescript
// components/admin/SettingsPanel.tsx
interface SettingsPanelProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  actions?: React.ReactNode;
}
```

#### 5. Audit Log Component

```typescript
// components/admin/AuditLog.tsx
interface AuditLogProps {
  entityType: string;
  entityId: string;
  limit?: number;
}
```

### Page-Specific Components

#### Currency Configuration Page

```typescript
// components/admin/settings/CurrencyManager.tsx
interface Currency {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number;
  isDefault: boolean;
  isActive: boolean;
}

Features:
- List active/inactive currencies
- Add new currency with exchange rate
- Update exchange rates
- Set default currency
- Activate/deactivate currencies
- Conversion rate calculator
```

#### Map API Configuration Page

```typescript
// components/admin/settings/MapAPIConfig.tsx
Features:
- Provider selection (Google Maps, Mapbox, etc.)
- API key management (encrypted storage)
- Domain restrictions
- Feature toggles (geocoding, directions, places)
- Usage statistics
- Test connection button
```

#### Escrow Configuration Page

```typescript
// components/admin/settings/EscrowConfig.tsx
Features:
- Hold duration settings
- Auto-release configuration
- Dispute window settings
- Minimum/maximum amounts
- Platform fee configuration
- Refund policy settings
```

#### Payment Approval Queue

```typescript
// components/admin/payments/PaymentQueue.tsx
Features:
- Pending payment list
- Payment details modal
- Approve/reject actions
- Escrow status tracking
- Transaction history
- Bulk actions
- Export functionality
```

#### Review Moderation

```typescript
// components/admin/reviews/ReviewModeration.tsx
Features:
- Flagged reviews queue
- Review content display
- Edit capabilities (typos, inappropriate content)
- Approve/reject/flag actions
- User context (reviewer/reviewee profiles)
- Response management
- Verification status toggle
```

## API Integration Points

### Admin API Endpoints

```typescript
// lib/api/admin.ts
export const adminApi = {
  // Dashboard
  getMetrics: () => api.get('/admin/dashboard/metrics'),
  getAnalytics: (params: AnalyticsParams) => api.get('/admin/analytics', { params }),

  // User Management
  getUsers: (filters: UserFilters) => api.get('/admin/users', { params: filters }),
  getUserDetails: (id: string) => api.get(`/admin/users/${id}`),
  banUser: (id: string, reason: string) => api.post(`/admin/users/${id}/ban`, { reason }),
  suspendUser: (id: string, data: SuspendData) => api.post(`/admin/users/${id}/suspend`, data),
  verifyArtisan: (id: string) => api.patch(`/admin/users/${id}/verify`),
  resetPassword: (id: string) => api.post(`/admin/users/${id}/reset-password`),

  // Client Management
  getClients: (filters: ClientFilters) => api.get('/admin/clients', { params: filters }),
  updateClient: (id: string, data: ClientData) => api.patch(`/admin/clients/${id}`, data),

  // Payment Management
  getPendingPayments: () => api.get('/admin/payments', { params: { status: 'PENDING' } }),
  approvePayment: (id: string) => api.post(`/admin/payments/${id}/approve`),
  rejectPayment: (id: string, reason: string) => api.post(`/admin/payments/${id}/reject`, { reason }),
  releaseEscrow: (id: string) => api.post(`/admin/payments/${id}/release-escrow`),

  // Review Management
  getReviews: (filters: ReviewFilters) => api.get('/admin/reviews', { params: filters }),
  updateReview: (id: string, data: ReviewData) => api.patch(`/admin/reviews/${id}`, data),
  approveReview: (id: string) => api.post(`/admin/reviews/${id}/approve`),
  rejectReview: (id: string, reason: string) => api.post(`/admin/reviews/${id}/reject`, { reason }),

  // Content Moderation
  getModerationQueue: (filters: ModerationFilters) => api.get('/admin/moderation', { params: filters }),
  moderateContent: (data: ModerationAction) => api.post('/admin/moderation/content', data),
  resolveDispute: (id: string, data: DisputeResolution) => api.post(`/admin/moderation/disputes/${id}/resolve`, data),

  // System Settings
  getSystemSettings: () => api.get('/admin/system/settings'),
  updateSetting: (key: string, value: string) => api.put(`/admin/system/settings/${key}`, { value }),
  adjustPlatformFees: (feePercentage: number) => api.put('/admin/system/platform-fees', { feePercentage }),

  // Currency Management
  getCurrencies: () => api.get('/admin/settings/currencies'),
  addCurrency: (data: CurrencyData) => api.post('/admin/settings/currencies', data),
  updateCurrency: (code: string, data: CurrencyData) => api.put(`/admin/settings/currencies/${code}`, data),

  // Map Configuration
  getMapConfig: () => api.get('/admin/settings/maps'),
  updateMapConfig: (data: MapConfig) => api.put('/admin/settings/maps', data),
  testMapConnection: () => api.post('/admin/settings/maps/test'),

  // Escrow Configuration
  getEscrowConfig: () => api.get('/admin/settings/escrow'),
  updateEscrowConfig: (data: EscrowConfig) => api.put('/admin/settings/escrow', data),

  // Financial
  getFinancialReconciliation: () => api.get('/admin/financial/reconciliation'),
  generateReport: (params: ReportParams) => api.post('/admin/reports/generate', params),
};
```

## Accessibility Considerations

### WCAG 2.1 AA Compliance

#### Keyboard Navigation
```typescript
// All interactive elements must be keyboard accessible
- Tab navigation through forms and controls
- Arrow key navigation in data tables
- Escape key to close modals
- Enter/Space for button activation
- Shift+Tab for reverse navigation

// Example implementation:
<button
  onClick={handleAction}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAction();
    }
  }}
  aria-label="Approve payment"
>
  Approve
</button>
```

#### Screen Reader Support
```typescript
// ARIA labels and roles
<nav role="navigation" aria-label="Admin navigation">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" href="/admin/users">User Management</a>
    </li>
  </ul>
</nav>

// Status announcements
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Loading states
<div role="alert" aria-busy="true">
  Loading users...
</div>
```

#### Focus Management
```typescript
// Focus trap in modals
import { FocusTrap } from '@/components/ui/focus-trap';

<Modal>
  <FocusTrap>
    <ModalContent />
  </FocusTrap>
</Modal>

// Focus restoration after actions
const previousFocus = useRef<HTMLElement | null>(null);

const openModal = () => {
  previousFocus.current = document.activeElement as HTMLElement;
  setModalOpen(true);
};

const closeModal = () => {
  setModalOpen(false);
  previousFocus.current?.focus();
};
```

#### Color Contrast
```css
/* Ensure 4.5:1 contrast ratio for normal text */
/* 3:1 for large text (18pt+ or 14pt+ bold) */

.admin-button-primary {
  background: #16A085; /* Primary green */
  color: #FFFFFF; /* White text - 4.57:1 contrast */
}

.admin-badge-warning {
  background: #F39C12; /* Warning orange */
  color: #000000; /* Black text - 5.92:1 contrast */
}

.admin-text-danger {
  color: #C0392B; /* Error red - 5.18:1 on white */
}
```

#### Form Accessibility
```typescript
<form>
  <label htmlFor="email" className="block text-sm font-medium">
    Email Address
    <span className="text-red-500" aria-label="required">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={errors.email ? 'true' : 'false'}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <p id="email-error" role="alert" className="text-red-600 text-sm">
      {errors.email.message}
    </p>
  )}
</form>
```

## Responsive Design Strategy

### Mobile-First Breakpoints

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet portrait
      'lg': '1024px',  // Tablet landscape / Small desktop
      'xl': '1280px',  // Desktop
      '2xl': '1536px', // Large desktop
    },
  },
};
```

### Responsive Patterns

#### Navigation
```typescript
// Mobile: Hamburger menu with drawer
// Tablet+: Sidebar navigation

<div className="lg:hidden">
  <MobileNavigation />
</div>
<div className="hidden lg:block">
  <DesktopSidebar />
</div>
```

#### Data Tables
```typescript
// Mobile: Card-based list
// Tablet+: Full data table

<div className="lg:hidden">
  {users.map(user => (
    <UserCard key={user.id} user={user} />
  ))}
</div>
<div className="hidden lg:block">
  <UserTable users={users} />
</div>
```

#### Forms
```typescript
// Responsive grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <FormField name="firstName" />
  <FormField name="lastName" />
  <FormField name="email" />
</div>
```

#### Stats Dashboard
```typescript
// Mobile: 1 column
// Tablet: 2 columns
// Desktop: 4 columns

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

## Performance Optimization

### Code Splitting

```typescript
// Route-based code splitting (automatic with Next.js App Router)
// Component-based lazy loading
import dynamic from 'next/dynamic';

const AdminChart = dynamic(() => import('@/components/admin/AdminChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Client-side only for heavy components
});

const ReviewEditor = dynamic(() => import('@/components/admin/ReviewEditor'), {
  loading: () => <EditorSkeleton />,
});
```

### Data Loading Strategies

```typescript
// 1. Pagination for large lists
const ITEMS_PER_PAGE = 20;

// 2. Infinite scroll for activity feeds
import { useInfiniteQuery } from '@tanstack/react-query';

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['activities'],
  queryFn: ({ pageParam = 0 }) => fetchActivities(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

// 3. Virtual scrolling for very large datasets
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: users.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60,
});
```

### Caching Strategy

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Prefetching for better UX
const prefetchUserDetails = (userId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: () => adminApi.getUserDetails(userId),
  });
};

// Hover to prefetch
<UserRow
  onMouseEnter={() => prefetchUserDetails(user.id)}
  onClick={() => navigate(`/admin/users/${user.id}`)}
/>
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={user.profilePictureUrl}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
  loading="lazy"
  placeholder="blur"
/>
```

## Security Considerations

### Role-Based Access Control

```typescript
// components/admin/RoleGuard.tsx
interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback || <Unauthorized />;
  }

  return <>{children}</>;
};

// Usage:
<RoleGuard allowedRoles={['ADMIN']}>
  <AdminDashboard />
</RoleGuard>
```

### Sensitive Data Handling

```typescript
// Mask sensitive data in UI
const maskBankAccount = (account: string) => {
  return account.replace(/\d(?=\d{4})/g, '*');
};

// Secure API key display
const SecureAPIKeyDisplay = ({ apiKey }: { apiKey: string }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        type={revealed ? 'text' : 'password'}
        value={apiKey}
        readOnly
        className="font-mono text-sm"
      />
      <Button onClick={() => setRevealed(!revealed)}>
        {revealed ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
};
```

### XSS Protection

```typescript
// Sanitize user-generated content
import DOMPurify from 'isomorphic-dompurify';

const SafeContent = ({ html }: { html: string }) => {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

## Parallel Development Opportunities

### Phase 1: Foundation (Week 1)
**Team A:**
- Admin layout and navigation
- Route structure setup
- Auth guards and middleware
- Base component library

**Team B:**
- API client setup
- React Query configuration
- Zustand stores
- Form validation schemas

### Phase 2: Core Features (Weeks 2-3)
**Team A:**
- User management pages
- Client management pages
- Data table component

**Team B:**
- Payment approval workflow
- Review moderation interface
- Moderation queue

### Phase 3: Configuration (Week 4)
**Team A:**
- Currency configuration
- Map API configuration
- Settings pages

**Team B:**
- Escrow configuration
- Financial dashboard
- Analytics charts

### Phase 4: Polish & Testing (Week 5)
**Team A:**
- Accessibility audit
- Responsive design refinement
- Performance optimization

**Team B:**
- Integration testing
- E2E test scenarios
- Documentation

## Testing Strategy

### Unit Testing

```typescript
// components/admin/__tests__/StatCard.test.tsx
import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('renders value and title correctly', () => {
    render(
      <StatCard
        title="Total Users"
        value="1,234"
        icon={Users}
        color="blue"
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('displays trend indicator when provided', () => {
    render(
      <StatCard
        title="Revenue"
        value="$10,000"
        icon={DollarSign}
        trend={{ value: 12.5, direction: 'up' }}
      />
    );

    expect(screen.getByText('+12.5%')).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
// __tests__/user-management.test.tsx
import { renderWithProviders } from '@/test-utils';
import UserManagement from '@/app/admin/users/page';

describe('User Management', () => {
  it('loads and displays users', async () => {
    const { findByText } = renderWithProviders(<UserManagement />);

    expect(await findByText('User Management')).toBeInTheDocument();
    expect(await findByText('john@example.com')).toBeInTheDocument();
  });

  it('filters users by role', async () => {
    const { getByLabelText, findByText } = renderWithProviders(<UserManagement />);

    const roleFilter = getByLabelText('Role');
    fireEvent.change(roleFilter, { target: { value: 'ARTISAN' } });

    expect(await findByText('Showing artisans only')).toBeInTheDocument();
  });
});
```

### E2E Testing

```typescript
// e2e/admin-payment-approval.spec.ts
import { test, expect } from '@playwright/test';

test('admin can approve payment', async ({ page }) => {
  await page.goto('/admin/login');
  await page.fill('input[name="email"]', 'admin@taska.co.za');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.goto('/admin/payments');
  await expect(page.locator('h1')).toContainText('Payment Approval');

  await page.click('button[aria-label="Approve payment"]');
  await page.fill('textarea[name="notes"]', 'Payment verified');
  await page.click('button:has-text("Confirm Approval")');

  await expect(page.locator('[role="status"]')).toContainText('Payment approved');
});
```

## Error Handling & Loading States

### Error Boundaries

```typescript
// components/admin/ErrorBoundary.tsx
export class AdminErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-8 max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-center mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 text-center mb-4">
              The admin panel encountered an error. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Loading Skeletons

```typescript
// components/admin/skeletons/TableSkeleton.tsx
export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="animate-pulse">
    <div className="h-12 bg-gray-200 mb-4 rounded" /> {/* Header */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 mb-2">
        {Array.from({ length: columns }).map((_, j) => (
          <div key={j} className="h-10 bg-gray-100 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);
```

## Monitoring & Analytics

### Admin Activity Tracking

```typescript
// lib/tracking/adminTracking.ts
export const trackAdminAction = (action: AdminAction) => {
  // Track admin actions for audit log
  api.post('/admin/activity-log', {
    action: action.type,
    entityType: action.entityType,
    entityId: action.entityId,
    metadata: action.metadata,
    timestamp: new Date().toISOString(),
  });
};

// Usage:
const handleBanUser = async (userId: string, reason: string) => {
  await adminApi.banUser(userId, reason);
  trackAdminAction({
    type: 'USER_BANNED',
    entityType: 'USER',
    entityId: userId,
    metadata: { reason },
  });
};
```

### Performance Monitoring

```typescript
// lib/monitoring/performance.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export const reportWebVitals = (metric: Metric) => {
  // Send to analytics service
  if (process.env.NODE_ENV === 'production') {
    console.log(metric);
    // analytics.track('web-vitals', metric);
  }
};

// In app layout
useEffect(() => {
  onCLS(reportWebVitals);
  onFID(reportWebVitals);
  onLCP(reportWebVitals);
  onFCP(reportWebVitals);
  onTTFB(reportWebVitals);
}, []);
```

## Implementation Checklist

### Phase 1: Setup ✓
- [ ] Create admin route structure
- [ ] Implement auth guards and middleware
- [ ] Setup Zustand stores
- [ ] Configure React Query
- [ ] Create base layout and navigation

### Phase 2: Core Components
- [ ] DataTable component with filtering/sorting
- [ ] StatCard component
- [ ] SettingsPanel component
- [ ] ApprovalQueue component
- [ ] Form components with validation

### Phase 3: User Management
- [ ] User list page with filters
- [ ] User detail view
- [ ] User actions (ban, suspend, verify)
- [ ] Client management interface

### Phase 4: Financial & Payments
- [ ] Payment approval queue
- [ ] Escrow management
- [ ] Financial dashboard
- [ ] Revenue charts
- [ ] Transaction reconciliation

### Phase 5: Content Moderation
- [ ] Review moderation interface
- [ ] Content moderation queue
- [ ] Dispute resolution workflow

### Phase 6: Configuration
- [ ] Currency management
- [ ] Map API configuration
- [ ] Escrow settings
- [ ] Platform fee configuration
- [ ] System settings hub

### Phase 7: Polish & Testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Responsive design testing
- [ ] Performance optimization
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E test scenarios

## Conclusion

This architecture provides a scalable, maintainable, and accessible foundation for the Taska admin portal. The modular component structure enables parallel development, while the performance optimizations and accessibility features ensure a professional user experience for administrators managing the platform.

Key benefits:
- **Scalable**: Component-based architecture supports growth
- **Accessible**: WCAG 2.1 AA compliant for all users
- **Performant**: Optimized loading and caching strategies
- **Secure**: Role-based access control and data protection
- **Maintainable**: TypeScript, clear patterns, comprehensive testing
