'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  Building,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface BankAccount {
  id: string
  accountName: string
  accountNumber: string
  bankName: string
  branchCode: string
  isPrimary: boolean
}

export default function WithdrawFunds() {
  useEffect(() => {
    document.title = 'Taska - Withdraw Funds';
  }, []);

  const router = useRouter()
  const [availableBalance, setAvailableBalance] = useState(8950.25)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBankAccounts()
  }, [])

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get('/artisan/bank-accounts')

      // Mock bank accounts
      const mockAccounts: BankAccount[] = [
        {
          id: '1',
          accountName: 'John Smith',
          accountNumber: '****6789',
          bankName: 'Standard Bank',
          branchCode: '051001',
          isPrimary: true
        },
        {
          id: '2',
          accountName: 'John Smith Business',
          accountNumber: '****3456',
          bankName: 'FNB',
          branchCode: '250655',
          isPrimary: false
        }
      ]

      setBankAccounts(response.data || mockAccounts)
      const primary = mockAccounts.find(acc => acc.isPrimary)
      if (primary) {
        setSelectedAccount(primary.id)
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)

    // Validation
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amount < 100) {
      setError('Minimum withdrawal amount is R100')
      return
    }

    if (amount > availableBalance) {
      setError('Insufficient balance')
      return
    }

    if (!selectedAccount) {
      setError('Please select a bank account')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await api.post('/artisan/withdraw', {
        amount,
        bankAccountId: selectedAccount
      })

      setSuccess(true)
      setAvailableBalance(prev => prev - amount)
      setWithdrawAmount('')

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/artisan/earnings')
      }, 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to process withdrawal')
    } finally {
      setLoading(false)
    }
  }

  const calculateFee = (amount: number) => {
    // Mock fee calculation (2.5% or minimum R5)
    const fee = Math.max(amount * 0.025, 5)
    return fee
  }

  const amount = parseFloat(withdrawAmount) || 0
  const fee = calculateFee(amount)
  const totalToReceive = amount - fee

  if (success) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ArtisanNavbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Withdrawal Requested</h2>
              <p className="text-gray-700 mb-6">
                Your withdrawal of {formatCurrency(amount)} has been submitted for processing.
              </p>
              <div className="bg-white rounded-lg p-4 mb-6 max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Processing Time</span>
                </div>
                <p className="font-semibold text-gray-900">1-3 business days</p>
              </div>
              <Button onClick={() => router.push('/artisan/earnings')} className="bg-primary-600 hover:bg-primary-700">
                Back to Earnings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ArtisanNavbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/artisan/earnings')}
            className="mb-4 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Earnings
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Withdraw Funds</h1>
          <p className="text-gray-600 mt-2">Transfer your earnings to your bank account</p>
        </div>

        {/* Available Balance */}
        <Card className="mb-6 bg-gradient-to-r from-primary-500 to-primary-600">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm opacity-90">Available Balance</span>
            </div>
            <p className="text-4xl font-bold">{formatCurrency(availableBalance)}</p>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Withdrawal Details</CardTitle>
            <CardDescription>Enter the amount you wish to withdraw</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (ZAR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R</span>
                <input
                  id="amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => {
                    setWithdrawAmount(e.target.value)
                    setError(null)
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold"
                  min="100"
                  max={availableBalance}
                  step="0.01"
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-sm text-gray-600">Minimum: R100</p>
                <button
                  onClick={() => setWithdrawAmount(availableBalance.toFixed(2))}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Withdraw All
                </button>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Amounts</p>
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2500, 5000].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    onClick={() => setWithdrawAmount(preset.toString())}
                    disabled={preset > availableBalance}
                    className="text-sm"
                  >
                    R{preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Fee Breakdown */}
            {amount > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Withdrawal Amount</span>
                  <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing Fee (2.5%)</span>
                  <span className="font-medium text-gray-900">-{formatCurrency(fee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">You'll Receive</span>
                    <span className="font-bold text-primary-600 text-lg">{formatCurrency(totalToReceive)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Account Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Destination Account</CardTitle>
            <CardDescription>Select where you'd like to receive the funds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bankAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account.id)}
                className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                  selectedAccount === account.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      <Building className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{account.bankName}</p>
                      <p className="text-sm text-gray-600">{account.accountName}</p>
                      <p className="text-sm text-gray-600">Account: {account.accountNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">Branch: {account.branchCode}</p>
                    </div>
                  </div>
                  {account.isPrimary && (
                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                  )}
                </div>
              </button>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/artisan/settings?tab=banking')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Add New Account
            </Button>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Processing Information</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Withdrawals are processed within 1-3 business days</li>
                  <li>A processing fee of 2.5% (minimum R5) applies</li>
                  <li>Funds will be deposited to your selected bank account</li>
                  <li>You'll receive a confirmation email once processed</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/artisan/earnings')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={loading || !withdrawAmount || !selectedAccount}
            className="flex-1 bg-primary-600 hover:bg-primary-700"
          >
            {loading ? 'Processing...' : 'Withdraw Funds'}
          </Button>
        </div>
      </div>
    </div>
  )
}
