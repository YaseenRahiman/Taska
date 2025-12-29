'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Coins, Gift, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CreditBalanceProps {
  balance: number;
  freeBidsRemaining: number;
  freeBoostsRemaining: number;
  loading?: boolean;
}

export function CreditBalance({
  balance,
  freeBidsRemaining,
  freeBoostsRemaining,
  loading = false,
}: CreditBalanceProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-white/30 rounded w-24 mb-2"></div>
            <div className="h-10 bg-white/30 rounded w-32 mb-4"></div>
            <div className="flex gap-4">
              <div className="h-6 bg-white/30 rounded w-20"></div>
              <div className="h-6 bg-white/30 rounded w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary-500 to-primary-700 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-primary-100 text-sm font-medium mb-1">Available Credits</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{balance.toLocaleString()}</span>
              <span className="text-primary-200 text-lg">credits</span>
            </div>
          </div>
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Coins className="w-8 h-8" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-md">
              <Gift className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-primary-200">Free Bids</p>
              <p className="font-semibold">{freeBidsRemaining} remaining</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-md">
              <Zap className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-primary-200">Free Boosts</p>
              <p className="font-semibold">{freeBoostsRemaining} remaining</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
