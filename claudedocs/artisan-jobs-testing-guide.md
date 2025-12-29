# Artisan Jobs Page - Testing Guide for Quality Engineer

## Overview
Comprehensive testing recommendations for the Artisan Jobs Discovery page (`frontend/src/app/artisan/jobs/page.tsx`).

## Test Strategy

### 1. Unit Tests (Jest + React Testing Library)

Location: `frontend/src/app/artisan/jobs/__tests__/page.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobDiscovery from '../page'
import { api } from '@/lib/api'

jest.mock('@/lib/api')
jest.mock('@/components/artisan/ArtisanNavbar', () => ({
  ArtisanNavbar: () => <div>Mocked Navbar</div>
}))

describe('JobDiscovery Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    test('renders loading state initially', () => {
      render(<JobDiscovery />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getAllByTestId('skeleton-card')).toHaveLength(6)
    })

    test('renders page title and description', async () => {
      mockApiSuccess()
      render(<JobDiscovery />)

      await waitFor(() => {
        expect(screen.getByText('Job Discovery')).toBeInTheDocument()
        expect(screen.getByText('Find jobs that match your skills and location')).toBeInTheDocument()
      })
    })
  })

  describe('Job Fetching', () => {
    test('fetches and displays jobs on mount', async () => {
      const mockJobs = createMockJobs(5)
      api.get.mockResolvedValueOnce({ data: { jobs: mockJobs } })

      render(<JobDiscovery />)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/jobs', {
          params: { status: 'OPEN', includeLocation: true, limit: 50 }
        })
        expect(screen.getAllByRole('article')).toHaveLength(5)
      })
    })

    test('displays error message on API failure', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'))

      render(<JobDiscovery />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Failed to load jobs. Please try again.')).toBeInTheDocument()
      })
    })

    test('retry button refetches jobs', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'))
      api.get.mockResolvedValueOnce({ data: { jobs: createMockJobs(3) } })

      render(<JobDiscovery />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledTimes(2)
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Filtering', () => {
    beforeEach(async () => {
      const mockJobs = [
        createMockJob({ category: 'Plumbing', budget: 800, urgency: 'URGENT' }),
        createMockJob({ category: 'Electrical', budget: 1200, urgency: 'MEDIUM' }),
        createMockJob({ category: 'Carpentry', budget: 8500, urgency: 'LOW' }),
      ]
      api.get.mockResolvedValue({ data: { jobs: mockJobs } })
      render(<JobDiscovery />)
      await waitFor(() => screen.getAllByRole('article'))
    })

    test('filters by category', async () => {
      const showFiltersBtn = screen.getByRole('button', { name: /show filters/i })
      fireEvent.click(showFiltersBtn)

      const categorySelect = screen.getByLabelText(/category/i)
      await userEvent.selectOptions(categorySelect, 'Plumbing')

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(1)
        expect(screen.getByText('Kitchen Sink Repair')).toBeInTheDocument()
      })
    })

    test('filters by budget range', async () => {
      fireEvent.click(screen.getByRole('button', { name: /show filters/i }))

      const minBudget = screen.getByLabelText(/min budget/i)
      const maxBudget = screen.getByLabelText(/max budget/i)

      await userEvent.clear(minBudget)
      await userEvent.type(minBudget, '1000')
      await userEvent.clear(maxBudget)
      await userEvent.type(maxBudget, '5000')

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(1)
      })
    })

    test('filters by urgency level', async () => {
      fireEvent.click(screen.getByRole('button', { name: /show filters/i }))

      const urgentBtn = screen.getByRole('button', { name: /filter by urgent urgency/i })
      fireEvent.click(urgentBtn)

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(1)
        expect(urgentBtn).toHaveAttribute('aria-pressed', 'true')
      })
    })

    test('combines multiple filters', async () => {
      fireEvent.click(screen.getByRole('button', { name: /show filters/i }))

      await userEvent.selectOptions(screen.getByLabelText(/category/i), 'Plumbing')
      fireEvent.click(screen.getByRole('button', { name: /filter by urgent urgency/i }))

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(1)
      })
    })

    test('clear filters resets all filters', async () => {
      fireEvent.click(screen.getByRole('button', { name: /show filters/i }))

      await userEvent.selectOptions(screen.getByLabelText(/category/i), 'Plumbing')
      fireEvent.click(screen.getByRole('button', { name: /clear filters/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/category/i)).toHaveValue('All Categories')
        expect(screen.getAllByRole('article')).toHaveLength(3)
      })
    })
  })

  describe('Search Functionality', () => {
    test('searches jobs by title', async () => {
      const mockJobs = [
        createMockJob({ title: 'Kitchen Sink Repair', description: 'Fix sink' }),
        createMockJob({ title: 'Electrical Work', description: 'Install outlets' }),
      ]
      api.get.mockResolvedValue({ data: { jobs: mockJobs } })
      render(<JobDiscovery />)
      await waitFor(() => screen.getAllByRole('article'))

      const searchInput = screen.getByRole('searchbox', { name: /search jobs/i })
      await userEvent.type(searchInput, 'kitchen')

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(1)
        expect(screen.getByText('Kitchen Sink Repair')).toBeInTheDocument()
      })
    })

    test('searches jobs by description', async () => {
      const mockJobs = [
        createMockJob({ title: 'Job 1', description: 'plumbing work needed' }),
        createMockJob({ title: 'Job 2', description: 'electrical installation' }),
      ]
      api.get.mockResolvedValue({ data: { jobs: mockJobs } })
      render(<JobDiscovery />)
      await waitFor(() => screen.getAllByRole('article'))

      const searchInput = screen.getByRole('searchbox')
      await userEvent.type(searchInput, 'plumbing')

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(1)
      })
    })

    test('shows no results message for non-matching search', async () => {
      api.get.mockResolvedValue({ data: { jobs: createMockJobs(3) } })
      render(<JobDiscovery />)
      await waitFor(() => screen.getAllByRole('article'))

      const searchInput = screen.getByRole('searchbox')
      await userEvent.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.queryAllByRole('article')).toHaveLength(0)
        expect(screen.getByText(/no jobs match your filters/i)).toBeInTheDocument()
      })
    })
  })

  describe('Job Statistics', () => {
    test('displays correct job counts', async () => {
      const mockJobs = [
        createMockJob({ urgency: 'URGENT', budget: 6000 }),
        createMockJob({ urgency: 'MEDIUM', budget: 1200 }),
        createMockJob({ urgency: 'URGENT', budget: 8000 }),
      ]
      api.get.mockResolvedValue({ data: { jobs: mockJobs } })
      render(<JobDiscovery />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Available Jobs
        expect(screen.getByText('2')).toBeInTheDocument() // Urgent
        expect(screen.getByText('2')).toBeInTheDocument() // High Budget (>= 5000)
      })
    })
  })

  describe('Saved Jobs', () => {
    test('saves a job when bookmark clicked', async () => {
      api.get.mockResolvedValue({ data: { jobs: createMockJobs(2) } })
      render(<JobDiscovery />)
      await waitFor(() => screen.getAllByRole('article'))

      const jobCard = screen.getAllByRole('article')[0]
      await userEvent.hover(jobCard)

      const saveButton = within(jobCard).getByRole('button', { name: /save job/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // Saved count
        expect(saveButton).toHaveAttribute('aria-label', 'Remove from saved jobs')
      })
    })

    test('unsaves a job when clicked again', async () => {
      api.get.mockResolvedValue({ data: { jobs: createMockJobs(1) } })
      render(<JobDiscovery />)
      await waitFor(() => screen.getByRole('article'))

      const saveButton = screen.getByRole('button', { name: /save job/i })

      // Save
      fireEvent.click(saveButton)
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())

      // Unsave
      fireEvent.click(saveButton)
      await waitFor(() => expect(screen.getByText('0')).toBeInTheDocument())
    })
  })
})

// Helper functions
function createMockJob(overrides = {}) {
  return {
    id: Math.random().toString(),
    title: 'Test Job',
    description: 'Test description',
    category: 'Plumbing',
    budget: 1000,
    location: 'Johannesburg',
    urgency: 'MEDIUM',
    status: 'OPEN',
    distance: 10,
    postedAt: new Date().toISOString(),
    requiresVerification: false,
    client: {
      name: 'Test Client',
      rating: 4.5,
      completedJobs: 10,
      isVerified: true
    },
    ...overrides
  }
}

function createMockJobs(count) {
  return Array.from({ length: count }, (_, i) => createMockJob({ id: i.toString() }))
}
```

