'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UpcomingJob } from '@/hooks/useCalendar'
import { Briefcase, Clock, ArrowRight, Calendar } from 'lucide-react'

interface CalendarSidebarProps {
  upcomingJobs: UpcomingJob[]
  loading: boolean
}

export default function CalendarSidebar({ upcomingJobs, loading }: CalendarSidebarProps) {
  const router = useRouter()

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Upcoming Jobs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : upcomingJobs.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-muted-foreground">No upcoming jobs</p>
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => router.push('/artisan/jobs')}
            >
              Browse available jobs
            </Button>
          </div>
        ) : (
          <>
            {upcomingJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => router.push(`/artisan/jobs/${job.id}`)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {job.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {job.client?.profile?.firstName} {job.client?.profile?.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {job.category?.name}
                      </Badge>
                      {job.startDate && (
                        <span className="text-xs text-gray-500">
                          {formatDate(job.startDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  {job.bids?.[0] && (
                    <span className="text-sm font-semibold text-primary-600 flex-shrink-0">
                      {formatCurrency(Number(job.bids[0].amount))}
                    </span>
                  )}
                </div>
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => router.push('/artisan/jobs')}
            >
              View All Jobs
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
