# Admin Portal Sprint 3 - Next Session Guide

## Session Information
**Date**: TBD (After November 8, 2025)
**Focus**: Complete Bulk Operations Frontend Module
**Current Progress**: 2/8 Bulk Operations files complete (25%)

---

## Quick Start Commands

### Resume Development
```bash
cd frontend
npm run dev
# Backend should already be running from previous session
```

### Check Current Status
```bash
# View implemented components
ls frontend/src/app/admin/bulk-operations/

# Should see:
# - UserSelectionTable.tsx ✅
# - OperationProgress.tsx ✅
# - (6 more files to create)
```

---

## What's Already Done ✅

### Infrastructure (Complete)
- ✅ Admin navigation updated with Sprint 3 routes
- ✅ Dependencies installed:
  - socket.io-client
  - react-hot-toast
  - papaparse
  - date-fns
  - @types/papaparse

### Bulk Operations (2/8 files)
- ✅ **bulk-operations.types.ts** - All TypeScript types
- ✅ **UserSelectionTable.tsx** - Reusable multi-select table (300+ lines)
  - Multi-select, pagination, search, sorting
  - API integration, responsive, accessible
- ✅ **OperationProgress.tsx** - Real-time tracking (200+ lines)
  - Progress bar, real-time polling, status indicators
  - Cancel operation, error display

---

## What to Build Next 🎯

### Priority 1: Complete Bulk Operations (6 files, ~3-4 hours)

#### File 1: OperationHistory.tsx (~200 lines)
**Purpose**: Display paginated history of past bulk operations
**Features**:
- Paginated table (20 per page)
- Filter by type, status, date range
- View details button (opens OperationProgress modal)
- Delete operation button
- API: GET /api/v1/admin/bulk/operations

**Implementation Pattern**:
```tsx
- Fetch operations with filters
- Display in table with status badges
- Modal for viewing OperationProgress
- Confirm before delete
```

#### File 2: BulkUserActions.tsx (~250 lines)
**Purpose**: Bulk user management actions
**Features**:
- Uses UserSelectionTable component
- Ban users modal (reason input)
- Suspend users modal (reason + expiry date)
- Verify artisans button
- Clear selection, selected count
- API: POST /api/v1/admin/bulk/users/{ban,suspend,verify}

**Implementation Pattern**:
```tsx
- State for selected users
- Modals for each action (ban, suspend)
- Form validation
- API calls with toast notifications
- Refresh after success
```

#### File 3: BulkEmailSender.tsx (~300 lines)
**Purpose**: Send mass email campaigns
**Features**:
- Recipient selection (all/clients/artisans/custom)
- Subject and body inputs
- Template dropdown (optional)
- Schedule date picker (optional)
- Preview modal
- Send button
- API: POST /api/v1/admin/bulk/email/send

**Implementation Pattern**:
```tsx
- Form with subject, body, recipients
- Optional template selection
- Optional scheduling
- Preview modal before send
- Confirmation dialog
```

#### File 4: BatchModeration.tsx (~250 lines)
**Purpose**: Bulk content moderation
**Features**:
- Content type selector (Jobs/Reviews/Comments)
- Multi-select content table
- Action buttons (Approve/Reject/Hide/Delete)
- Reason input for actions
- Confirmation dialogs
- API: POST /api/v1/admin/bulk/content/moderate

**Implementation Pattern**:
```tsx
- Content type tabs
- Fetch and display content
- Multi-select table
- Action modals with reason input
- Confirm destructive actions
```

#### File 5: CsvExportImport.tsx (~300 lines)
**Purpose**: CSV export and import functionality
**Features**:
- Entity type selector (Users/Jobs/Payments/Reviews)
- Format selector (CSV/JSON/EXCEL)
- Filter builder
- Export button → download file
- CSV file upload area
- Import preview table
- Import button
- API: POST /api/v1/admin/bulk/export

**Implementation Pattern**:
```tsx
- Export: form → API → download blob
- Import: file upload → parse with papaparse → preview → confirm → API
- Progress tracking for large operations
```

#### File 6: page.tsx (~200 lines)
**Purpose**: Main bulk operations page with tabs
**Features**:
- Tab navigation (User Actions, Email, Moderation, CSV, History)
- Active tab state
- Renders appropriate component per tab
- Breadcrumb navigation

