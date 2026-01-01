'use client';

import { useState, useEffect } from 'react';
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Coins,
  ShoppingCart,
  History,
  Ticket,
  RefreshCw,
  Loader2,
  AlertCircle,
  CreditCard,
  Building2,
  Wallet,
} from 'lucide-react';
import {
  CreditBalance,
  CreditBundleCard,
  CreditHistory,
  VoucherRedeemForm,
  AutoTopUpSettings,
} from '@/components/artisan/credits';
import {
  getCreditBalance,
  getCreditBundles,
  purchaseCredits,
  type CreditBalance as CreditBalanceType,
  type CreditBundle,
} from '@/lib/api/monetization';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

type PaymentMethod = 'card' | 'eft' | 'wallet';

export default function CreditsPage() {
  const [balance, setBalance] = useState<CreditBalanceType | null>(null);
  const [bundles, setBundles] = useState<CreditBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<CreditBundle | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    document.title = 'Taska - Credits';
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [balanceData, bundlesData] = await Promise.all([
        getCreditBalance(),
        getCreditBundles(),
      ]);
      setBalance(balanceData);
      setBundles(bundlesData);
    } catch (err) {
      setError('Failed to load credit information');
      console.error('Error fetching credit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (bundle: CreditBundle) => {
    setSelectedBundle(bundle);
    setShowPaymentModal(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedBundle) return;

    try {
      setIsPurchasing(true);
      const result = await purchaseCredits(selectedBundle.id, selectedPaymentMethod);

      if (result.success) {
        toast.success(`Successfully purchased ${selectedBundle.credits} credits!`);
        setShowPaymentModal(false);
        setSelectedBundle(null);
        // Refresh balance
        const newBalance = await getCreditBalance();
        setBalance(newBalance);
      } else {
        toast.error(result.message || 'Purchase failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete purchase');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleVoucherSuccess = (creditsAdded: number, newBalance: number) => {
    setBalance((prev) =>
      prev
        ? {
            ...prev,
            balance: newBalance,
          }
        : null
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ArtisanNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" aria-label="Loading" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ArtisanNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchData}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ArtisanNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Credits</h1>
          <p className="text-gray-600 mt-2">
            Manage your credits to bid on jobs and boost your profile
          </p>
        </div>

        {/* Credit Balance Card */}
        <div className="mb-8">
          <CreditBalance
            balance={balance?.balance || 0}
            freeBidsRemaining={balance?.freeBidsRemaining || 0}
            freeBoostsRemaining={balance?.freeBoostsRemaining || 0}
            loading={loading}
          />
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="bundles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Buy Credits</span>
              <span className="sm:hidden">Buy</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger value="voucher" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Voucher</span>
              <span className="sm:hidden">Voucher</span>
            </TabsTrigger>
            <TabsTrigger value="auto" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Auto Top-up</span>
              <span className="sm:hidden">Auto</span>
            </TabsTrigger>
          </TabsList>

          {/* Buy Credits Tab */}
          <TabsContent value="bundles" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bundles.map((bundle) => (
                <CreditBundleCard
                  key={bundle.id}
                  bundle={bundle}
                  onPurchase={() => handlePurchaseClick(bundle)}
                />
              ))}
            </div>

            {bundles.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Coins className="w-12 h-12 mx-auto text-gray-300 mb-4" aria-hidden="true" />
                  <p className="text-gray-500">No credit bundles available at the moment</p>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg h-fit">
                    <Coins className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">How credits work</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Credits are used to place bids on jobs and boost your profile visibility.
                      Each bid costs a certain number of credits based on the job value. Larger
                      bundles offer better value with bonus credits included.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="history">
            <CreditHistory />
          </TabsContent>

          {/* Voucher Redemption Tab */}
          <TabsContent value="voucher">
            <div className="max-w-md">
              <VoucherRedeemForm onSuccess={handleVoucherSuccess} />
            </div>
          </TabsContent>

          {/* Auto Top-up Tab */}
          <TabsContent value="auto">
            <div className="max-w-md">
              <AutoTopUpSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && selectedBundle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Complete Purchase</CardTitle>
              <CardDescription>
                Select a payment method to purchase {selectedBundle.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bundle Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Bundle</span>
                  <span className="font-medium">{selectedBundle.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Credits</span>
                  <span className="font-medium">
                    {selectedBundle.credits.toLocaleString()}
                    {selectedBundle.bonusPercentage > 0 && (
                      <span className="text-green-600 ml-1">
                        (+{Math.floor(selectedBundle.credits * (selectedBundle.bonusPercentage / 100))})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg text-primary-600">
                    {formatCurrency(selectedBundle.price)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`w-full flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                    selectedPaymentMethod === 'card'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      selectedPaymentMethod === 'card' ? 'bg-primary-100' : 'bg-gray-100'
                    }`}
                  >
                    <CreditCard
                      className={`w-5 h-5 ${
                        selectedPaymentMethod === 'card' ? 'text-primary-600' : 'text-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, etc.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('eft')}
                  className={`w-full flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                    selectedPaymentMethod === 'eft'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      selectedPaymentMethod === 'eft' ? 'bg-primary-100' : 'bg-gray-100'
                    }`}
                  >
                    <Building2
                      className={`w-5 h-5 ${
                        selectedPaymentMethod === 'eft' ? 'text-primary-600' : 'text-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Instant EFT</p>
                    <p className="text-sm text-gray-500">Direct bank transfer</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('wallet')}
                  className={`w-full flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                    selectedPaymentMethod === 'wallet'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      selectedPaymentMethod === 'wallet' ? 'bg-primary-100' : 'bg-gray-100'
                    }`}
                  >
                    <Wallet
                      className={`w-5 h-5 ${
                        selectedPaymentMethod === 'wallet' ? 'text-primary-600' : 'text-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Taska Wallet</p>
                    <p className="text-sm text-gray-500">Use your wallet balance</p>
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedBundle(null);
                  }}
                  disabled={isPurchasing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePurchaseConfirm}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Processing...
                    </>
                  ) : (
                    <>Pay {formatCurrency(selectedBundle.price)}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
