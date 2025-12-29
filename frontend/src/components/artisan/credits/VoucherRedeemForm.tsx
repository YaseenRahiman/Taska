'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { redeemVoucher } from '@/lib/api/monetization';
import toast from 'react-hot-toast';

interface VoucherRedeemFormProps {
  onSuccess?: (creditsAdded: number, newBalance: number) => void;
}

export function VoucherRedeemForm({ onSuccess }: VoucherRedeemFormProps) {
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ credits: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please enter a voucher code');
      return;
    }

    setIsRedeeming(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await redeemVoucher(trimmedCode);

      if (result.success) {
        setSuccess({ credits: result.creditsAdded });
        setCode('');
        toast.success(`Successfully redeemed ${result.creditsAdded} credits!`);
        onSuccess?.(result.creditsAdded, result.newBalance);
      } else {
        setError(result.message || 'Failed to redeem voucher');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Invalid voucher code or voucher has already been used';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Ticket className="w-5 h-5" aria-hidden="true" />
          Redeem Voucher
        </CardTitle>
        <CardDescription>
          Enter your voucher code to add credits to your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="voucher-code" className="sr-only">
              Voucher Code
            </label>
            <input
              id="voucher-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
                setSuccess(null);
              }}
              placeholder="Enter voucher code (e.g., TASKA-ABC123)"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase tracking-wider font-mono text-center"
              disabled={isRedeeming}
              aria-describedby={error ? 'voucher-error' : success ? 'voucher-success' : undefined}
            />
          </div>

          {error && (
            <div
              id="voucher-error"
              className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              id="voucher-success"
              className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg"
              role="alert"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Successfully added {success.credits.toLocaleString()} credits to your account!</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isRedeeming || !code.trim()}
          >
            {isRedeeming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Redeeming...
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4 mr-2" aria-hidden="true" />
                Redeem Voucher
              </>
            )}
          </Button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          Voucher codes are case-insensitive and can only be used once.
        </p>
      </CardContent>
    </Card>
  );
}
