import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';
import EscrowConfigPage from '../page';
import SettingsForm from '../SettingsForm';
import ActiveHoldsTable from '../ActiveHoldsTable';
import ReleaseModal from '../ReleaseModal';
import RefundModal from '../RefundModal';
import AnalyticsDashboard from '../AnalyticsDashboard';
import escrowConfigService from '@/lib/api/escrow-config';
import type { EscrowConfig, EscrowHold, EscrowAnalytics } from '@/types/escrow-config.types';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('@/lib/api/escrow-config');

const mockEscrowConfig: EscrowConfig = {
  id: 'config-1',
  autoReleaseEnabled: true,
  autoReleaseDays: 30,
  defaultHoldDuration: 14,
  maxHoldDuration: 90,
  disputeWindowEnabled: true,
  disputeWindowDays: 7,
  feePercentage: 2.5,
  minHoldAmount: 100,
  maxHoldAmount: 100000,
  updatedAt: '2025-01-15T10:00:00Z',
  updatedBy: 'admin@taska.com',
};

const mockEscrowHold: EscrowHold = {
  id: 'hold-1',
  paymentId: 'payment-1',
  amount: 5000,
  currency: 'ZAR',
  clientId: 'client-1',
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  artisanId: 'artisan-1',
  artisanName: 'Jane Smith',
  artisanEmail: 'jane@example.com',
  jobId: 'job-1',
  jobTitle: 'Kitchen Renovation',
  holdDate: '2025-01-01T00:00:00Z',
  expectedReleaseDate: '2025-01-15T00:00:00Z',
  status: 'ACTIVE',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockAnalytics: EscrowAnalytics = {
  totalHolds: { count: 100, totalAmount: 500000 },
  activeHolds: { count: 25, totalAmount: 125000 },
  releasedThisMonth: { count: 15, totalAmount: 75000 },
  refundedThisMonth: { count: 5, totalAmount: 25000 },
  averageHoldDuration: 12.5,
  holdsOverTime: [],
  holdsByStatus: [
    { status: 'ACTIVE', count: 25, totalAmount: 125000, percentage: 25 },
    { status: 'RELEASED', count: 60, totalAmount: 300000, percentage: 60 },
    { status: 'REFUNDED', count: 15, totalAmount: 75000, percentage: 15 },
  ],
  releaseReasons: [
    { reason: 'Job completed successfully', count: 50, percentage: 83.3 },
    { reason: 'Client approved work', count: 10, percentage: 16.7 },
  ],
  refundReasons: [
    { reason: 'Job cancelled by client', count: 10, percentage: 66.7 },
    { reason: 'Work not satisfactory', count: 5, percentage: 33.3 },
  ],
};

describe('EscrowConfigPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page with tabs', () => {
    render(<EscrowConfigPage />);

    expect(screen.getByText('Escrow Configuration')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /active holds/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
  });

  it('should switch tabs when clicked', async () => {
    render(<EscrowConfigPage />);

    const holdsTab = screen.getByRole('tab', { name: /active holds/i });
    fireEvent.click(holdsTab);

    await waitFor(() => {
      expect(holdsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should support keyboard navigation with Alt+1-3', () => {
    render(<EscrowConfigPage />);

    const settingsTab = screen.getByRole('tab', { name: /settings/i });

    fireEvent.keyDown(window, { altKey: true, key: '2' });

    expect(settingsTab).toHaveAttribute('aria-selected', 'false');
  });
});

describe('SettingsForm', () => {
  beforeEach(() => {
    (escrowConfigService.getConfig as jest.Mock).mockResolvedValue(mockEscrowConfig);
  });

  it('should load and display current configuration', async () => {
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/days until auto-release/i)).toHaveValue(30);
      expect(screen.getByLabelText(/default hold duration/i)).toHaveValue(14);
      expect(screen.getByLabelText(/maximum hold duration/i)).toHaveValue(90);
    });
  });

  it('should validate auto-release days range (1-90)', async () => {
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/days until auto-release/i)).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/days until auto-release/i);

    await userEvent.clear(input);
    await userEvent.type(input, '100');

    await waitFor(() => {
      expect(screen.getByText(/must be between 1 and 90/i)).toBeInTheDocument();
    });
  });

  it('should validate default duration cannot exceed max duration', async () => {
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/default hold duration/i)).toBeInTheDocument();
    });

    const defaultInput = screen.getByLabelText(/default hold duration/i);
    const maxInput = screen.getByLabelText(/maximum hold duration/i);

    await userEvent.clear(defaultInput);
    await userEvent.type(defaultInput, '100');

    await userEvent.clear(maxInput);
    await userEvent.type(maxInput, '50');

    await waitFor(() => {
      expect(screen.getByText(/maximum duration must be greater/i)).toBeInTheDocument();
    });
  });

  it('should save configuration successfully', async () => {
    (escrowConfigService.updateConfig as jest.Mock).mockResolvedValue(mockEscrowConfig);

    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/fee percentage/i)).toBeInTheDocument();
    });

    const feeInput = screen.getByLabelText(/fee percentage/i);
    await userEvent.clear(feeInput);
    await userEvent.type(feeInput, '3.5');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(escrowConfigService.updateConfig).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('updated successfully'));
    });
  });

  it('should reset form to original values', async () => {
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/fee percentage/i)).toBeInTheDocument();
    });

    const feeInput = screen.getByLabelText(/fee percentage/i);
    await userEvent.clear(feeInput);
    await userEvent.type(feeInput, '5.0');

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(feeInput).toHaveValue(2.5);
    });
  });
});

