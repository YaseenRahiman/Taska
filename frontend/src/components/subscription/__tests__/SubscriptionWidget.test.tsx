import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionWidget from '../SubscriptionWidget';
import api from '@/lib/api';

// Mock the api module
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockClientSubscription = {
  success: true,
  data: {
    subscription: {
      id: 'sub-123',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    },
    plan: {
      id: 'free-plan',
      name: 'FREE',
      displayName: 'Free Plan',
      clientJobsPerMonth: 2,
      artisanBidsPerMonth: 5,
      pricePerMonthZar: 0,
    },
    usage: {
      jobsPerMonth: 2,
      bidsPerMonth: 5,
      jobsUsed: 1,
      bidsUsed: 0,
      jobsRemaining: 1,
      bidsRemaining: 5,
      periodStart: new Date().toISOString(),
      periodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    isSubscribed: false,
    canUpgrade: true,
  },
};

const mockArtisanSubscription = {
  success: true,
  data: {
    subscription: {
      id: 'sub-456',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    plan: {
      id: 'premium-plan',
      name: 'PREMIUM',
      displayName: 'Premium Plan',
      clientJobsPerMonth: 50,
      artisanBidsPerMonth: 100,
      pricePerMonthZar: 299,
    },
    usage: {
      jobsPerMonth: 50,
      bidsPerMonth: 100,
      jobsUsed: 0,
      bidsUsed: 45,
      jobsRemaining: 50,
      bidsRemaining: 55,
      periodStart: new Date().toISOString(),
      periodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    isSubscribed: true,
    canUpgrade: false,
  },
};

const mockLowUsageSubscription = {
  success: true,
  data: {
    subscription: {
      id: 'sub-789',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    plan: {
      id: 'free-plan',
      name: 'FREE',
      displayName: 'Free Plan',
      clientJobsPerMonth: 2,
      artisanBidsPerMonth: 5,
      pricePerMonthZar: 0,
    },
    usage: {
      jobsPerMonth: 2,
      bidsPerMonth: 5,
      jobsUsed: 2,
      bidsUsed: 4,
      jobsRemaining: 0,
      bidsRemaining: 1,
      periodStart: new Date().toISOString(),
      periodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    isSubscribed: false,
    canUpgrade: true,
  },
};

describe('SubscriptionWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading spinner initially', () => {
      (api.get as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves

      render(<SubscriptionWidget userRole="CLIENT" />);

      expect(screen.getByRole('status') || document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error message when API fails', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<SubscriptionWidget userRole="CLIENT" />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load|unable to load/i)).toBeInTheDocument();
      });
    });
  });

  describe('Client view', () => {
    it('should display job postings usage for clients', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockClientSubscription);

      render(<SubscriptionWidget userRole="CLIENT" />);

      await waitFor(() => {
        expect(screen.getByText('Free Plan')).toBeInTheDocument();
        expect(screen.getByText('Job Postings Used')).toBeInTheDocument();
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
        expect(screen.getByText('1 remaining this month')).toBeInTheDocument();
      });
    });

    it('should show upgrade CTA for free clients', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockClientSubscription);

      render(<SubscriptionWidget userRole="CLIENT" />);

      await waitFor(() => {
        expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
        expect(screen.getByText('50 job postings/month')).toBeInTheDocument();
        expect(screen.getByText('View Plans')).toBeInTheDocument();
      });
    });
  });

  describe('Artisan view', () => {
    it('should display bids usage for artisans', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockArtisanSubscription);

      render(<SubscriptionWidget userRole="ARTISAN" />);

      await waitFor(() => {
        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
        expect(screen.getByText('Bids Used')).toBeInTheDocument();
        expect(screen.getByText('45 / 100')).toBeInTheDocument();
        expect(screen.getByText('55 remaining this month')).toBeInTheDocument();
      });
    });

    it('should not show upgrade CTA for premium artisans', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockArtisanSubscription);

      render(<SubscriptionWidget userRole="ARTISAN" />);

      await waitFor(() => {
        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      });

      expect(screen.queryByText('Upgrade to Premium')).not.toBeInTheDocument();
    });
  });

  describe('Low usage warning', () => {
    it('should show warning when usage is low', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockLowUsageSubscription);

      render(<SubscriptionWidget userRole="ARTISAN" />);

      await waitFor(() => {
        expect(screen.getByText(/running low on/i)).toBeInTheDocument();
      });
    });

    it('should show upgrade suggestion in warning for free users', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockLowUsageSubscription);

      render(<SubscriptionWidget userRole="CLIENT" />);

      await waitFor(() => {
        expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument();
      });
    });
  });

  describe('Progress bar', () => {
    it('should show green progress bar when usage is low', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockClientSubscription); // 50% usage

      render(<SubscriptionWidget userRole="CLIENT" />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-primary-500');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show amber progress bar when usage is moderate', async () => {
      const moderateUsage = {
        ...mockClientSubscription,
        data: {
          ...mockClientSubscription.data,
          usage: {
            ...mockClientSubscription.data.usage,
            jobsUsed: 1,
            jobsRemaining: 0,
            jobsPerMonth: 1, // 100% = 1/1
          },
          plan: {
            ...mockClientSubscription.data.plan,
            clientJobsPerMonth: 1,
          },
        },
      };

      // Recalculate for 75% usage (less than 90%)
      moderateUsage.data.usage.jobsUsed = 3;
      moderateUsage.data.usage.jobsPerMonth = 4;
      moderateUsage.data.usage.jobsRemaining = 1;
      moderateUsage.data.plan.clientJobsPerMonth = 4;

      (api.get as jest.Mock).mockResolvedValue(moderateUsage);

      render(<SubscriptionWidget userRole="CLIENT" />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-amber-500');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('should call correct API endpoint', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockClientSubscription);

      render(<SubscriptionWidget userRole="CLIENT" />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/subscriptions/current');
      });
    });
  });

  describe('Days remaining calculation', () => {
    it('should display days until reset', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockClientSubscription);

      render(<SubscriptionWidget userRole="CLIENT" />);

      await waitFor(() => {
        expect(screen.getByText('Days Until Reset')).toBeInTheDocument();
        // The number should be around 15 (based on mock data)
        const daysElement = screen.getByText(/\d+/);
        expect(daysElement).toBeInTheDocument();
      });
    });
  });

  describe('Quick stats', () => {
    it('should show remaining count and days until reset', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockClientSubscription);

      render(<SubscriptionWidget userRole="CLIENT" />);

      await waitFor(() => {
        expect(screen.getByText('Job Postings Left')).toBeInTheDocument();
        expect(screen.getByText('Days Until Reset')).toBeInTheDocument();
      });
    });

    it('should show bids left for artisans', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockArtisanSubscription);

      render(<SubscriptionWidget userRole="ARTISAN" />);

      await waitFor(() => {
        expect(screen.getByText('Bids Left')).toBeInTheDocument();
      });
    });
  });
});
