'use client'

import React, { useState, useEffect } from 'react'
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'

interface Bid {
  id: string
  jobId: string
  amount: number
  estimatedDays: number
  message: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED'
  submittedAt: string
  expiresAt: string
  job: {
    id: string
    title: string
    category: string
    budget: number
    location: string
    urgency: string
    client: {
      name: string
      rating: number
      isVerified: boolean
    }
  }
}

interface BidTemplate {
  id: string
  name: string
  category: string
  baseMessage: string
  defaultPricePerUnit: number
  defaultTimeframe: number
  isActive: boolean
}

interface BidCalculation {
  materials: number
  labor: number
  transport: number
  overhead: number
  profit: number
  total: number
}

export default function BidManagement() {
  useEffect(() => {
    document.title = 'Taska - My Bids';
  }, []);

  const [bids, setBids] = useState<Bid[]>([])
  const [templates, setTemplates] = useState<BidTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [showCalculator, setShowCalculator] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  
  const [bidForm, setBidForm] = useState({
    amount: 0,
    estimatedDays: 7,
    message: '',
    useTemplate: false,
    templateId: ''
  })

  const [calculator, setCalculator] = useState<BidCalculation>({
    materials: 0,
    labor: 0,
    transport: 0,
    overhead: 0,
    profit: 0,
    total: 0
  })

  useEffect(() => {
    fetchBids()
    fetchTemplates()
  }, [])

  useEffect(() => {
    calculateTotal()
  }, [calculator.materials, calculator.labor, calculator.transport, calculator.overhead, calculator.profit])

  const fetchBids = async () => {
    try {
      setLoading(true)
      const response = await api.get('/bids/my-bids')

      // API returns a raw array of bids with job/artisan relations
      const rawBids = Array.isArray(response.data)
        ? response.data
        : (response.data?.bids || [])

      const mappedBids: Bid[] = rawBids.map((b: any) => {
        const profile = b.job?.client?.profile
        const clientName = profile
          ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
          : (b.job?.client?.email || 'Unknown Client')
        const location = b.job
          ? [b.job.city, b.job.province].filter(Boolean).join(', ') || b.job.addressLine1 || ''
          : ''
        return {
          id: b.id,
          jobId: b.jobId,
          amount: typeof b.amount === 'string' ? parseFloat(b.amount) : (b.amount || 0),
          estimatedDays: b.estimatedDays,
          message: b.message,
          status: b.status,
          submittedAt: b.createdAt || b.submittedAt,
          expiresAt: b.expiresAt,
          job: {
            id: b.job?.id || b.jobId,
            title: b.job?.title || 'Unknown Job',
            category: b.job?.category?.name || b.job?.category || 'Unknown',
            budget: typeof b.job?.budget === 'string' ? parseFloat(b.job.budget) : (b.job?.budget || 0),
            location,
            urgency: b.job?.urgency || 'MEDIUM',
            client: {
              name: clientName,
              rating: b.job?.client?.averageRating || 4.5,
              isVerified: b.job?.client?.isVerified || false,
            },
          },
        }
      })

      setBids(mappedBids)
    } catch (error) {
      console.error('Error fetching bids:', error)
      setBids([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/artisan/bid-templates')
      
      // Mock templates
      const mockTemplates: BidTemplate[] = [
        {
          id: '1',
          name: 'Emergency Plumbing',
          category: 'Plumbing',
          baseMessage: 'Emergency plumbing service available 24/7. Licensed plumber with 5+ years experience. I carry all necessary tools and common parts for immediate repairs.',
          defaultPricePerUnit: 350,
          defaultTimeframe: 2,
          isActive: true
        },
        {
          id: '2',
          name: 'Electrical Installation',
          category: 'Electrical',
          baseMessage: 'Certified electrician with COC (Certificate of Compliance) provided. Fully insured with 10+ years residential and commercial experience.',
          defaultPricePerUnit: 450,
          defaultTimeframe: 3,
          isActive: true
        },
        {
          id: '3',
          name: 'Custom Carpentry',
          category: 'Carpentry',
          baseMessage: 'Custom woodwork specialist with portfolio of completed projects. Using premium materials and providing 2-year warranty on all work.',
          defaultPricePerUnit: 280,
          defaultTimeframe: 7,
          isActive: true
        }
      ]
      
      setTemplates(response.data?.templates || mockTemplates)
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    }
  }

  const calculateTotal = () => {
    const total = calculator.materials + calculator.labor + calculator.transport + calculator.overhead + calculator.profit
    setCalculator(prev => ({ ...prev, total }))
    setBidForm(prev => ({ ...prev, amount: total }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const getBidStatusVariant = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'default'
      case 'PENDING': return 'secondary'
      case 'REJECTED': return 'destructive'
      case 'WITHDRAWN': return 'outline'
      case 'EXPIRED': return 'destructive'
      default: return 'secondary'
    }
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'text-green-600'
      case 'PENDING': return 'text-orange-600'
      case 'REJECTED': return 'text-red-600'
      case 'WITHDRAWN': return 'text-gray-600'
      case 'EXPIRED': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffInMinutes = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffInMinutes <= 0) return 'Expired'
    if (diffInMinutes < 60) return `${diffInMinutes}m remaining`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h remaining`
    return `${Math.floor(diffInMinutes / 1440)}d remaining`
  }

  const getFilteredBids = () => {
    switch (activeTab) {
      case 'pending':
        return bids.filter(bid => bid.status === 'PENDING')
      case 'accepted':
        return bids.filter(bid => bid.status === 'ACCEPTED')
      case 'rejected':
        return bids.filter(bid => ['REJECTED', 'WITHDRAWN', 'EXPIRED'].includes(bid.status))
      default:
        return bids
    }
  }

  const applyTemplate = (template: BidTemplate) => {
    setBidForm(prev => ({
      ...prev,
      message: template.baseMessage,
      amount: template.defaultPricePerUnit,
      estimatedDays: template.defaultTimeframe,
      useTemplate: true,
      templateId: template.id
    }))
    setCalculator(prev => ({
      ...prev,
      labor: template.defaultPricePerUnit * 0.6,
      materials: template.defaultPricePerUnit * 0.2,
      transport: template.defaultPricePerUnit * 0.05,
      overhead: template.defaultPricePerUnit * 0.1,
      profit: template.defaultPricePerUnit * 0.05
    }))
  }

  const submitBid = async () => {
    try {
      const bidData = {
        jobId: selectedJob?.id,
        amount: bidForm.amount,
        estimatedDays: bidForm.estimatedDays,
        message: bidForm.message
      }
      
      await api.post('/bids', bidData)
      // Refresh bids after successful submission
      await fetchBids()
      
      // Reset form
      setBidForm({
        amount: 0,
        estimatedDays: 7,
        message: '',
        useTemplate: false,
        templateId: ''
      })
      setShowCalculator(false)
      setSelectedJob(null)
    } catch (error) {
      console.error('Error submitting bid:', error)
    }
  }

  const withdrawBid = async (bidId: string) => {
    try {
      await api.post(`/bids/${bidId}/withdraw`)
      await fetchBids()
    } catch (error) {
      console.error('Error withdrawing bid:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ArtisanNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Bid Management</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ArtisanNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Bids</h1>
          <p className="text-gray-600">
            Track your bids and manage templates
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowCalculator(!showCalculator)}>
            {showCalculator ? 'Hide Calculator' : 'Bid Calculator'}
          </Button>
          <Button onClick={fetchBids}>
            Refresh Bids
          </Button>
        </div>
      </div>

      {/* Bid Calculator Modal */}
      {showCalculator && (
        <Card>
          <CardHeader>
            <CardTitle>Bid Calculator</CardTitle>
            <CardDescription>Calculate your bid based on costs and profit margin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-1">Materials Cost</label>
                <input
                  type="number"
                  value={calculator.materials}
                  onChange={(e) => setCalculator(prev => ({ ...prev, materials: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Labor Cost</label>
                <input
                  type="number"
                  value={calculator.labor}
                  onChange={(e) => setCalculator(prev => ({ ...prev, labor: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transport Cost</label>
                <input
                  type="number"
                  value={calculator.transport}
                  onChange={(e) => setCalculator(prev => ({ ...prev, transport: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Overhead (10%)</label>
                <input
                  type="number"
                  value={calculator.overhead}
                  onChange={(e) => setCalculator(prev => ({ ...prev, overhead: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Profit Margin</label>
                <input
                  type="number"
                  value={calculator.profit}
                  onChange={(e) => setCalculator(prev => ({ ...prev, profit: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Bid Amount</label>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(calculator.total)}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Cost Breakdown</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Materials:</span>
                  <span>{formatCurrency(calculator.materials)} ({calculator.total > 0 ? ((calculator.materials / calculator.total) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Labor:</span>
                  <span>{formatCurrency(calculator.labor)} ({calculator.total > 0 ? ((calculator.labor / calculator.total) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport:</span>
                  <span>{formatCurrency(calculator.transport)} ({calculator.total > 0 ? ((calculator.transport / calculator.total) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Overhead:</span>
                  <span>{formatCurrency(calculator.overhead)} ({calculator.total > 0 ? ((calculator.overhead / calculator.total) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Profit:</span>
                  <span>{formatCurrency(calculator.profit)} ({calculator.total > 0 ? ((calculator.profit / calculator.total) * 100).toFixed(1) : 0}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Bid Templates</CardTitle>
            <CardDescription>Use pre-built templates to speed up your bidding process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => applyTemplate(template)}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.baseMessage}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>Base Rate:</span>
                      <span className="font-medium">{formatCurrency(template.defaultPricePerUnit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Timeframe:</span>
                      <span className="font-medium">{template.defaultTimeframe} days</span>
                    </div>
                    <Button size="sm" className="w-full">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bid Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Bids</CardTitle>
          <CardDescription>Track and manage all your submitted bids</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">All Bids ({bids.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({bids.filter(bid => bid.status === 'PENDING').length})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Accepted ({bids.filter(bid => bid.status === 'ACCEPTED').length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({bids.filter(bid => ['REJECTED', 'WITHDRAWN', 'EXPIRED'].includes(bid.status)).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {getFilteredBids().length > 0 ? (
                <div className="space-y-4">
                  {getFilteredBids().map((bid) => (
                    <Card key={bid.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h3 className="font-medium">{bid.job.title}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">{bid.job.category}</Badge>
                              <Badge variant="outline" className="text-xs">{bid.job.urgency}</Badge>
                              {bid.job.client.isVerified && (
                                <Badge variant="secondary" className="text-xs">Verified Client</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Client: {bid.job.client.name} • ⭐ {bid.job.client.rating.toFixed(1)} • {bid.job.location}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-lg font-semibold">{formatCurrency(bid.amount)}</div>
                            <Badge variant={getBidStatusVariant(bid.status)} className="text-xs">
                              {bid.status}
                            </Badge>
                            {bid.status === 'PENDING' && (
                              <div className="text-xs text-muted-foreground">
                                {formatTimeRemaining(bid.expiresAt)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3 mb-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Your Bid:</span>
                            <span className="text-sm font-medium">{formatCurrency(bid.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Client Budget:</span>
                            <span className="text-sm font-medium">{formatCurrency(bid.job.budget)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Timeline:</span>
                            <span className="text-sm font-medium">{bid.estimatedDays} days</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="text-sm text-muted-foreground">Your Message:</span>
                          <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                            {bid.message}
                          </p>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            Submitted {new Date(bid.submittedAt).toLocaleDateString()} at {new Date(bid.submittedAt).toLocaleTimeString()}
                          </div>
                          <div className="space-x-2">
                            {bid.status === 'PENDING' && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => withdrawBid(bid.id)}
                              >
                                Withdraw Bid
                              </Button>
                            )}
                            {bid.status === 'ACCEPTED' && (
                              <Button variant="outline" size="sm">
                                View Project
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              View Job Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">No bids found for this filter.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {activeTab === 'pending' && 'Submit bids on available jobs to see them here.'}
                      {activeTab === 'accepted' && 'Accepted bids will appear here when clients select your proposals.'}
                      {activeTab === 'rejected' && 'Rejected or withdrawn bids will appear here.'}
                      {activeTab === 'active' && 'Start bidding on jobs to build your proposal history.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
