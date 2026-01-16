'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { JobCompletionConfirmModal } from '@/components/jobs/JobCompletionConfirmModal'
import { JobCompletionStatus, ConfirmCompletionResponse } from '@/types/job'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Project {
  id: string
  jobId: string
  title: string
  description: string
  category: string
  amount: number
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  progress: number
  startDate: string
  estimatedCompletion: string
  actualCompletion?: string
  client: {
    name: string
    rating: number
    phone: string
    isVerified: boolean
  }
  milestones: Milestone[]
  progressUpdates: ProgressUpdate[]
  payments: Payment[]
}

interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string
  completedDate?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  paymentPercentage: number
}

interface ProgressUpdate {
  id: string
  date: string
  description: string
  photos?: string[]
  completionPercentage: number
  clientApproved?: boolean
}

interface Payment {
  id: string
  amount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  dueDate: string
  paidDate?: string
  type: 'DEPOSIT' | 'MILESTONE' | 'FINAL'
}

export default function ProjectManagement() {
  useEffect(() => {
    document.title = 'Taska - My Projects';
  }, []);

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionStatusMap, setCompletionStatusMap] = useState<Record<string, JobCompletionStatus>>({})
  const [activeTab, setActiveTab] = useState('active')

  const [updateForm, setUpdateForm] = useState({
    description: '',
    completionPercentage: 0,
    photos: [] as File[]
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await api.get('/artisan/projects')
      
      // Mock project data
      const mockProjects: Project[] = [
        {
          id: '1',
          jobId: 'job-1',
          title: 'Kitchen Sink Repair - Emergency',
          description: 'Complete kitchen sink repair with new piping and fixtures',
          category: 'Plumbing',
          amount: 1200,
          status: 'IN_PROGRESS',
          progress: 75,
          startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedCompletion: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          client: {
            name: 'Sarah Miller',
            rating: 4.8,
            phone: '+27 82 123 4567',
            isVerified: true
          },
          milestones: [
            {
              id: '1',
              title: 'Initial Assessment',
              description: 'Diagnose the problem and order parts',
              targetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              paymentPercentage: 20
            },
            {
              id: '2',
              title: 'Remove Old Fixtures',
              description: 'Remove damaged sink and piping',
              targetDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              paymentPercentage: 30
            },
            {
              id: '3',
              title: 'Install New Piping',
              description: 'Install new pipes and connections',
              targetDate: new Date().toISOString(),
              status: 'IN_PROGRESS',
              paymentPercentage: 30
            },
            {
              id: '4',
              title: 'Final Installation',
              description: 'Install new sink and test system',
              targetDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'PENDING',
              paymentPercentage: 20
            }
          ],
          progressUpdates: [
            {
              id: '1',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              description: 'Started project. Identified the main issue with corroded pipes under the sink.',
              completionPercentage: 20,
              clientApproved: true
            },
            {
              id: '2',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              description: 'Removed old fixtures and piping. Ordered new parts from supplier.',
              photos: ['/api/images/progress-1.jpg', '/api/images/progress-2.jpg'],
              completionPercentage: 50,
              clientApproved: true
            },
            {
              id: '3',
              date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              description: 'Installing new piping system. Making good progress, should be done by tomorrow.',
              completionPercentage: 75,
              clientApproved: false
            }
          ],
          payments: [
            {
              id: '1',
              amount: 240,
              status: 'PAID',
              dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              paidDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'DEPOSIT'
            },
            {
              id: '2',
              amount: 360,
              status: 'PENDING',
              dueDate: new Date().toISOString(),
              type: 'MILESTONE'
            },
            {
              id: '3',
              amount: 600,
              status: 'PENDING',
              dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'FINAL'
            }
          ]
        },
        {
          id: '2',
          jobId: 'job-2',
          title: 'Bedroom Electrical Installation',
          description: 'Install additional outlets and ceiling fan wiring',
          category: 'Electrical',
          amount: 2800,
          status: 'COMPLETED',
          progress: 100,
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedCompletion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          actualCompletion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          client: {
            name: 'John Davidson',
            rating: 4.5,
            phone: '+27 83 987 6543',
            isVerified: true
          },
          milestones: [
            {
              id: '1',
              title: 'Planning & Permits',
              description: 'Plan installation and obtain COC',
              targetDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
              completedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              paymentPercentage: 20
            },
            {
              id: '2',
              title: 'Wiring Installation',
              description: 'Run new electrical wiring',
              targetDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              completedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              paymentPercentage: 50
            },
            {
              id: '3',
              title: 'Final Installation',
              description: 'Install outlets and ceiling fan',
              targetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              paymentPercentage: 30
            }
          ],
          progressUpdates: [
            {
              id: '1',
              date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              description: 'Completed planning phase and obtained necessary permits.',
              completionPercentage: 20,
              clientApproved: true
            },
            {
              id: '2',
              date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              description: 'All new wiring installed and tested. Ready for final installations.',
              completionPercentage: 70,
              clientApproved: true
            },
            {
              id: '3',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              description: 'Project completed successfully. All outlets and ceiling fan installed and working.',
              completionPercentage: 100,
              clientApproved: true
            }
          ],
          payments: [
            {
              id: '1',
              amount: 560,
              status: 'PAID',
              dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              paidDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'DEPOSIT'
            },
            {
              id: '2',
              amount: 1400,
              status: 'PAID',
              dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              paidDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'MILESTONE'
            },
            {
              id: '3',
              amount: 840,
              status: 'PAID',
              dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              paidDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'FINAL'
            }
          ]
        }
      ]
      
      const projectsData = response.data?.projects || mockProjects
      setProjects(projectsData)

      // Fetch completion status for IN_PROGRESS projects
      const inProgressProjects = projectsData.filter((p: Project) => p.status === 'IN_PROGRESS')
      if (inProgressProjects.length > 0) {
        fetchCompletionStatuses(inProgressProjects.map((p: Project) => p.jobId))
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletionStatuses = useCallback(async (jobIds: string[]) => {
    try {
      const statusPromises = jobIds.map(async (jobId) => {
        try {
          const status = await api.getJobCompletionStatus(jobId)
          return { jobId, status }
        } catch {
          return { jobId, status: null }
        }
      })

      const results = await Promise.all(statusPromises)
      const statusMap: Record<string, JobCompletionStatus> = {}

      results.forEach(({ jobId, status }) => {
        if (status) {
          statusMap[jobId] = status
        }
      })

      setCompletionStatusMap(statusMap)
    } catch (error) {
      console.error('Error fetching completion statuses:', error)
    }
  }, [])

  const handleCompletionSuccess = useCallback((response: ConfirmCompletionResponse) => {
    // Refresh project data
    fetchProjects()
    setShowCompletionModal(false)
    setSelectedProject(null)
  }, [])

  const openCompletionModal = useCallback((project: Project) => {
    setSelectedProject(project)
    setShowCompletionModal(true)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default'
      case 'IN_PROGRESS': return 'secondary'
      case 'ON_HOLD': return 'outline'
      case 'CANCELLED': return 'destructive'
      case 'OVERDUE': return 'destructive'
      case 'PENDING': return 'outline'
      case 'PAID': return 'default'
      default: return 'secondary'
    }
  }

  const getFilteredProjects = () => {
    switch (activeTab) {
      case 'active':
        return projects.filter(project => ['IN_PROGRESS', 'ON_HOLD'].includes(project.status))
      case 'completed':
        return projects.filter(project => project.status === 'COMPLETED')
      case 'all':
        return projects
      default:
        return projects
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const submitProgressUpdate = async (projectId: string) => {
    try {
      const updateData = {
        description: updateForm.description,
        completionPercentage: updateForm.completionPercentage,
        photos: updateForm.photos // In real app, upload files first
      }
      
      await api.post(`/projects/${projectId}/progress`, updateData)
      await fetchProjects()
      
      // Reset form
      setUpdateForm({
        description: '',
        completionPercentage: 0,
        photos: []
      })
      setShowUpdateModal(false)
      setSelectedProject(null)
    } catch (error) {
      console.error('Error submitting progress update:', error)
    }
  }

  const requestPayment = async (projectId: string, milestoneId: string) => {
    try {
      await api.post(`/projects/${projectId}/request-payment`, {
        milestoneId
      })
      await fetchProjects()
    } catch (error) {
      console.error('Error requesting payment:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ArtisanNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Projects</h1>
          <p className="text-gray-600">
            Manage your active projects and track progress
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchProjects}>
            Refresh
          </Button>
          <Button 
            onClick={() => setShowUpdateModal(true)}
            disabled={!selectedProject}
          >
            Add Progress Update
          </Button>
        </div>
      </div>

      {/* Project Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active Projects ({projects.filter(p => ['IN_PROGRESS', 'ON_HOLD'].includes(p.status)).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({projects.filter(p => p.status === 'COMPLETED').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Projects ({projects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {getFilteredProjects().length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {getFilteredProjects().map((project) => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer transition-shadow ${
                    selectedProject?.id === project.id ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">{project.category}</Badge>
                          <Badge variant={getStatusVariant(project.status)} className="text-xs">
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{formatCurrency(project.amount)}</div>
                        <div className="text-sm text-muted-foreground">{project.progress}% Complete</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Client Information */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Client</span>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium">{project.client.name}</span>
                          {project.client.isVerified && (
                            <span className="text-blue-500">✓</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ⭐ {project.client.rating.toFixed(1)} • {project.client.phone}
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <div className="font-medium">{formatDate(project.startDate)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {project.status === 'COMPLETED' ? 'Completed:' : 'Due:'}
                        </span>
                        <div className="font-medium">
                          {project.status === 'COMPLETED' && project.actualCompletion 
                            ? formatDate(project.actualCompletion)
                            : formatDate(project.estimatedCompletion)
                          }
                        </div>
                      </div>
                    </div>

                    {/* Completion Status for IN_PROGRESS projects */}
                    {project.status === 'IN_PROGRESS' && completionStatusMap[project.jobId] && (
                      <div className="pt-2 pb-1 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">Client confirmed:</span>
                          {completionStatusMap[project.jobId].clientConfirmed ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Your confirmation:</span>
                          {completionStatusMap[project.jobId].artisanConfirmed ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProject(project)
                            setShowUpdateModal(true)
                          }}
                          disabled={project.status === 'COMPLETED'}
                        >
                          Update Progress
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                          Message Client
                        </Button>
                      </div>

                      {/* Confirm Completion Button for IN_PROGRESS projects */}
                      {project.status === 'IN_PROGRESS' && (
                        <Button
                          className={`w-full ${
                            completionStatusMap[project.jobId]?.artisanConfirmed
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openCompletionModal(project)
                          }}
                          disabled={completionStatusMap[project.jobId]?.artisanConfirmed}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {completionStatusMap[project.jobId]?.artisanConfirmed
                            ? 'Completion Confirmed'
                            : 'Confirm Completion'}
                        </Button>
                      )}

                      {project.payments.some(p => p.status === 'PENDING') && (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Find next milestone payment
                            const pendingPayment = project.payments.find(p => p.status === 'PENDING')
                            if (pendingPayment) {
                              requestPayment(project.id, pendingPayment.id)
                            }
                          }}
                        >
                          Request Payment ({formatCurrency(project.payments.find(p => p.status === 'PENDING')?.amount || 0)})
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No projects found for this filter.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {activeTab === 'active' && 'Active projects will appear here when clients accept your bids.'}
                  {activeTab === 'completed' && 'Completed projects will appear here.'}
                  {activeTab === 'all' && 'All your projects will be listed here.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Selected Project Details */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Project Details: {selectedProject.title}</CardTitle>
            <CardDescription>{selectedProject.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="timeline" className="space-y-4">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="progress">Progress Updates</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-4">
                <div className="space-y-4">
                  {selectedProject.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-start space-x-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          milestone.status === 'COMPLETED' 
                            ? 'bg-green-500 border-green-500' 
                            : milestone.status === 'IN_PROGRESS'
                            ? 'bg-blue-500 border-blue-500'
                            : milestone.status === 'OVERDUE'
                            ? 'bg-red-500 border-red-500'
                            : 'bg-white border-gray-300'
                        }`}></div>
                        {index < selectedProject.milestones.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {formatDate(milestone.targetDate)}
                              {milestone.completedDate && (
                                <span> • Completed: {formatDate(milestone.completedDate)}</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusVariant(milestone.status)} className="text-xs">
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {milestone.paymentPercentage}% payment
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <div className="space-y-4">
                  {selectedProject.progressUpdates.map((update) => (
                    <Card key={update.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(update.date)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {update.completionPercentage}% Complete
                            </Badge>
                            {update.clientApproved !== undefined && (
                              <Badge 
                                variant={update.clientApproved ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                {update.clientApproved ? 'Approved' : 'Pending Approval'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm">{update.description}</p>
                        {update.photos && update.photos.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">
                              📷 {update.photos.length} photo(s) attached
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <div className="space-y-3">
                  {selectedProject.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.type.replace('_', ' ')} • Due: {formatDate(payment.dueDate)}
                          {payment.paidDate && (
                            <span> • Paid: {formatDate(payment.paidDate)}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Progress Update Modal */}
      {showUpdateModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Progress Update</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={updateForm.description}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Describe the work completed..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Completion Percentage: {updateForm.completionPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={updateForm.completionPercentage}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, completionPercentage: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Photos (Optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, photos: Array.from(e.target.files || []) }))}
                  className="w-full p-2 border rounded-md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload progress photos to share with the client
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUpdateModal(false)
                  setUpdateForm({ description: '', completionPercentage: 0, photos: [] })
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => submitProgressUpdate(selectedProject.id)}
                disabled={!updateForm.description.trim()}
              >
                Submit Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Job Completion Confirmation Modal */}
      {showCompletionModal && selectedProject && (
        <JobCompletionConfirmModal
          jobId={selectedProject.jobId}
          jobTitle={selectedProject.title}
          isClient={false}
          otherPartyName={selectedProject.client.name}
          otherPartyConfirmed={completionStatusMap[selectedProject.jobId]?.clientConfirmed ?? false}
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false)
            setSelectedProject(null)
          }}
          onSuccess={handleCompletionSuccess}
        />
      )}
        </div>
      </div>
    </div>
  )
}
