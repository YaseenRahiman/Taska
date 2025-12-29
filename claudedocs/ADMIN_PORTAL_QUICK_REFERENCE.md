# Admin Portal Quick Reference Guide

## Component Usage Matrix

| Feature | Route | Component | API Endpoint | Status |
|---------|-------|-----------|--------------|--------|
| Dashboard | `/admin/dashboard` | `AdminDashboard` | `GET /admin/dashboard/metrics` | ✓ Exists |
| User List | `/admin/users` | `UserManagement` | `GET /admin/users` | ✓ Exists |
| User Detail | `/admin/users/[id]` | `UserDetailView` | `GET /admin/users/:id` | ✓ Backend |
| Client List | `/admin/clients` | `ClientManagement` | `GET /admin/users?role=CLIENT` | To Build |
| Client Edit | `/admin/clients/[id]` | `ClientEditor` | `PATCH /admin/users/:id` | To Build |
| Payment Queue | `/admin/payments` | `PaymentApprovalQueue` | `GET /admin/payments?status=PENDING` | To Build |
| Escrow Mgmt | `/admin/payments/escrow` | `EscrowManager` | `POST /admin/payments/:id/release-escrow` | To Build |
| Review Queue | `/admin/reviews` | `ReviewModeration` | `GET /admin/reviews` | To Build |
| Moderation | `/admin/moderation` | `ModerationQueue` | `GET /admin/moderation` | ✓ Backend |
| Currency | `/admin/settings/currency` | `CurrencyManager` | `GET/POST /admin/settings/currencies` | To Build |
| Map Config | `/admin/settings/maps` | `MapAPIConfig` | `GET/PUT /admin/settings/maps` | To Build |
| Escrow Config | `/admin/settings/escrow` | `EscrowConfig` | `GET/PUT /admin/settings/escrow` | To Build |
| Financial | `/admin/financial` | `FinancialDashboard` | `GET /admin/financial/reconciliation` | ✓ Backend |

## Component Dependency Tree

```
AdminLayout
│
├─ AdminNavigation (sidebar/mobile nav)
├─ AdminHeader (breadcrumbs, user menu)
│
└─ Page Components
    │
    ├─ AdminDashboard
    │   ├─ AdminStatCard (4x)
    │   ├─ SystemHealthCard
    │   └─ ActivityFeed
    │
    ├─ UserManagement
    │   ├─ AdminDataTable
    │   │   ├─ FilterBar
    │   │   ├─ DataTable
    │   │   └─ Pagination
    │   ├─ UserActions (ban, suspend, verify)
    │   └─ UserDetailModal
    │
    ├─ PaymentApprovalQueue
    │   ├─ ApprovalQueueCard (multiple)
    │   │   ├─ PaymentDetails
    │   │   ├─ ApproveButton
    │   │   └─ RejectButton
    │   └─ ExportButton
    │
    ├─ ReviewModeration
    │   ├─ ReviewCard (grid)
    │   ├─ ReviewDetailModal
    │   │   ├─ RatingBreakdown
    │   │   ├─ ImageGallery
    │   │   └─ ReviewEditor
    │   └─ ReviewActions
    │
    └─ Settings Pages
        ├─ SettingsPanel (wrapper)
        │
        ├─ CurrencyManager
        │   ├─ AdminDataTable (currency list)
        │   ├─ CurrencyForm (add/edit modal)
        │   └─ AuditLogViewer
        │
        ├─ MapAPIConfig
        │   ├─ ProviderSelect
        │   ├─ SecureKeyInput
        │   ├─ DomainRestrictions
        │   ├─ FeatureToggles
        │   └─ TestConnectionButton
        │
        └─ EscrowConfig
            ├─ DurationSettings
            ├─ AmountLimits
            ├─ FeeConfiguration
            └─ RefundPolicyEditor
```

## State Management Overview

```typescript
// Zustand Stores
adminStore
├─ users: User[]
├─ selectedUser: User | null
├─ userFilters: UserFilters
├─ pendingPayments: Payment[]
├─ systemSettings: SystemSettings
├─ sidebarCollapsed: boolean
└─ activeTab: string

// React Query Keys
['admin', 'metrics']                    // Dashboard metrics
['admin', 'users', filters]             // User list (with filters)
['admin', 'user', userId]               // Single user detail
['admin', 'payments', 'pending']        // Payment queue
['admin', 'reviews', filter]            // Reviews (flagged/all)
['admin', 'moderation', filters]        // Moderation queue
['admin', 'settings', 'system']         // System settings
['admin', 'settings', 'currency']       // Currency config
['admin', 'settings', 'maps']           // Map API config
['admin', 'settings', 'escrow']         // Escrow config
['admin', 'financial', 'reconciliation'] // Financial data
```

