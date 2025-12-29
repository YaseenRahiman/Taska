'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Star, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { CreditBundle } from '@/lib/api/monetization';

interface CreditBundleCardProps {
  bundle: CreditBundle;
  onPurchase: (bundleId: string) => Promise<void>;
  disabled?: boolean;
}

export function CreditBundleCard({ bundle, onPurchase, disabled = false }: CreditBundleCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await onPurchase(bundle.id);
    } finally {
      setIsPurchasing(false);
    }
  };

  const totalCredits = bundle.credits + Math.floor(bundle.credits * (bundle.bonusPercentage / 100));

  return (
    <Card
      className={cn(
        'relative transition-all hover:shadow-lg',
        bundle.isPopular && 'ring-2 ring-primary-500 shadow-lg'
      )}
    >
      {bundle.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary-500 text-white px-3 py-1 flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" aria-hidden="true" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2 pt-6">
        <CardTitle className="text-xl font-bold text-gray-900">{bundle.name}</CardTitle>
        {bundle.description && (
          <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
        )}
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <div className="py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="w-6 h-6 text-primary-500" aria-hidden="true" />
            <span className="text-3xl font-bold text-gray-900">
              {totalCredits.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-500">credits</p>

          {bundle.bonusPercentage > 0 && (
            <div className="mt-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                +{bundle.bonusPercentage}% bonus ({Math.floor(bundle.credits * (bundle.bonusPercentage / 100))} extra)
              </Badge>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <p className="text-2xl font-bold text-primary-600 mb-4">
            {formatCurrency(bundle.price)}
          </p>

          <Button
            className={cn(
              'w-full',
              bundle.isPopular
                ? 'bg-primary-500 hover:bg-primary-600'
                : 'bg-gray-900 hover:bg-gray-800'
            )}
            onClick={handlePurchase}
            disabled={disabled || isPurchasing}
            aria-label={`Purchase ${bundle.name} for ${formatCurrency(bundle.price)}`}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Processing...
              </>
            ) : (
              'Purchase'
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          {(bundle.price / totalCredits).toFixed(2)} per credit
        </p>
      </CardContent>
    </Card>
  );
}
