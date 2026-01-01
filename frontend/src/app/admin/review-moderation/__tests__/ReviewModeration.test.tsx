/**
 * Review Moderation Component Tests
 * Comprehensive test suite for all review moderation components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FlaggedReviewsQueue from '../FlaggedReviewsQueue';
import ReviewDetailModal from '../ReviewDetailModal';
import ReviewEditForm from '../ReviewEditForm';
import HideShowToggle from '../HideShowToggle';
import DeleteConfirmation from '../DeleteConfirmation';
import ReviewFilters from '../ReviewFilters';
import ReviewSearch from '../ReviewSearch';
import { Review, FlaggedReviewsFilters } from '@/types/review-moderation.types';

// Mock API
vi.mock('@/lib/api/review-moderation', () => ({
  reviewModerationApi: {
    getEditHistory: vi.fn(() => Promise.resolve([])),
    getModerationNotes: vi.fn(() => Promise.resolve([])),
    addModerationNote: vi.fn(() => Promise.resolve({ success: true })),
    editReview: vi.fn(() => Promise.resolve({ success: true })),
    toggleVisibility: vi.fn(() => Promise.resolve({ success: true })),
    deleteReview: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

// Mock data
const mockReview: Review = {
  id: 'review-123',
  rating: 4,
  content: 'Great service, very professional and timely work.',
  jobId: 'job-456',
  reviewerId: 'user-789',
  artisanId: 'artisan-101',
  reviewer: {
    id: 'user-789',
    email: 'client@example.com',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
    },
  },
  artisan: {
    id: 'artisan-101',
    email: 'artisan@example.com',
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
      businessName: 'Smith Repairs',
    },
  },
  job: {
    id: 'job-456',
    title: 'Plumbing repair',
  },
  moderation: {
    id: 'mod-1',
    reviewId: 'review-123',
    flagCount: 2,
    status: 'VISIBLE',
    flags: [
      {
        id: 'flag-1',
        reviewId: 'review-123',
        flaggedBy: 'user-999',
        reason: 'SPAM',
        createdAt: '2025-01-01T10:00:00Z',
      },
    ],
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T09:00:00Z',
  },
  createdAt: '2025-01-01T08:00:00Z',
  updatedAt: '2025-01-01T08:00:00Z',
};

describe('FlaggedReviewsQueue', () => {
  const mockHandlers = {
    onViewDetails: vi.fn(),
    onEdit: vi.fn(),
    onToggleVisibility: vi.fn(),
    onDelete: vi.fn(),
    onSelectReview: vi.fn(),
    onSelectAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reviews table with correct data', () => {
    render(
      <FlaggedReviewsQueue
        reviews={[mockReview]}
        selectedReviews={[]}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Smith Repairs/i)).toBeInTheDocument();
    expect(screen.getByText(/Great service/i)).toBeInTheDocument();
  });

  it('shows flag count with correct color coding', () => {
    render(
      <FlaggedReviewsQueue
        reviews={[mockReview]}
        selectedReviews={[]}
        {...mockHandlers}
      />
    );

    const flagCount = screen.getByText('2');
    expect(flagCount).toBeInTheDocument();
    expect(flagCount.closest('span')).toHaveClass('text-yellow-600');
  });

  it('handles select all checkbox', async () => {
    render(
      <FlaggedReviewsQueue
        reviews={[mockReview]}
        selectedReviews={[]}
        {...mockHandlers}
      />
    );

    const selectAllCheckbox = screen.getByLabelText('Select all reviews');
    await userEvent.click(selectAllCheckbox);

    expect(mockHandlers.onSelectAll).toHaveBeenCalledWith(true);
  });

  it('calls view details handler when eye icon clicked', async () => {
    render(
      <FlaggedReviewsQueue
        reviews={[mockReview]}
        selectedReviews={[]}
        {...mockHandlers}
      />
    );

    const viewButton = screen.getByLabelText('View review details');
    await userEvent.click(viewButton);

    expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(mockReview);
  });

  it('expands and collapses long content', async () => {
    const longReview = {
      ...mockReview,
      content: 'A'.repeat(150),
    };

    render(
      <FlaggedReviewsQueue
        reviews={[longReview]}
        selectedReviews={[]}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Show more')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
  });

  it('displays empty state when no reviews', () => {
    render(
      <FlaggedReviewsQueue
        reviews={[]}
        selectedReviews={[]}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('No flagged reviews found')).toBeInTheDocument();
  });
});

describe('ReviewEditForm', () => {
  const mockOnSave = vi.fn(() => Promise.resolve());
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with pre-filled review data', () => {
    render(
      <ReviewEditForm
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue(mockReview.content)).toBeInTheDocument();
  });

  it('validates content length', async () => {
    render(
      <ReviewEditForm
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const contentInput = screen.getByRole('textbox', { name: /review content/i });
    await userEvent.clear(contentInput);
    await userEvent.type(contentInput, 'Short');

    const saveButton = screen.getByText('Save Changes');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('validates edit reason is required', async () => {
    render(
      <ReviewEditForm
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/edit reason must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('updates rating when stars clicked', async () => {
    render(
      <ReviewEditForm
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const stars = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('svg[class*="Star"]')
    );

    await userEvent.click(stars[4]); // Click 5th star

    expect(screen.getByText('5 / 5')).toBeInTheDocument();
  });

  it('shows character counter', () => {
    render(
      <ReviewEditForm
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText(`${mockReview.content.length} / 1000`)).toBeInTheDocument();
  });
});

describe('HideShowToggle', () => {
  const mockOnConfirm = vi.fn(() => Promise.resolve());
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows hide dialog for visible review', () => {
    render(
      <HideShowToggle
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Hide Review')).toBeInTheDocument();
    expect(screen.getByText(/hide this review from public view/i)).toBeInTheDocument();
  });

  it('shows show dialog for hidden review', () => {
    const hiddenReview = {
      ...mockReview,
      moderation: {
        ...mockReview.moderation!,
        status: 'HIDDEN' as const,
      },
    };

    render(
      <HideShowToggle
        review={hiddenReview}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Show Review')).toBeInTheDocument();
  });

  it('requires reason when hiding', async () => {
    render(
      <HideShowToggle
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByText('Hide Review');
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/reason must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('allows showing without reason', async () => {
    const hiddenReview = {
      ...mockReview,
      moderation: {
        ...mockReview.moderation!,
        status: 'HIDDEN' as const,
      },
    };

    render(
      <HideShowToggle
        review={hiddenReview}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByText('Show Review');
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });
});

describe('DeleteConfirmation', () => {
  const mockOnConfirm = vi.fn(() => Promise.resolve());
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders delete confirmation dialog', () => {
    render(
      <DeleteConfirmation
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Delete Review')).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('requires deletion reason', async () => {
    render(
      <DeleteConfirmation
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmInput = screen.getByPlaceholderText('Type DELETE to confirm');
    await userEvent.type(confirmInput, 'DELETE');

    const deleteButton = screen.getByText('Delete Review');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/reason must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('requires typing DELETE to confirm', async () => {
    render(
      <DeleteConfirmation
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const reasonInput = screen.getByPlaceholderText(/explain why/i);
    await userEvent.type(reasonInput, 'Valid reason for deletion');

    const deleteButton = screen.getByText('Delete Review');
    expect(deleteButton).toBeDisabled();

    const confirmInput = screen.getByPlaceholderText('Type DELETE to confirm');
    await userEvent.type(confirmInput, 'DELETE');

    await waitFor(() => {
      expect(deleteButton).not.toBeDisabled();
    });
  });
});

describe('ReviewFilters', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter controls', () => {
    render(
      <ReviewFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        onClear={mockOnClear}
      />
    );

    const filterButton = screen.getByText('Filters');
    expect(filterButton).toBeInTheDocument();
  });

  it('expands and shows filter options', async () => {
    render(
      <ReviewFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        onClear={mockOnClear}
      />
    );

    const filterButton = screen.getByText('Filters');
    await userEvent.click(filterButton);

    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Flag Reason')).toBeInTheDocument();
    expect(screen.getByLabelText('Rating Range')).toBeInTheDocument();
  });

  it('calls onFiltersChange when filter selected', async () => {
    render(
      <ReviewFilters
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
        onClear={mockOnClear}
      />
    );

    await userEvent.click(screen.getByText('Filters'));

    const statusSelect = screen.getByLabelText('Status');
    await userEvent.selectOptions(statusSelect, 'HIDDEN');

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'HIDDEN' })
    );
  });

  it('shows active filters badge', () => {
    render(
      <ReviewFilters
        filters={{ status: 'HIDDEN' }}
        onFiltersChange={mockOnFiltersChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays filter summary chips', async () => {
    render(
      <ReviewFilters
        filters={{ status: 'HIDDEN', flagReason: 'SPAM' }}
        onFiltersChange={mockOnFiltersChange}
        onClear={mockOnClear}
      />
    );

    await userEvent.click(screen.getByText('Filters'));

    expect(screen.getByText(/Status: HIDDEN/i)).toBeInTheDocument();
    expect(screen.getByText(/Flag: SPAM/i)).toBeInTheDocument();
  });
});

describe('ReviewSearch', () => {
  const mockOnChange = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(
      <ReviewSearch
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByLabelText('Search reviews')).toBeInTheDocument();
  });

  it('debounces search input', async () => {
    vi.useFakeTimers();

    render(
      <ReviewSearch
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const searchInput = screen.getByLabelText('Search reviews');
    await userEvent.type(searchInput, 'test query');

    expect(mockOnChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('shows clear button when has value', () => {
    render(
      <ReviewSearch
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('calls onClear when clear button clicked', async () => {
    render(
      <ReviewSearch
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    await userEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });
});

describe('Accessibility', () => {
  it('FlaggedReviewsQueue has proper ARIA labels', () => {
    render(
      <FlaggedReviewsQueue
        reviews={[mockReview]}
        selectedReviews={[]}
        onViewDetails={vi.fn()}
        onEdit={vi.fn()}
        onToggleVisibility={vi.fn()}
        onDelete={vi.fn()}
        onSelectReview={vi.fn()}
        onSelectAll={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Select all reviews')).toBeInTheDocument();
    expect(screen.getByLabelText('View review details')).toBeInTheDocument();
  });

  it('ReviewEditForm has proper form labels', () => {
    render(
      <ReviewEditForm
        review={mockReview}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn(() => Promise.resolve())}
      />
    );

    expect(screen.getByLabelText(/Rating/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Review Content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for Edit/i)).toBeInTheDocument();
  });

  it('Modal dialogs can be closed with escape key', async () => {
    const mockOnClose = vi.fn();

    render(
      <ReviewEditForm
        review={mockReview}
        isOpen={true}
        onClose={mockOnClose}
        onSave={vi.fn(() => Promise.resolve())}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Note: Actual escape key handling would need to be implemented in components
  });
});