### 2. Accessibility Tests

Location: `frontend/src/app/artisan/jobs/__tests__/accessibility.test.tsx`

```typescript
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import JobDiscovery from '../page'

expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  test('page has no accessibility violations', async () => {
    const { container } = render(<JobDiscovery />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('all interactive elements have accessible names', async () => {
    const { getAllByRole } = render(<JobDiscovery />)

    const buttons = getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName()
    })
  })

  test('form inputs have associated labels', async () => {
    const { getByLabelText } = render(<JobDiscovery />)

    expect(getByLabelText(/category/i)).toBeInTheDocument()
    expect(getByLabelText(/min budget/i)).toBeInTheDocument()
    expect(getByLabelText(/max budget/i)).toBeInTheDocument()
  })

  test('heading hierarchy is correct', async () => {
    const { container } = render(<JobDiscovery />)

    const h1 = container.querySelectorAll('h1')
    const h2 = container.querySelectorAll('h2')
    const h3 = container.querySelectorAll('h3')

    expect(h1).toHaveLength(1)
    expect(h2.length).toBeGreaterThan(0)
    expect(h3.length).toBeGreaterThan(0)
  })

  test('ARIA attributes are correctly applied', () => {
    const { getByRole } = render(<JobDiscovery />)

    const filterButton = getByRole('button', { name: /show filters/i })
    expect(filterButton).toHaveAttribute('aria-expanded')
    expect(filterButton).toHaveAttribute('aria-label')
  })
})
```