describe('ActiveHoldsTable', () => {
  beforeEach(() => {
    (escrowConfigService.getHolds as jest.Mock).mockResolvedValue({
      holds: [mockEscrowHold],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });

  it('should load and display escrow holds', async () => {
    render(<ActiveHoldsTable />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });
  });

  it('should filter holds by status', async () => {
    render(<ActiveHoldsTable />);

    await waitFor(() => {
      expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/filter by status/i);
    fireEvent.change(statusFilter, { target: { value: 'RELEASED' } });

    await waitFor(() => {
      expect(escrowConfigService.getHolds).toHaveBeenCalledWith(
        1,
        20,
        { status: 'RELEASED' },
        expect.any(Object)
      );
    });
  });

  it('should sort holds by amount', async () => {
    render(<ActiveHoldsTable />);

    await waitFor(() => {
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
    });

    const amountHeader = screen.getByText(/amount/i);
    fireEvent.click(amountHeader);

    await waitFor(() => {
      expect(escrowConfigService.getHolds).toHaveBeenCalledWith(
        1,
        20,
        undefined,
        { field: 'amount', direction: 'asc' }
      );
    });
  });

  it('should open release modal when release button clicked', async () => {
    render(<ActiveHoldsTable />);

    await waitFor(() => {
      expect(screen.getByText('Release')).toBeInTheDocument();
    });

    const releaseButton = screen.getByText('Release');
    fireEvent.click(releaseButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /release escrow hold/i })).toBeInTheDocument();
    });
  });

  it('should export holds to CSV', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/csv' });
    (escrowConfigService.exportHolds as jest.Mock).mockResolvedValue(mockBlob);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:test');

    render(<ActiveHoldsTable />);

    await waitFor(() => {
      expect(screen.getByText(/export csv/i)).toBeInTheDocument();
    });

    const exportButton = screen.getByText(/export csv/i);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(escrowConfigService.exportHolds).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Export completed'));
    });
  });
});

