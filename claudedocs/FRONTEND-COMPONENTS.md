# Frontend Components Documentation

**Framework**: Next.js 14 with React 18
**UI Library**: Radix UI + Tailwind CSS
**State Management**: Zustand + React Query
**Type Safety**: TypeScript 5.2

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [UI Components](#ui-components)
3. [Provider Components](#provider-components)
4. [Custom Hooks](#custom-hooks)
5. [API Client](#api-client)
6. [Styling Guide](#styling-guide)
7. [Best Practices](#best-practices)

---

## Component Architecture

### Directory Structure

```
frontend/src/
├── components/
│   ├── ui/                 # Base UI components (Button, Card, etc.)
│   ├── providers/          # Context providers (Auth, Theme, etc.)
│   ├── mobile/             # Mobile-specific components
│   └── features/           # Feature-specific components
├── lib/
│   ├── api.ts              # API client configuration
│   └── utils.ts            # Utility functions
├── hooks/                  # Custom React hooks
├── app/                    # Next.js app directory (pages)
└── styles/                 # Global styles
```

### Component Naming Conventions

- **UI Components**: PascalCase (e.g., `Button`, `Card`)
- **Feature Components**: PascalCase with descriptive names (e.g., `JobCard`, `BidForm`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth`, `useJobs`)
- **Utilities**: camelCase (e.g., `cn`, `formatCurrency`)

---

## UI Components

### Button Component

**File**: `src/components/ui/button.tsx`

Versatile button component built with Radix UI Slot and class-variance-authority (CVA).

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

#### Variants

| Variant | Description | Use Case |
|---------|-------------|----------|
| `default` | Primary brand color | Main actions (Submit, Create) |
| `destructive` | Red/danger styling | Delete, Cancel operations |
| `outline` | Border with transparent bg | Secondary actions |
| `secondary` | Subtle background | Tertiary actions |
| `ghost` | No background, hover effect | Navigation, less emphasis |
| `link` | Underlined text style | Inline links |

#### Sizes

| Size | Height | Use Case |
|------|--------|----------|
| `sm` | 36px (h-9) | Compact spaces, tables |
| `default` | 40px (h-10) | Standard buttons |
| `lg` | 44px (h-11) | Hero sections, emphasis |
| `icon` | 40px × 40px | Icon-only buttons |

#### Usage Examples

**Basic Usage**:
```tsx
import { Button } from '@/components/ui/button';

export function Example() {
  return (
    <Button variant="default" size="default">
      Click Me
    </Button>
  );
}
```

**Destructive Action**:
```tsx
<Button
  variant="destructive"
  onClick={handleDelete}
>
  Delete Job
</Button>
```

**As Child (Polymorphic)**:
```tsx
import Link from 'next/link';

<Button asChild variant="outline">
  <Link href="/jobs">View Jobs</Link>
</Button>
```

**Icon Button**:
```tsx
import { TrashIcon } from 'lucide-react';

<Button variant="ghost" size="icon">
  <TrashIcon className="h-4 w-4" />
</Button>
```

**Loading State**:
```tsx
<Button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit Bid'}
</Button>
```

#### Accessibility

- ✅ Keyboard navigable (Tab, Enter, Space)
- ✅ Focus visible ring indicator
- ✅ Disabled state prevents interaction
- ✅ ARIA attributes inherited from native button
- ✅ Proper contrast ratios (WCAG AA)

---

### Card Component

**File**: `src/components/ui/card.tsx`

Container component for grouping related content.

#### Sub-components

```typescript
Card          // Main container
CardHeader    // Top section (title, actions)
CardTitle     // Title text
CardDescription // Subtitle/description
CardContent   // Main content area
CardFooter    // Bottom section (actions)
```

#### Usage Example

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function JobCard({ job }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{job.title}</CardTitle>
        <CardDescription>{job.category.name}</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          {job.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold">
            R{job.budgetMin} - R{job.budgetMax}
          </span>
          <span className="text-sm text-muted-foreground">
            {job.city}, {job.province}
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="default" className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### Badge Component

**File**: `src/components/ui/badge.tsx`

Small label for status indicators and tags.

#### Variants

| Variant | Use Case |
|---------|----------|
| `default` | General tags |
| `secondary` | Less emphasis |
| `destructive` | Errors, cancelled |
| `outline` | Neutral information |

#### Usage Example

```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">{job.urgencyLevel}</Badge>
<Badge variant="destructive">Cancelled</Badge>
<Badge variant="outline">{job.category.name}</Badge>
```

**Status Badges**:
```tsx
function JobStatusBadge({ status }: { status: JobStatus }) {
  const variants = {
    OPEN: 'default',
    IN_PROGRESS: 'secondary',
    COMPLETED: 'default',
    CANCELLED: 'destructive',
  } as const;

  return (
    <Badge variant={variants[status]}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
```

---

### Tabs Component

**File**: `src/components/ui/tabs.tsx`

Tabbed interface built with Radix UI.

#### Sub-components

```typescript
Tabs         // Container
TabsList     // Tab button container
TabsTrigger  // Individual tab button
TabsContent  // Content panel for each tab
```

#### Usage Example

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function DashboardTabs() {
  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList>
        <TabsTrigger value="active">Active Jobs</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <JobList filter="OPEN" />
      </TabsContent>

      <TabsContent value="completed">
        <JobList filter="COMPLETED" />
      </TabsContent>

      <TabsContent value="cancelled">
        <JobList filter="CANCELLED" />
      </TabsContent>
    </Tabs>
  );
}
```

---

## Provider Components

### AuthProvider

**File**: `src/components/providers/auth-provider.tsx`

Authentication context provider managing user state and auth operations.

#### Context Interface

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

#### User Type

```typescript
interface User {
  id: string;
  email: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR';
  profile?: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}
```

#### Setup

**Wrap your app** in `app/layout.tsx`:

```tsx
import { AuthProvider } from '@/components/providers/auth-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### Usage with useAuth Hook

```tsx
'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Button asChild><Link href="/login">Login</Link></Button>;
  }

  return (
    <div>
      <span>Hello, {user.profile?.firstName}!</span>
      <Button variant="ghost" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}
```

#### Login Flow

```tsx
'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Automatically redirects based on role
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="text-destructive">{error}</p>}
      <Button type="submit">Login</Button>
    </form>
  );
}
```

#### Registration Flow

```tsx
const { register } = useAuth();

const handleRegister = async (data: RegisterData) => {
  try {
    await register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phoneNumber: data.phoneNumber,
    });
    // Redirects to email verification page
  } catch (err) {
    console.error('Registration failed:', err);
  }
};
```

#### Token Refresh

Automatic token refresh on API 401 errors:

```tsx
// In API client (lib/api.ts)
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        await auth.refreshToken();
        // Retry original request
        return api.request(error.config);
      } catch (refreshError) {
        // Refresh failed, logout
        auth.logout();
      }
    }
    return Promise.reject(error);
  }
);
```

#### Protected Routes

```tsx
'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children, allowedRoles }: {
  children: React.ReactNode;
  allowedRoles?: ('CLIENT' | 'ARTISAN' | 'ADMIN')[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }

    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