### 3. E2E Tests (Playwright)

Location: `tests/e2e/artisan-jobs.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Artisan Jobs Discovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/artisan/jobs')
    await page.waitForLoadState('networkidle')
  })

  test('displays job listings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Job Discovery' })).toBeVisible()

    const jobCards = page.locator('[role="article"]')
    await expect(jobCards).toHaveCount.toBeGreaterThan(0)
  })

  test('filters jobs by category', async ({ page }) => {
    await page.click('button:has-text("Show Filters")')
    await page.selectOption('#category-filter', 'Plumbing')

    await page.waitForTimeout(500) // Wait for filter to apply

    const categoryBadges = page.locator('text=Plumbing')
    await expect(categoryBadges.first()).toBeVisible()
  })

  test('searches for jobs', async ({ page }) => {
    await page.fill('input[type="search"]', 'kitchen')
    await page.waitForTimeout(500)

    const results = page.locator('[role="article"]')
    const count = await results.count()
    expect(count).toBeGreaterThan(0)
  })

  test('saves and unsaves a job', async ({ page }) => {
    const firstJob = page.locator('[role="article"]').first()
    await firstJob.hover()

    const saveButton = firstJob.locator('button[aria-label*="Save"]')
    await saveButton.click()

    // Check saved count increased
    const savedCount = page.locator('text=Saved').locator('xpath=following-sibling::*')
    await expect(savedCount).not.toHaveText('0')

    // Unsave
    await saveButton.click()
    await expect(savedCount).toHaveText('0')
  })

  test('navigates to job details', async ({ page }) => {
    const viewDetailsButton = page.locator('button:has-text("View Details")').first()
    await viewDetailsButton.click()

    // Should navigate to job details page (when implemented)
    // await expect(page).toHaveURL(/\/artisan\/jobs\/[^\/]+/)
  })

  test('responsive design works on mobile', async ({ page, viewport }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await expect(page.getByRole('heading', { name: 'Job Discovery' })).toBeVisible()

    // Stats should stack vertically
    const stats = page.locator('.grid-cols-2')
    await expect(stats).toBeVisible()
  })

  test('keyboard navigation works', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab') // First button
    await page.keyboard.press('Tab') // Second button

    // Check focus is visible
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
  })

  test('error recovery works', async ({ page, context }) => {
    // Simulate network failure
    await context.route('**/api/jobs*', route => route.abort())

    await page.reload()
    await expect(page.getByRole('alert')).toBeVisible()

    // Click retry
    await context.unroute('**/api/jobs*')
    await page.click('button:has-text("Try Again")')

    await expect(page.locator('[role="article"]')).toHaveCount.toBeGreaterThan(0)
  })
})
```

### 4. Performance Tests