describe('ReleaseModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display hold details', () => {
    render(
      <ReleaseModal
        hold={mockEscrowHold}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    expect(screen.getByText(/kitchen renovation/i)).toBeInTheDocument();
  });

  it('should release hold successfully', async () => {
    (escrowConfigService.releaseHold as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Hold released',
    });

    render(
      <ReleaseModal
        hold={mockEscrowHold}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const releaseButton = screen.getByRole('button', { name: /release funds/i });
    fireEvent.click(releaseButton);

    await waitFor(() => {
      expect(escrowConfigService.releaseHold).toHaveBeenCalledWith(
        mockEscrowHold.id,
        expect.any(Object)
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('should allow optional release reason', async () => {
    render(
      <ReleaseModal
        hold={mockEscrowHold}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const reasonInput = screen.getByLabelText(/release reason/i);
    await userEvent.type(reasonInput, 'Job completed successfully');

    expect(reasonInput).toHaveValue('Job completed successfully');
  });

  it('should close modal when cancel clicked', () => {
    render(
      <ReleaseModal
        hold={mockEscrowHold}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('RefundModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require refund reason', async () => {
    render(
      <RefundModal
        hold={mockEscrowHold}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const refundButton = screen.getByRole('button', { name: /process refund/i });
    fireEvent.click(refundButton);

    await waitFor(() => {
      expect(screen.getByText(/refund reason is required/i)).toBeInTheDocument();
    });
  });

  it('should validate minimum reason length (10 chars)', async () => {
    render(
      <RefundModal
        hold={mockEscrowHold}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const reasonInput = screen.getByLabelText(/refund reason/i);
    await userEvent.type(reasonInput, 'Short');

    const refundButton = screen.getByRole('button', { name: /process refund/i });
    fireEvent.click(refundButton);

    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('should support partial refund', async () => {
    render(
      <RefundModal
        hold={mockEscrowHold}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const partialToggle = screen.getByRole('switch', { name: /partial refund/i });
    fireEvent.click(partialToggle);

    await waitFor(() => {
      expect(screen.getByLabelText(/refund amount/i)).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/refund amount/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '2500');

    expect(amountInput).toHaveValue(2500);
  });

  it('should validate partial refund does not exceed hold amount', async () => {
    render(
      <RefundModal
        hold={mockEscrowHold}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const partialToggle = screen.getByRole('switch', { name: /partial refund/i });
    fireEvent.click(partialToggle);

    const amountInput = screen.getByLabelText(/refund amount/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '10000');

    const refundButton = screen.getByRole('button', { name: /process refund/i });
    fireEvent.click(refundButton);

    await waitFor(() => {
      expect(screen.getByText(/cannot exceed/i)).toBeInTheDocument();
    });
  });

  it('should refund hold successfully', async () => {
    (escrowConfigService.refundHold as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Hold refunded',
    });

    render(
      <RefundModal
        hold={mockEscrowHold}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const reasonInput = screen.getByLabelText(/refund reason/i);
    await userEvent.type(reasonInput, 'Client cancelled the job');

    const refundButton = screen.getByRole('button', { name: /process refund/i });
    fireEvent.click(refundButton);

    await waitFor(() => {
      expect(escrowConfigService.refundHold).toHaveBeenCalledWith(
        mockEscrowHold.id,
        expect.objectContaining({
          reason: 'Client cancelled the job',
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });
});

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    (escrowConfigService.getAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);
  });

  it('should load and display analytics data', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Total holds count
      expect(screen.getByText('25')).toBeInTheDocument(); // Active holds count
      expect(screen.getByText(/12.5 days/i)).toBeInTheDocument(); // Average duration
    });
  });

  it('should filter analytics by date range', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select date range/i)).toBeInTheDocument();
    });

    const dateRangeSelect = screen.getByLabelText(/select date range/i);
    fireEvent.change(dateRangeSelect, { target: { value: '7d' } });

    await waitFor(() => {
      expect(escrowConfigService.getAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: expect.any(String),
          toDate: expect.any(String),
        })
      );
    });
  });

  it('should display status breakdown', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/holds by status/i)).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('RELEASED')).toBeInTheDocument();
      expect(screen.getByText('REFUNDED')).toBeInTheDocument();
    });
  });

  it('should refresh analytics data', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText(/refresh analytics/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/refresh analytics/i);
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(escrowConfigService.getAnalytics).toHaveBeenCalledTimes(2);
    });
  });
});
