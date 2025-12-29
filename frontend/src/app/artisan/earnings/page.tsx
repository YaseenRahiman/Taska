'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  FileText
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'PAYMENT' | 'WITHDRAWAL' | 'REFUND' | 'FEE'
  amount: number
  description: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  date: string
  jobId?: string
  jobTitle?: string
}

interface EarningsData {
  totalEarnings: number
  availableBalance: number
  pendingPayments: number
  thisMonth: number
  lastMonth: number
  thisYear: number
  lastYear: number
  averageJobValue: number
  completedJobs: number
}

interface MonthlyEarning {
  month: string
  earnings: number
  jobs: number
}

export default function ArtisanEarnings() {
  useEffect(() => {
    document.title = 'Taska - Earnings';
  }, []);

  const router = useRouter()
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    availableBalance: 0,
    pendingPayments: 0,
    thisMonth: 0,
    lastMonth: 0,
    thisYear: 0,
    lastYear: 0,
    averageJobValue: 0,
    completedJobs: 0
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchEarningsData()
  }, [])

  const fetchEarningsData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/artisan/earnings')

      // Mock earnings data
      const mockEarnings: EarningsData = {
        totalEarnings: 156780.50,
        availableBalance: 8950.25,
        pendingPayments: 3200.00,
        thisMonth: 12450.75,
        lastMonth: 9850.50,
        thisYear: 89650.25,
        lastYear: 67130.25,
        averageJobValue: 1285.50,
        completedJobs: 122
      }

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'PAYMENT',
          amount: 2500.00,
          description: 'Payment for Kitchen Sink Repair',
          status: 'COMPLETED',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          jobId: 'job-1',
          jobTitle: 'Kitchen Sink Repair'
        },
        {
          id: '2',
          type: 'WITHDRAWAL',
          amount: -5000.00,
          description: 'Bank withdrawal',
          status: 'COMPLETED',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'PAYMENT',
          amount: 3500.00,
          description: 'Payment for Electrical Installation',
          status: 'PENDING',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          jobId: 'job-2',
          jobTitle: 'Bedroom Electrical Installation'
        },
        {
          id: '4',
          type: 'FEE',
          amount: -125.00,
          description: 'Platform service fee',
          status: 'COMPLETED',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          type: 'PAYMENT',
          amount: 1800.00,
          description: 'Payment for Plumbing Repairs',
          status: 'COMPLETED',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          jobId: 'job-5',
          jobTitle: 'Bathroom Plumbing Repairs'
        }
      ]

      const mockMonthlyData: MonthlyEarning[] = [
        { month: 'Jan', earnings: 8450.50, jobs: 12 },
        { month: 'Feb', earnings: 9200.25, jobs: 14 },
        { month: 'Mar', earnings: 7850.00, jobs: 11 },
        { month: 'Apr', earnings: 10500.75, jobs: 16 },
        { month: 'May', earnings: 11250.00, jobs: 18 },
        { month: 'Jun', earnings: 9850.50, jobs: 15 },
        { month: 'Jul', earnings: 12450.75, jobs: 19 },
        { month: 'Aug', earnings: 0, jobs: 0 },
        { month: 'Sep', earnings: 0, jobs: 0 },
        { month: 'Oct', earnings: 0, jobs: 0 },
        { month: 'Nov', earnings: 0, jobs: 0 },
        { month: 'Dec', earnings: 0, jobs: 0 }
      ]

      setEarnings(response.data?.earnings || mockEarnings)
      setTransactions(response.data?.transactions || mockTransactions)
      setMonthlyData(mockMonthlyData)
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return <ArrowDownRight className="w-4 h-4 text-green-600" />
      case 'WITHDRAWAL':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case 'FEE':
        return <ArrowUpRight className="w-4 h-4 text-orange-600" />
      case 'REFUND':
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const monthGrowth = calculateGrowth(earnings.thisMonth, earnings.lastMonth)
  const yearGrowth = calculateGrowth(earnings.thisYear, earnings.lastYear)

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ArtisanNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ArtisanNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Earnings</h1>
            <p className="text-gray-600 mt-2">Track your income and manage your payouts</p>
          </div>
          <Button
            onClick={() => router.push('/artisan/earnings/withdraw')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Withdraw Funds
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Available Balance</span>
                <div className="p-2 bg-green-100 rounded-full">
                  <Wallet className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.availableBalance)}</p>
              <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Pending Payments</span>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.pendingPayments)}</p>
              <p className="text-xs text-gray-500 mt-1">In escrow</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">This Month</span>
                <div className="p-2 bg-primary-100 rounded-full">
                  <Calendar className="w-4 h-4 text-primary-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.thisMonth)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`w-3 h-3 ${monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-xs ${monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthGrowth >= 0 ? '+' : ''}{monthGrowth.toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Earnings</span>
                <div className="p-2 bg-blue-100 rounded-full">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.totalEarnings)}</p>
              <p className="text-xs text-gray-500 mt-1">{earnings.completedJobs} jobs completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="statements">Statements</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Your recent payments and withdrawals</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600">{formatDate(transaction.date)}</p>
                            <Badge className={`${getStatusColor(transaction.status)} text-xs`}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Earnings</CardTitle>
                  <CardDescription>Your earnings over the past 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyData.filter(m => m.earnings > 0).map((month) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 w-12">{month.month}</span>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full w-48">
                              <div
                                className="h-2 bg-primary-600 rounded-full"
                                style={{ width: `${(month.earnings / 15000) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(month.earnings)}</p>
                          <p className="text-xs text-gray-600">{month.jobs} jobs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Your earning statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700">Average Job Value</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(earnings.averageJobValue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700">This Year</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(earnings.thisYear)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700">Last Year</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(earnings.lastYear)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700">Year-over-Year Growth</span>
                    <span className={`font-semibold ${yearGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {yearGrowth >= 0 ? '+' : ''}{yearGrowth.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="statements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Statements</CardTitle>
                <CardDescription>Download your tax and financial documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Annual Statement 2024</p>
                      <p className="text-sm text-gray-600">Total earnings: {formatCurrency(earnings.thisYear)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Annual Statement 2023</p>
                      <p className="text-sm text-gray-600">Total earnings: {formatCurrency(earnings.lastYear)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Tax Certificate 2024</p>
                      <p className="text-sm text-gray-600">For tax filing purposes</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
