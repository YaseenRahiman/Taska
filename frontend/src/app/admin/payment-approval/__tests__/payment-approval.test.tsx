/**
 * Payment Approval UI Comprehensive Test Suite
 * 
 * Tests for:
 * - Component rendering
 * - API integration
 * - User interactions
 * - Validation rules
 * - Error handling
 * - Accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';
import PaymentApprovalPage from '../page';
import PendingPaymentsList from '../PendingPaymentsList';
import PaymentDetailModal from '../PaymentDetailModal';
import RiskScoreVisualization from '../RiskScoreVisualization';
import ApprovalActions from '../ApprovalActions';
import paymentApprovalService from '@/lib/api/payment-approval';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('@/lib/api/payment-approval');

const mockService = paymentApprovalService as jest.Mocked<typeof paymentApprovalService>;

const mockPayment = {
  id: 'pay_123',
  amount: 5000,
  currency: 'ZAR',
  status: 'PENDING' as const,
  clientId: 'c1',
  artisanId: 'a1',
  jobId: 'j1',
  client: { id: 'c1', email: 'client@test.com', name: 'John', phone: '123', totalJobs: 5, totalSpent: 25000, accountAge: 365, verificationStatus: true },
  artisan: { id: 'a1', email: 'artisan@test.com', name: 'Jane', phone: '456', completedJobs: 50, totalEarned: 100000, rating: 4.8, accountAge: 730, verificationStatus: true },
  job: { id: 'j1', title: 'Test Job', description: 'Test', category: 'Testing', status: 'COMPLETED', createdAt: '2025-01-01', budget: 5000 },
  riskScore: { overall: 35, level: 'LOW' as const, factors: [], recommendation: 'Safe' },
  flaggedAt: '2025-01-15T10:00:00Z',
  createdAt: '2025-01-15T09:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

const mockStats = {
  pending: 15,
  approved: 120,
  rejected: 8,
  held: 3,
  totalAmount: 500000,
  averageRiskScore: 42,
  highRiskCount: 5,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockService.getAllPayments.mockResolvedValue({
    payments: [mockPayment],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  mockService.getStats.mockResolvedValue(mockStats);
});

describe('PaymentApprovalPage', () => {
  it('renders with statistics', async () => {
    render(<PaymentApprovalPage />);
    await waitFor(() => {
      expect(screen.getByText('Payment Approval Queue')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('auto-refreshes every 30 seconds', async () => {
    jest.useFakeTimers();
    render(<PaymentApprovalPage />);
    await waitFor(() => expect(mockService.getAllPayments).toHaveBeenCalledTimes(1));
    jest.advanceTimersByTime(30000);
    await waitFor(() => expect(mockService.getAllPayments).toHaveBeenCalledTimes(2));
    jest.useRealTimers();
  });
});

describe('PendingPaymentsList', () => {
  it('renders payment list', () => {
    render(<PendingPaymentsList payments={[mockPayment]} loading={false} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(<PendingPaymentsList payments={[]} loading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<PendingPaymentsList payments={[]} loading={false} />);
    expect(screen.getByText('No payments found')).toBeInTheDocument();
  });

  it('handles selection', () => {
    const onChange = jest.fn();
    render(<PendingPaymentsList payments={[mockPayment]} onSelectionChange={onChange} selectedPaymentIds={[]} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    expect(onChange).toHaveBeenCalledWith([mockPayment.id]);
  });
});

describe('PaymentDetailModal', () => {
  beforeEach(() => {
    mockService.getPaymentDetails.mockResolvedValue(mockPayment);
  });

  it('loads payment details', async () => {
    render(<PaymentDetailModal paymentId={mockPayment.id} isOpen={true} onClose={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('Payment Details')).toBeInTheDocument());
  });

  it('handles close', async () => {
    const onClose = jest.fn();
    render(<PaymentDetailModal paymentId={mockPayment.id} isOpen={true} onClose={onClose} />);
    const closeBtn = await screen.findByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('RiskScoreVisualization', () => {
  const riskScore = { overall: 25, level: 'LOW' as const, factors: [], recommendation: 'Low risk' };

  it('renders compact view', () => {
    render(<RiskScoreVisualization riskScore={riskScore} compact={true} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders full view', () => {
    render(<RiskScoreVisualization riskScore={riskScore} />);
    expect(screen.getByText('Risk Score')).toBeInTheDocument();
  });
});

describe('ApprovalActions', () => {
  beforeEach(() => {
    mockService.approvePayment.mockResolvedValue({ payment: mockPayment, message: 'Approved' });
    mockService.rejectPayment.mockResolvedValue({ payment: mockPayment, message: 'Rejected' });
  });

  it('renders action buttons', () => {
    render(<ApprovalActions payment={mockPayment} />);
    expect(screen.getByText('Approve Payment')).toBeInTheDocument();
    expect(screen.getByText('Reject Payment')).toBeInTheDocument();
  });

  it('handles approve', async () => {
    const onSuccess = jest.fn();
    render(<ApprovalActions payment={mockPayment} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByText('Approve Payment'));
    const confirm = await screen.findByText('Confirm Approval');
    fireEvent.click(confirm);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('validates rejection reason', async () => {
    render(<ApprovalActions payment={mockPayment} />);
    fireEvent.click(screen.getByText('Reject Payment'));
    const input = await screen.findByPlaceholderText(/explain why/i);
    fireEvent.change(input, { target: { value: 'Short' } });
    fireEvent.click(screen.getByText('Confirm Rejection'));
    await waitFor(() => expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument());
  });
});
