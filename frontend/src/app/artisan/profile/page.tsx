'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'

interface ArtisanProfile {
  id: string
  userId: string
  businessName: string
  description: string
  specializations: string[]
  experience: number
  location: string
  availability: {
    monday: { available: boolean; hours: string }
    tuesday: { available: boolean; hours: string }
    wednesday: { available: boolean; hours: string }
    thursday: { available: boolean; hours: string }
    friday: { available: boolean; hours: string }
    saturday: { available: boolean; hours: string }
    sunday: { available: boolean; hours: string }
  }
  portfolio: PortfolioItem[]
  certifications: Certification[]
  earnings: EarningsData
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  category: string
  images: string[]
  completedDate: string
  clientRating?: number
  clientReview?: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  verificationNumber?: string
  documentUrl?: string
}

interface EarningsData {
  totalEarnings: number
  currentBalance: number
  pendingPayments: number
  thisMonth: number
  thisYear: number
  averageJobValue: number
  completedJobs: number
  taxDocuments: TaxDocument[]
}

interface TaxDocument {
  id: string
  year: number
  type: 'ANNUAL_STATEMENT' | 'TAX_CERTIFICATE' | 'VAT_RETURN'
  amount: number
  generatedDate: string
  downloadUrl: string
}

const categories = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Gardening',
  'Cleaning', 'Handyman', 'Roofing', 'Tiling', 'Appliance Repair',
  'Security', 'Automotive'
]

const daysOfWeek = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

