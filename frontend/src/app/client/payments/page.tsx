'use client';

import { useState, useEffect } from 'react';
import { ClientNavbar } from '@/components/client/ClientNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Download,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  Shield,
  TrendingUp
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  jobId: string;
  jobTitle?: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  type: 'JOB_PAYMENT' | 'PLATFORM_FEE' | 'REFUND';
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
}

interface PaymentMethod {
  id: string;
  type: 'CARD' | 'BANK_ACCOUNT';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  jobId: string;
  jobTitle: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  downloadUrl?: string;
}

interface PaymentStats {
  totalSpent: number;
  totalPending: number;
  totalRefunded: number;
  paymentCount: number;
}

export default function ClientPaymentsPage() {
  useEffect(() => {
    document.title = 'Taska - Payments';
  }, []);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalSpent: 0,
    totalPending: 0,
    totalRefunded: 0,
    paymentCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all payment-related data in parallel
      const [paymentsRes, methodsRes, invoicesRes] = await Promise.allSettled([
        api.get('/payments'),
        api.get('/payments/methods'),
        api.get('/payments/invoices')
      ]);

      // Process payments
      if (paymentsRes.status === 'fulfilled') {
        const responseData = paymentsRes.value.data;
        // Handle both array and object with payments property
        const paymentsData = Array.isArray(responseData)
          ? responseData
          : (responseData?.payments || []);
        setPayments(paymentsData);

        // Calculate stats
        const totalSpent = paymentsData
          .filter((p: Payment) => p.status === 'COMPLETED')
          .reduce((sum: number, p: Payment) => sum + p.amount, 0);

        const totalPending = paymentsData
          .filter((p: Payment) => p.status === 'PENDING')
          .reduce((sum: number, p: Payment) => sum + p.amount, 0);

        const totalRefunded = paymentsData
          .filter((p: Payment) => p.status === 'REFUNDED')
          .reduce((sum: number, p: Payment) => sum + p.amount, 0);

        setStats({
          totalSpent,
          totalPending,
          totalRefunded,
          paymentCount: paymentsData.length
        });
      }

      // Process payment methods
      if (methodsRes.status === 'fulfilled') {
        const methodsData = methodsRes.value.data;
        setPaymentMethods(Array.isArray(methodsData)
          ? methodsData
          : (methodsData?.methods || []));
      }

      // Process invoices
      if (invoicesRes.status === 'fulfilled') {
        const invoicesData = invoicesRes.value.data;
        setInvoices(Array.isArray(invoicesData)
          ? invoicesData
          : (invoicesData?.invoices || []));
      }

    } catch (err: any) {
      console.error('Error fetching payment data:', err);
      setError(err.message || 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      await api.delete(`/payments/methods/${methodId}`);
      setPaymentMethods(paymentMethods.filter(m => m.id !== methodId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove payment method');
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await api.get(`/payments/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download invoice');
    }
  };

  const handleExportPayments = () => {
    // Create CSV export
    const headers = ['Date', 'Job', 'Amount', 'Status', 'Type', 'Transaction ID'];
    const rows = filteredPayments.map(p => [
      formatDate(new Date(p.createdAt)),
      p.jobTitle || 'N/A',
      formatCurrency(p.amount),
      p.status,
      p.type,
      p.transactionId || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `taska-payments-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'PENDING':
      case 'UNPAID':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Refunded</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payments & Billing</h1>
          <p className="text-gray-600 mt-2">
            Manage your payment methods, view transaction history, and download invoices
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalPending)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Refunded</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalRefunded)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.paymentCount}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* Payment History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>View all your payment transactions</CardDescription>
                  </div>
                  <Button
                    onClick={handleExportPayments}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by job or transaction ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                {/* Payments Table */}
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No payments match your filters'
                        : 'No payment history yet'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {formatDate(new Date(payment.createdAt))}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {payment.jobTitle || 'N/A'}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {payment.type.replace('_', ' ')}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {getStatusBadge(payment.status)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 font-mono">
                              {payment.transactionId || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="methods">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your saved payment methods</CardDescription>
                  </div>
                  <Button className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Payment Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No payment methods saved</p>
                    <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Payment Method
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <CreditCard className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">
                                {method.type === 'CARD' ? method.brand : 'Bank Account'} •••• {method.last4}
                              </h4>
                              {method.isDefault && (
                                <Badge className="bg-primary-100 text-primary-800 border-primary-200">
                                  Default
                                </Badge>
                              )}
                            </div>
                            {method.type === 'CARD' && method.expiryMonth && method.expiryYear && (
                              <p className="text-sm text-gray-600 mt-1">
                                Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Added {formatDate(new Date(method.createdAt))}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Secure Payment Processing</h4>
                      <p className="text-xs text-blue-700 mt-1">
                        All payment information is encrypted and securely stored. We never store your full card details.
                        Payments are processed through PCI-compliant payment providers.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoices & Receipts</CardTitle>
                <CardDescription>Download invoices for your completed payments</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No invoices available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-mono text-gray-900">
                              {invoice.invoiceNumber}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {invoice.jobTitle}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.amount)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {formatDate(new Date(invoice.issuedDate))}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {formatDate(new Date(invoice.dueDate))}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {getStatusBadge(invoice.status)}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadInvoice(invoice.id)}
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