## API Endpoints Reference

### User Management
```typescript
GET    /admin/users                    // List users with filters
GET    /admin/users/:id                // User details
POST   /admin/users/:id/ban            // Ban user
POST   /admin/users/:id/suspend        // Suspend user
PATCH  /admin/users/:id/verify         // Verify artisan
POST   /admin/users/:id/reset-password // Reset password
```

### Payment Management
```typescript
GET    /admin/payments                 // List payments
POST   /admin/payments/:id/approve     // Approve payment
POST   /admin/payments/:id/reject      // Reject payment
POST   /admin/payments/:id/release-escrow // Release escrow
```

### Review Management
```typescript
GET    /admin/reviews                  // List reviews
PATCH  /admin/reviews/:id              // Update review
POST   /admin/reviews/:id/approve      // Approve review
POST   /admin/reviews/:id/reject       // Reject review
```

### Content Moderation
```typescript
GET    /admin/moderation               // Moderation queue
POST   /admin/moderation/content       // Moderate content
POST   /admin/moderation/disputes/:id/resolve // Resolve dispute
```

### System Settings
```typescript
GET    /admin/system/settings          // Get all settings
PUT    /admin/system/settings/:key     // Update setting
PUT    /admin/system/platform-fees     // Update fees
```

### Configuration
```typescript
GET    /admin/settings/currencies      // List currencies
POST   /admin/settings/currencies      // Add currency
PUT    /admin/settings/currencies/:code // Update currency

GET    /admin/settings/maps            // Map config
PUT    /admin/settings/maps            // Update map config
POST   /admin/settings/maps/test       // Test connection

GET    /admin/settings/escrow          // Escrow config
PUT    /admin/settings/escrow          // Update escrow config
```

### Financial
```typescript
GET    /admin/financial/reconciliation // Financial data
POST   /admin/reports/generate         // Generate report
```

## Common Patterns

### Data Table Pattern
```tsx
<AdminDataTable
  data={items}
  columns={columnDefs}
  filters={filterConfig}
  pagination={{ pageSize: 20 }}
  rowActions={actionButtons}
  selectable
  onSelectionChange={handleSelection}
/>
```

### Approval Workflow Pattern
```tsx
<ApprovalQueueCard
  item={payment}
  title="Payment #123"
  onApprove={handleApprove}
  onReject={handleReject}
  requireRejectReason
/>
```

### Settings Form Pattern
```tsx
<SettingsPanel
  title="Configuration"
  icon={Settings}
  saveButton={{
    onClick: handleSave,
    loading: isSaving,
  }}
>
  <FormFields />
</SettingsPanel>
```

### Modal Pattern
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <DialogBody>{content}</DialogBody>
    <DialogFooter>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Styling Conventions

### Color Palette
```typescript
// Status Colors
success: 'green-600'      // Active, approved, verified
warning: 'yellow-600'     // Pending, flagged, suspended
error: 'red-600'          // Banned, rejected, error
info: 'blue-600'          // Information, links
neutral: 'gray-600'       // Inactive, disabled

// Role Colors
admin: 'red-100/800'      // Admin users
artisan: 'blue-100/800'   // Artisan users
client: 'green-100/800'   // Client users
assessor: 'purple-100/800' // Assessor users
```

### Spacing Scale
```typescript
gap-1: 0.25rem  // 4px
gap-2: 0.5rem   // 8px
gap-3: 0.75rem  // 12px
gap-4: 1rem     // 16px
gap-6: 1.5rem   // 24px
gap-8: 2rem     // 32px
```

### Typography
```typescript
// Headings
h1: 'text-3xl font-bold'      // Page titles
h2: 'text-2xl font-semibold'  // Section titles
h3: 'text-lg font-semibold'   // Subsection titles
h4: 'text-base font-medium'   // Card titles

// Body
body: 'text-sm text-gray-700'
caption: 'text-xs text-gray-500'
```