**Implementation Pattern**:
```tsx
'use client';
import { useState } from 'react';
// Import all 5 tab components

export default function BulkOperationsPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="p-6">
      {/* Header */}
      {/* Tab Navigation */}
      {/* Tab Content */}
      {activeTab === 'users' && <BulkUserActions />}
      {activeTab === 'email' && <BulkEmailSender />}
      {activeTab === 'moderation' && <BatchModeration />}
      {activeTab === 'csv' && <CsvExportImport />}
      {activeTab === 'history' && <OperationHistory />}
    </div>
  );
}
```

---

## Implementation Checklist

### Before Starting
- [ ] Backend running on localhost:3000
- [ ] Frontend dev server running
- [ ] Review existing components (UserSelectionTable, OperationProgress)
- [ ] Review backend API endpoints documentation

### During Implementation
- [ ] Create OperationHistory.tsx
- [ ] Create BulkUserActions.tsx
- [ ] Create BulkEmailSender.tsx
- [ ] Create BatchModeration.tsx
- [ ] Create CsvExportImport.tsx
- [ ] Create page.tsx (main page)
- [ ] Test each component individually
- [ ] Test tab navigation
- [ ] Test API integration end-to-end

### After Completion
- [ ] All 8 Bulk Operations files created
- [ ] All tabs working
- [ ] All API endpoints integrated
- [ ] Toast notifications working
- [ ] Error handling verified
- [ ] Loading states working
- [ ] Responsive on mobile/tablet/desktop
- [ ] Update documentation

---

## Testing Strategy

### Manual Testing
1. Navigate to `/admin/bulk-operations`
2. Test each tab:
   - **User Actions**: Select users, ban/suspend/verify
   - **Email**: Compose and send test email
   - **Moderation**: Moderate test content
   - **CSV**: Export users, import CSV
   - **History**: View past operations, check progress

### API Testing
- Use browser DevTools Network tab
- Verify correct API calls
- Check request/response payloads
- Verify authentication headers

### Error Testing
- Network failures
- Validation errors
- Empty states
- Large datasets

---

## Common Patterns to Follow

### API Call Pattern
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/v1/admin/bulk/...', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Operation failed');

    const result = await response.json();
    toast.success('Operation completed successfully');
    // Refresh data or update UI
  } catch (error) {
    console.error(error);
    toast.error(error.message || 'Operation failed');
  } finally {
    setLoading(false);
  }
};
```

### Modal Pattern
```typescript
const [showModal, setShowModal] = useState(false);

// In JSX:
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      {/* Modal content */}
      <button onClick={() => setShowModal(false)}>Close</button>
    </div>
  </div>
)}
```

### Form Validation Pattern
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.subject) newErrors.subject = 'Subject is required';
  if (!formData.body) newErrors.body = 'Message body is required';

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Loading State Pattern
```typescript
const [isLoading, setIsLoading] = useState(false);

// In JSX:
<button disabled={isLoading}>
  {isLoading ? (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      Processing...
    </div>
  ) : (
    'Submit'
  )}
</button>
```

---

## Component File Structure Template

Each component should follow this structure:

```tsx
'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Icon1, Icon2 } from 'lucide-react';

interface ComponentProps {
  // Props if needed
}

export default function ComponentName({ }: ComponentProps) {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    fetchData();
  }, []);

  // API Functions
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('...');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers
  const handleAction = async () => {
    // Implementation
  };

  // Render Helpers
  const renderContent = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    return <MainContent />;
  };

  // Main Render
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}
```

---

## Styling Guidelines

### Use Tailwind Classes Consistently
```tsx
// Container
className="p-6 bg-white rounded-lg shadow-sm"

// Buttons
className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"

// Inputs
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

// Tables
className="min-w-full divide-y divide-gray-200"