**Usage**:
```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

---

### ThemeProvider

**File**: `src/components/providers/theme-provider.tsx`

Dark/light mode theme management using `next-themes`.

#### Setup

```tsx
import { ThemeProvider } from '@/components/providers/theme-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### Usage

```tsx
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

---

### QueryProvider

**File**: `src/components/providers/query-provider.tsx`

React Query provider for server state management.

#### Configuration

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

### ToastProvider

**File**: `src/components/providers/toast-provider.tsx`

Toast notification system using `react-hot-toast`.

#### Usage

```tsx
import toast from 'react-hot-toast';

// Success notification
toast.success('Job created successfully!');

// Error notification
toast.error('Failed to submit bid');

// Loading notification
const loadingToast = toast.loading('Creating job...');
// Later dismiss
toast.dismiss(loadingToast);

// Custom notification
toast.custom((t) => (
  <div className="bg-card p-4 rounded-lg shadow-lg">
    <h3>Custom Notification</h3>
    <button onClick={() => toast.dismiss(t.id)}>Close</button>
  </div>
));
```

---

## Custom Hooks

### useAuth

Access authentication context.

```tsx
const { user, loading, login, logout, register, refreshToken } = useAuth();
```

---

## API Client

**File**: `src/lib/api.ts`

Axios-based API client with interceptors.

### Configuration

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/v1/auth/refresh-token', {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Usage Examples

**Fetch Jobs**:
```typescript
import { api } from '@/lib/api';

export async function getJobs(params: JobQueryParams) {
  const { data } = await api.get('/jobs', { params });
  return data;
}
```

**Create Job**:
```typescript
export async function createJob(jobData: CreateJobDto) {
  const { data } = await api.post('/jobs', jobData);
  return data;
}
```

**With React Query**:
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useJobs(filters: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const { data } = await api.get('/jobs', { params: filters });
      return data;
    },
  });
}

export function useCreateJob() {
  return useMutation({
    mutationFn: async (jobData: CreateJobDto) => {
      const { data } = await api.post('/jobs', jobData);
      return data;
    },
    onSuccess: () => {
      toast.success('Job created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create job');
    },
  });
}
```