## Accessibility Checklist

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab for reverse navigation
- [ ] Enter/Space to activate buttons
- [ ] Escape to close modals
- [ ] Arrow keys in tables/lists

### Screen Reader
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] ARIA labels on icons
- [ ] Status announcements

### Visual
- [ ] 4.5:1 contrast for text
- [ ] 3:1 contrast for UI elements
- [ ] Focus indicators visible
- [ ] No color-only information
- [ ] Resizable text (up to 200%)

### Forms
- [ ] Labels associated with inputs
- [ ] Error messages descriptive
- [ ] Required fields indicated
- [ ] Help text available
- [ ] Success confirmation

## Performance Checklist

### Loading Optimization
- [ ] Route-based code splitting
- [ ] Lazy load heavy components
- [ ] Image optimization (Next/Image)
- [ ] Font optimization (next/font)
- [ ] Prefetch on hover

### Data Management
- [ ] Pagination for lists (20/page)
- [ ] Virtual scrolling for large datasets
- [ ] React Query caching (5min stale)
- [ ] Optimistic updates
- [ ] Background refetching

### Bundle Size
- [ ] Tree shaking enabled
- [ ] Dynamic imports for charts
- [ ] Remove unused dependencies
- [ ] Minimize vendor bundles
- [ ] Compress images

## Testing Quick Reference

### Unit Test Example
```typescript
describe('AdminStatCard', () => {
  it('renders value and title', () => {
    render(<AdminStatCard title="Users" value="100" icon={Users} />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
```

### Integration Test Example
```typescript
describe('User Management', () => {
  it('filters users by role', async () => {
    renderWithProviders(<UserManagement />);
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'ARTISAN' }
    });
    await waitFor(() => {
      expect(screen.getByText('Showing artisans')).toBeInTheDocument();
    });
  });
});
```

### E2E Test Example
```typescript
test('admin approves payment', async ({ page }) => {
  await page.goto('/admin/payments');
  await page.click('[aria-label="Approve payment"]');
  await page.click('button:has-text("Confirm")');
  await expect(page.locator('[role="status"]')).toContainText('approved');
});
```

## Common Issues & Solutions

### Issue: Table filters not updating
**Solution**: Ensure filter changes trigger React Query refetch
```typescript
useEffect(() => {
  queryClient.invalidateQueries(['admin', 'users', filters]);
}, [filters]);
```

### Issue: Form validation not showing
**Solution**: Check form state and error mapping
```typescript
{errors.email && (
  <p role="alert" className="text-red-600">
    {errors.email.message}
  </p>
)}
```

### Issue: Modal accessibility issues
**Solution**: Add focus trap and ARIA attributes
```typescript
<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
```

### Issue: Slow table rendering
**Solution**: Implement virtual scrolling for large datasets
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60,
});
```

## Development Workflow

### Local Development
```bash
# Start dev server
npm run dev

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Type check
npm run type-check

# Lint
npm run lint
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/admin-currency-config

# Commit changes
git add .
git commit -m "feat: implement currency configuration"

# Push to remote
git push -u origin feature/admin-currency-config

# Create PR
gh pr create --title "Add currency configuration" --body "..."
```

### Code Review Checklist
- [ ] TypeScript errors resolved
- [ ] ESLint warnings fixed
- [ ] Tests passing (unit + integration)
- [ ] Accessibility verified
- [ ] Responsive design tested
- [ ] Performance acceptable
- [ ] Documentation updated

## Useful Links

- **Architecture**: `ADMIN_PORTAL_ARCHITECTURE.md`
- **Component Specs**: `ADMIN_COMPONENT_SPECIFICATIONS.md`
- **Summary**: `ADMIN_PORTAL_SUMMARY.md`
- **Radix UI Docs**: https://www.radix-ui.com/
- **TanStack Table**: https://tanstack.com/table/
- **React Query**: https://tanstack.com/query/
- **Tailwind CSS**: https://tailwindcss.com/

## Quick Commands

```bash
# Create new admin page
mkdir -p frontend/src/app/admin/[feature]
touch frontend/src/app/admin/[feature]/page.tsx

# Create component
touch frontend/src/components/admin/[Component].tsx

# Add API endpoint
# Edit: frontend/src/lib/api/admin.ts

# Run specific test
npm run test -- AdminDataTable.test.tsx

# Generate component from template
npm run generate:component admin/[ComponentName]
```