```typescript
test.describe('Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/artisan/jobs')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000) // 3 seconds
  })

  test('filtering is fast', async ({ page }) => {
    await page.goto('/artisan/jobs')
    await page.waitForLoadState('networkidle')

    const startTime = Date.now()
    await page.fill('input[type="search"]', 'test')
    await page.waitForTimeout(100)
    const filterTime = Date.now() - startTime

    expect(filterTime).toBeLessThan(500) // 500ms
  })

  test('no memory leaks on repeated filtering', async ({ page }) => {
    await page.goto('/artisan/jobs')

    const initialMemory = await page.evaluate(() => performance.memory.usedJSHeapSize)

    // Apply and clear filters 10 times
    for (let i = 0; i < 10; i++) {
      await page.fill('input[type="search"]', 'test')
      await page.waitForTimeout(100)
      await page.click('button:has-text("Clear Filters")')
      await page.waitForTimeout(100)
    }

    const finalMemory = await page.evaluate(() => performance.memory.usedJSHeapSize)
    const memoryIncrease = finalMemory - initialMemory

    // Memory shouldn't increase by more than 5MB
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
  })
})
```

## Test Execution Commands

```bash
# Unit tests
npm test -- src/app/artisan/jobs

# Accessibility tests
npm test -- src/app/artisan/jobs/__tests__/accessibility.test.tsx

# E2E tests
npx playwright test tests/e2e/artisan-jobs.spec.ts

# Performance tests
npx playwright test tests/e2e/artisan-jobs.spec.ts --project=chromium --headed

# All tests with coverage
npm test -- --coverage src/app/artisan/jobs
```

## Test Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 80%
- **Statement Coverage**: > 80%

## Manual Testing Checklist

### Functional Testing
- [ ] Jobs load correctly on page mount
- [ ] Loading skeleton displays during fetch
- [ ] Error handling works for API failures
- [ ] Retry button refetches jobs
- [ ] All filters work individually
- [ ] Multiple filters work together
- [ ] Clear filters resets all filters
- [ ] Search filters jobs in real-time
- [ ] Saved searches display and work
- [ ] Save/unsave job functionality works
- [ ] Job statistics display correctly
- [ ] Currency formats correctly (ZAR)
- [ ] Time displays relative format
- [ ] Distance displays in kilometers
- [ ] All buttons trigger correct actions

### Accessibility Testing
- [ ] Keyboard navigation works for all controls
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Screen reader announces content correctly
- [ ] All images have alt text or aria-hidden
- [ ] Form inputs have associated labels
- [ ] Error messages are announced
- [ ] Button labels are descriptive
- [ ] Heading hierarchy is correct
- [ ] Color contrast meets WCAG AA standards

### Responsive Design Testing
- [ ] Layout works on mobile (320px-767px)
- [ ] Layout works on tablet (768px-1023px)
- [ ] Layout works on desktop (1024px+)
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable on all screen sizes
- [ ] Images scale appropriately
- [ ] Filters collapse on mobile
- [ ] Grid adjusts columns correctly
- [ ] Navigation works on all sizes

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Android (latest)

### Performance Testing
- [ ] Page loads in < 3 seconds
- [ ] No layout shifts during load
- [ ] Smooth scrolling
- [ ] Filter changes are instant
- [ ] No janky animations
- [ ] Images load efficiently
- [ ] No console errors

## Known Issues / Limitations

1. Map view not yet implemented
2. Bid submission modal needs implementation
3. Job details page link non-functional
4. Saved searches not persisted to backend
5. Saved jobs not persisted to backend
6. Mock data used as fallback

## Quality Metrics

### Target Metrics
- Lighthouse Performance: > 90
- Lighthouse Accessibility: 100
- Lighthouse Best Practices: > 95
- Lighthouse SEO: > 90
- Web Vitals: All green

## Continuous Integration

Add to CI pipeline:
```yaml
# .github/workflows/test.yml
test-artisan-jobs:
  - name: Run unit tests
    run: npm test -- src/app/artisan/jobs

  - name: Run accessibility tests
    run: npm test -- accessibility

  - name: Run E2E tests
    run: npx playwright test tests/e2e/artisan-jobs.spec.ts
```

## Reporting

Generate test reports:
```bash
# Coverage report
npm test -- --coverage --coverageReporters=html

# Accessibility report
npm run test:a11y -- --reporter=html

# E2E test report
npx playwright test --reporter=html
```

## Contact

For testing questions or issues:
- Review implementation report: `claudedocs/artisan-jobs-implementation-report.md`
- Check component file: `frontend/src/app/artisan/jobs/page.tsx`