**Component Usage**:
```tsx
'use client';

import { useJobs, useCreateJob } from '@/hooks/useJobs';

export function JobList() {
  const { data, isLoading, error } = useJobs({ status: 'OPEN' });
  const createJob = useCreateJob();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading jobs</div>;

  return (
    <div>
      {data.jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      <Button onClick={() => createJob.mutate(jobData)}>
        Create Job
      </Button>
    </div>
  );
}
```

---

## Styling Guide

### Tailwind CSS Utilities

**Color System**:
```css
bg-background       /* Page background */
bg-card             /* Card background */
bg-primary          /* Primary brand color */
bg-secondary        /* Secondary color */
bg-accent           /* Accent color */
bg-muted            /* Muted background */
bg-destructive      /* Error/danger color */

text-foreground     /* Main text */
text-muted-foreground /* Muted text */
text-primary        /* Primary text */
```

**Spacing**:
```tsx
className="p-4"      // Padding: 1rem
className="m-2"      // Margin: 0.5rem
className="space-y-4" // Vertical spacing between children
className="gap-4"    // Grid/flex gap
```

**Typography**:
```tsx
className="text-sm"      // 14px
className="text-base"    // 16px
className="text-lg"      // 18px
className="font-medium"  // 500 weight
className="font-semibold" // 600 weight
```

### Custom Utility: cn()

**File**: `src/lib/utils.ts`

Merge Tailwind classes with proper precedence:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage**:
```tsx
<div className={cn(
  "base-class",
  condition && "conditional-class",
  className // prop
)}>
```

---

## Best Practices

### 1. Component Organization

```tsx
// ✅ Good: Small, focused components
function JobCard({ job }) {
  return (
    <Card>
      <CardHeader>
        <JobCardHeader job={job} />
      </CardHeader>
      <CardContent>
        <JobCardContent job={job} />
      </CardContent>
    </Card>
  );
}

// ❌ Bad: Monolithic component
function JobCard({ job }) {
  // 200+ lines of JSX
}
```

### 2. TypeScript Usage

```tsx
// ✅ Good: Proper typing
interface JobCardProps {
  job: Job;
  onBid?: (jobId: string) => void;
  className?: string;
}

export function JobCard({ job, onBid, className }: JobCardProps) {
  // ...
}

// ❌ Bad: any types
export function JobCard({ job, onBid }: any) {
  // ...
}
```

### 3. State Management

```tsx
// ✅ Good: Server state with React Query
const { data: jobs } = useQuery({
  queryKey: ['jobs'],
  queryFn: fetchJobs,
});

// ✅ Good: Client state with useState
const [isOpen, setIsOpen] = useState(false);

// ❌ Bad: Prop drilling
<Parent>
  <Child prop={value}>
    <GrandChild prop={value}>
      <GreatGrandChild prop={value} />
    </GrandChild>
  </Child>
</Parent>
```

### 4. Error Handling

```tsx
// ✅ Good: Proper error boundaries
import { ErrorBoundary } from 'react-error-boundary';

export function JobList() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <JobListContent />
    </ErrorBoundary>
  );
}

// ✅ Good: Query error handling
const { data, error, isError } = useJobs();

if (isError) {
  return <ErrorMessage error={error} />;
}
```

### 5. Accessibility

```tsx
// ✅ Good: Semantic HTML + ARIA
<button
  type="button"
  aria-label="Delete job"
  aria-describedby="delete-description"
>
  <TrashIcon />
</button>

// ✅ Good: Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>
```

### 6. Performance

```tsx
// ✅ Good: Memoization
const MemoizedJobCard = React.memo(JobCard);

// ✅ Good: Lazy loading
const AdminPanel = lazy(() => import('./AdminPanel'));

// ✅ Good: Image optimization
import Image from 'next/image';

<Image
  src={job.imageUrl}
  alt={job.title}
  width={400}
  height={300}
  loading="lazy"
/>
```

---

## Testing Components

### Unit Testing with React Testing Library

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });
});
```

---

## Migration & Upgrade Guide

### Adding New UI Components

1. Create component file in `src/components/ui/`
2. Export from component file
3. Document props and usage
4. Add to Storybook (if available)
5. Write unit tests

### Updating Existing Components

1. Maintain backward compatibility
2. Add deprecation warnings if needed
3. Update documentation
4. Add migration guide if breaking changes

---

**Last Updated**: 2025-01-09
**Next.js Version**: 14.0.0
**React Version**: 18.2.0