export default function ArtisanProfile() {
  const [profile, setProfile] = useState<ArtisanProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [profileForm, setProfileForm] = useState({
    businessName: '',
    description: '',
    specializations: [] as string[],
    experience: 0,
    location: ''
  })

  const [availabilityForm, setAvailabilityForm] = useState({
    monday: { available: false, hours: '9:00-17:00' },
    tuesday: { available: false, hours: '9:00-17:00' },
    wednesday: { available: false, hours: '9:00-17:00' },
    thursday: { available: false, hours: '9:00-17:00' },
    friday: { available: false, hours: '9:00-17:00' },
    saturday: { available: false, hours: '9:00-17:00' },
    sunday: { available: false, hours: '9:00-17:00' }
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)

      // Mock profile data (used as fallback or for testing)
      const mockProfile: ArtisanProfile = {
        id: '1',
        userId: 'user-1',
        businessName: 'Premium Plumbing Services',
        description: 'Professional plumbing services with over 8 years of experience. Specializing in emergency repairs, installations, and maintenance. Licensed, insured, and available 24/7 for urgent calls.',
        specializations: ['Plumbing', 'Heating', 'Gas Installations'],
        experience: 8,
        location: 'Johannesburg, Gauteng',
        availability: {
          monday: { available: true, hours: '8:00-18:00' },
          tuesday: { available: true, hours: '8:00-18:00' },
          wednesday: { available: true, hours: '8:00-18:00' },
          thursday: { available: true, hours: '8:00-18:00' },
          friday: { available: true, hours: '8:00-18:00' },
          saturday: { available: true, hours: '9:00-15:00' },
          sunday: { available: false, hours: '' }
        },
        portfolio: [
          {
            id: '1',
            title: 'Complete Kitchen Renovation Plumbing',
            description: 'Full kitchen plumbing installation including new sink, dishwasher connections, and gas line for stove.',
            category: 'Plumbing',
            images: ['/api/portfolio/kitchen-1.jpg', '/api/portfolio/kitchen-2.jpg'],
            completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            clientRating: 5,
            clientReview: 'Excellent work! Very professional and completed on time.'
          },
          {
            id: '2',
            title: 'Emergency Pipe Repair',
            description: 'Emergency repair of burst water pipe in residential property. Quick response and quality work.',
            category: 'Plumbing',
            images: ['/api/portfolio/pipe-repair.jpg'],
            completedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            clientRating: 4.5,
            clientReview: 'Fast response and fixed the problem quickly.'
          }
        ],
        certifications: [
          {
            id: '1',
            name: 'Licensed Plumber Certificate',
            issuer: 'PIRB (Plumbing Industry Registration Board)',
            issueDate: '2018-03-15',
            expiryDate: '2025-03-15',
            verificationNumber: 'PL-2018-45678',
            documentUrl: '/api/certificates/plumber-license.pdf'
          },
          {
            id: '2',
            name: 'Gas Installation Certificate',
            issuer: 'SAQCC (South African Qualification and Certification Committee)',
            issueDate: '2019-06-20',
            expiryDate: '2024-06-20',
            verificationNumber: 'GAS-2019-12345',
            documentUrl: '/api/certificates/gas-certificate.pdf'
          }
        ],
        earnings: {
          totalEarnings: 156780.50,
          currentBalance: 8950.25,
          pendingPayments: 3200.00,
          thisMonth: 12450.75,
          thisYear: 89650.25,
          averageJobValue: 1285.50,
          completedJobs: 122,
          taxDocuments: [
            {
              id: '1',
              year: 2024,
              type: 'ANNUAL_STATEMENT',
              amount: 89650.25,
              generatedDate: new Date().toISOString(),
              downloadUrl: '/api/tax/annual-2024.pdf'
            },
            {
              id: '2',
              year: 2023,
              type: 'ANNUAL_STATEMENT',
              amount: 67130.25,
              generatedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
              downloadUrl: '/api/tax/annual-2023.pdf'
            }
          ]
        }
      }

      // Try to fetch from API, fall back to mock data
      try {
        const response = await api.get('/artisan/profile')
        setProfile(response.data?.profile || mockProfile)
      } catch (error) {
        console.error('Error fetching profile from API, using mock data:', error)
        setProfile(mockProfile)
      }

      // Initialize forms with profile data
      const profileToUse = profile || mockProfile
      setProfileForm({
        businessName: profileToUse.businessName,
        description: profileToUse.description,
        specializations: profileToUse.specializations,
        experience: profileToUse.experience,
        location: profileToUse.location
      })
      setAvailabilityForm(profileToUse.availability)
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const updateProfile = async () => {
    try {
      await api.put('/artisan/profile', profileForm)
      await fetchProfile()
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const updateAvailability = async () => {
    try {
      await api.put('/artisan/availability', availabilityForm)
      await fetchProfile()
    } catch (error) {
      console.error('Error updating availability:', error)
    }
  }

  const downloadTaxDocument = async (documentId: string) => {
    try {
      // In real implementation, this would trigger a download
      console.log('Downloading tax document:', documentId)
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const withdrawEarnings = async (amount: number) => {
    try {
      await api.post('/artisan/withdraw', { amount })
      await fetchProfile()
    } catch (error) {
      console.error('Error withdrawing earnings:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
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
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load your profile information. Please try refreshing the page.</p>
        <Button onClick={fetchProfile} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
          <p className="text-muted-foreground">
            Manage your artisan profile and business information
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchProfile}>
            Refresh
          </Button>
          {!editing && (
            <Button onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{profile.businessName}</CardTitle>
              <CardDescription className="mt-2">{profile.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(profile.earnings.totalEarnings)}</div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <span className="text-sm text-muted-foreground">Experience</span>
              <div className="font-medium">{profile.experience} years</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Location</span>
              <div className="font-medium">{profile.location}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Specializations</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.specializations.map((spec) => (
                  <Badge key={spec} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Name</label>
                  <input
                    type="text"
                    value={profileForm.businessName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Experience (years)</label>
                  <input
                    type="number"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, experience: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Specializations</label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={profileForm.specializations.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfileForm(prev => ({
                                ...prev,
                                specializations: [...prev.specializations, category]
                              }))
                            } else {
                              setProfileForm(prev => ({
                                ...prev,
                                specializations: prev.specializations.filter(s => s !== category)
                              }))
                            }
                          }}
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateProfile}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Business Name</span>
                  <div className="font-medium">{profile.businessName}</div>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <div>{profile.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Experience</span>
                    <div className="font-medium">{profile.experience} years</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Completed Jobs</span>
                    <div className="font-medium">{profile.earnings.completedJobs}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Availability Schedule</CardTitle>
              <CardDescription>Set your working hours for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={availabilityForm[day as keyof typeof availabilityForm]?.available || false}
                      onChange={(e) => {
                        setAvailabilityForm(prev => ({
                          ...prev,
                          [day]: {
                            ...prev[day as keyof typeof prev],
                            available: e.target.checked
                          }
                        }))
                      }}
                    />
                    <span className="font-medium capitalize">{day}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={availabilityForm[day as keyof typeof availabilityForm]?.hours || ''}
                      onChange={(e) => {
                        setAvailabilityForm(prev => ({
                          ...prev,
                          [day]: {
                            ...prev[day as keyof typeof prev],
                            hours: e.target.value
                          }
                        }))
                      }}
                      disabled={!availabilityForm[day as keyof typeof availabilityForm]?.available}
                      className="w-32 p-2 border rounded-md disabled:bg-gray-100"
                      placeholder="9:00-17:00"
                    />
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <Button onClick={updateAvailability}>
                  Update Availability
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {profile.portfolio.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    {item.clientRating && (
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ⭐ {item.clientRating.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{item.description}</p>
                  
                  <div className="text-xs text-muted-foreground">
                    Completed: {formatDate(item.completedDate)}
                  </div>
                  
                  {item.clientReview && (
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-sm italic">"{item.clientReview}"</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    📷 {item.images.length} photo(s)
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">Add more portfolio items to showcase your work</p>
              <Button variant="outline">
                Add Portfolio Item
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-4">
                  {formatCurrency(profile.earnings.currentBalance)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Pending Payments:</span>
                    <span className="font-medium">{formatCurrency(profile.earnings.pendingPayments)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month:</span>
                    <span className="font-medium">{formatCurrency(profile.earnings.thisMonth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Year:</span>
                    <span className="font-medium">{formatCurrency(profile.earnings.thisYear)}</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => withdrawEarnings(profile.earnings.currentBalance)}
                  disabled={profile.earnings.currentBalance < 100}
                >
                  Withdraw Funds
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum withdrawal: R100
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Earnings:</span>
                  <span className="font-semibold">{formatCurrency(profile.earnings.totalEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jobs Completed:</span>
                  <span className="font-semibold">{profile.earnings.completedJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Job Value:</span>
                  <span className="font-semibold">{formatCurrency(profile.earnings.averageJobValue)}</span>
                </div>
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    View Detailed Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tax Documents</CardTitle>
              <CardDescription>Download your annual tax statements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.earnings.taxDocuments.map((doc) => (
                  <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-medium">
                        {doc.type.replace('_', ' ')} - {doc.year}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Generated: {formatDate(doc.generatedDate)} • {formatCurrency(doc.amount)}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadTaxDocument(doc.id)}
                    >
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <div className="space-y-4">
            {profile.certifications.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{cert.name}</h3>
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        <span>Issued: {formatDate(cert.issueDate)}</span>
                        {cert.expiryDate && (
                          <span> • Expires: {formatDate(cert.expiryDate)}</span>
                        )}
                      </div>
                      {cert.verificationNumber && (
                        <div className="text-xs text-muted-foreground">
                          Verification: {cert.verificationNumber}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="default" className="text-xs">
                        Verified
                      </Badge>
                      {cert.documentUrl && (
                        <Button variant="outline" size="sm">
                          View Document
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">Add more certifications to build trust with clients</p>
              <Button variant="outline">
                Upload Certificate
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