// Status Badges
className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
```

### Responsive Design
```tsx
// Mobile-first approach
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
className="text-sm md:text-base lg:text-lg"
className="p-4 md:p-6 lg:p-8"
```

---

## After Bulk Operations Complete

Move to next modules in this order:

### Priority 2: Activity Logs (7 files, ~5-6 hours)
- LogViewer.tsx
- LogFilters.tsx
- LogEntry.tsx
- LogExport.tsx
- LogSearch.tsx
- LogAnalytics.tsx
- page.tsx

### Priority 3: Report Builder (9 files, ~8-10 hours)
- ReportTemplates.tsx
- ReportForm.tsx
- ReportPreview.tsx
- ScheduledReports.tsx
- ReportHistory.tsx
- DataSourceSelector.tsx
- FilterBuilder.tsx
- ChartBuilder.tsx
- page.tsx

### Priority 4: WebSocket & Real-time (10 files, ~10-12 hours)
- WebSocketProvider.tsx
- useWebSocket.ts hook
- NotificationCenter.tsx
- LiveActivityFeed.tsx
- RealTimeMetrics.tsx
- ChatSupport.tsx
- OnlineUsers.tsx
- SystemAlerts.tsx
- ConnectionStatus.tsx
- page.tsx

---

## Resources

### Backend API Documentation
- **Swagger UI**: http://localhost:3000/api
- **Bulk Operations Endpoints**: http://localhost:3000/api#/Admin%20Bulk%20Operations
- **Authentication**: Bearer token in Authorization header

### Frontend References
- **Existing Components**: frontend/src/app/admin/analytics/ (reference patterns)
- **Types**: frontend/src/types/bulk-operations.types.ts
- **API Client**: frontend/src/lib/api.ts

### External Documentation
- **Icons**: https://lucide.dev/icons/
- **Toasts**: https://react-hot-toast.com/docs
- **Tailwind**: https://tailwindcss.com/docs
- **Papa Parse**: https://www.papaparse.com/docs
- **date-fns**: https://date-fns.org/docs

---

## Troubleshooting Common Issues

### API Authentication Errors
```typescript
// Check token in localStorage
const token = localStorage.getItem('token');
if (!token) {
  toast.error('Please log in again');
  router.push('/auth/login');
}
```

### CORS Issues
```typescript
// Ensure backend CORS is configured for http://localhost:3001
// Check backend/src/main.ts for CORS configuration
```

### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Component Not Rendering
```typescript
// Check for:
// 1. 'use client' directive at top
// 2. Proper imports
// 3. Console errors in browser DevTools
// 4. Network tab for failed API calls
```

---

## Performance Considerations

### Optimize Large Lists
```typescript
// Use pagination for tables with >100 items
const ITEMS_PER_PAGE = 20;

// Debounce search inputs
import { debounce } from 'lodash';
const debouncedSearch = debounce(searchFunction, 300);
```

### Lazy Load Heavy Components
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />
});
```

### Cache API Responses
```typescript
// Use SWR or React Query for caching
// For now, simple in-memory cache:
const cache = new Map();
const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  if (cache.has(key)) return cache.get(key);
  const data = await fetcher();
  cache.set(key, data);
  return data;
};
```

---

## Code Quality Checklist

Before considering a component complete:

- [ ] TypeScript: No `any` types, all props/state typed
- [ ] Error Handling: Try-catch blocks for API calls
- [ ] Loading States: Show spinners during async operations
- [ ] Empty States: Handle no data scenarios gracefully
- [ ] Accessibility: Proper ARIA labels, keyboard navigation
- [ ] Responsive: Test on mobile, tablet, desktop
- [ ] Console Clean: No errors or warnings in browser console
- [ ] Network Efficient: No unnecessary API calls
- [ ] User Feedback: Toast notifications for actions
- [ ] Code Comments: Document complex logic

---

## Estimated Timeline

### Session 1 (3-4 hours)
- OperationHistory.tsx (1 hour)
- BulkUserActions.tsx (1.5 hours)
- BulkEmailSender.tsx (1.5 hours)

### Session 2 (2-3 hours)
- BatchModeration.tsx (1.5 hours)
- CsvExportImport.tsx (1.5 hours)

### Session 3 (1-2 hours)
- page.tsx (30 min)
- Integration testing (1 hour)
- Bug fixes and polish (30 min)

**Total**: 6-9 hours to complete Bulk Operations module

---

## Success Metrics

Bulk Operations module is complete when:

1. All 8 files created and functional
2. All tabs working without errors
3. All API endpoints successfully integrated
4. User can:
   - Select and ban/suspend/verify users
   - Send bulk emails with preview
   - Moderate content in batches
   - Export/import CSV data
   - View operation history and progress
5. Error handling works for all failure scenarios
6. Loading states display correctly
7. Toast notifications appear for all actions
8. Responsive design verified on all screen sizes
9. No TypeScript errors
10. No console errors in browser

---

## Next Steps After Completion

1. Update claudedocs/ADMIN_PORTAL_SPRINT_3_PROGRESS.md
2. Test full workflow end-to-end
3. Document any API issues or backend bugs found
4. Create ADMIN_PORTAL_SPRINT_3_ACTIVITY_LOGS.md for next module
5. Commit progress with descriptive message

---

**Status**: Ready to continue implementation
**Current Progress**: 25% complete (2/8 files)
**Next Milestone**: Fully functional Bulk Operations module
**Estimated Completion**: 6-9 hours of focused development

Let's complete Sprint 3 frontend! 🚀
