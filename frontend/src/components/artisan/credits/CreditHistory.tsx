'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  History,
  Filter,
} from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';
import { getCreditTransactions, type CreditTransaction } from '@/lib/api/monetization';

interface CreditHistoryProps {
  initialTransactions?: CreditTransaction[];
}

const TRANSACTION_TYPE_CONFIG: Record<
  CreditTransaction['type'],
  { label: string; color: string; isCredit: boolean }
> = {
  PURCHASE: { label: 'Purchase', color: 'bg-green-100 text-green-700', isCredit: true },
  BID_DEBIT: { label: 'Bid Placed', color: 'bg-blue-100 text-blue-700', isCredit: false },
  BOOST_DEBIT: { label: 'Boost Activated', color: 'bg-purple-100 text-purple-700', isCredit: false },
  VOUCHER_CREDIT: { label: 'Voucher Redeemed', color: 'bg-green-100 text-green-700', isCredit: true },
  REFUND: { label: 'Refund', color: 'bg-yellow-100 text-yellow-700', isCredit: true },
  AUTO_TOPUP: { label: 'Auto Top-up', color: 'bg-green-100 text-green-700', isCredit: true },
  LEVEL_BONUS: { label: 'Level Bonus', color: 'bg-orange-100 text-orange-700', isCredit: true },
};

export function CreditHistory({ initialTransactions }: CreditHistoryProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>(initialTransactions || []);
  const [loading, setLoading] = useState(!initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string | null>(null);

  const limit = 10;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { page: number; limit: number; type?: string } = { page, limit };
      if (filter) {
        params.type = filter;
      }
      const result = await getCreditTransactions(params);
      setTransactions(result.transactions);
      setTotalPages(Math.ceil(result.total / limit));
    } catch (err) {
      setError('Failed to load transaction history');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialTransactions) {
      fetchTransactions();
    }
  }, [page, filter]);

  const filterOptions = [
    { value: null, label: 'All' },
    { value: 'PURCHASE', label: 'Purchases' },
    { value: 'BID_DEBIT', label: 'Bids' },
    { value: 'BOOST_DEBIT', label: 'Boosts' },
    { value: 'VOUCHER_CREDIT', label: 'Vouchers' },
    { value: 'REFUND', label: 'Refunds' },
  ];

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" aria-hidden="true" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" aria-label="Loading" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" aria-hidden="true" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchTransactions}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5" aria-hidden="true" />
          Transaction History
        </CardTitle>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <select
            value={filter || ''}
            onChange={(e) => {
              setFilter(e.target.value || null);
              setPage(1);
            }}
            className="text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Filter transactions by type"
          >
            {filterOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
            <p>No transactions found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const config = TRANSACTION_TYPE_CONFIG[transaction.type];
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-full',
                          config.isCredit ? 'bg-green-100' : 'bg-red-100'
                        )}
                      >
                        {config.isCredit ? (
                          <ArrowDownCircle
                            className="w-5 h-5 text-green-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowUpCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn('text-xs', config.color)}>
                            {config.label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(transaction.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          'font-semibold',
                          config.isCredit ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {config.isCredit ? '+' : '-'}
                        {Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Balance: {transaction.balanceAfter.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                  Previous
                </Button>

                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
