'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { CalendarDays, Clock, Briefcase, ArrowRight, Loader2, XCircle } from 'lucide-react'

interface TodayData {
  date: string
  dayOfWeek: string
  workHours: {
    isAvailable: boolean
    startTime?: string
    endTime?: string
    breakStart?: string | null
    breakEnd?: string | null
    reason: string
    note?: string
    timeOff?: any
  }
  jobs: {
    id: string
    title: string
    status: string
    startDate: string | null
    endDate: string | null
    category?: string
    client: { name: string }
    amount?: number
  }[]
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

export default function TodayScheduleWidget() {
  const router = useRouter()
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const result = await api.getTodaySchedule()
        setData(result)
      } catch (err) {
        console.error('Error fetching today schedule:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchToday()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { workHours, jobs, dayOfWeek } = data

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary-500" />
            Today&apos;s Schedule
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {DAY_LABELS[dayOfWeek] || dayOfWeek}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Work Hours */}
        {workHours.isAvailable ? (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {workHours.startTime} - {workHours.endTime}
            </span>
            {workHours.breakStart && (
              <span className="text-xs text-gray-400">
                (Break: {workHours.breakStart}-{workHours.breakEnd})
              </span>
            )}
            {workHours.reason === 'SPECIAL_HOURS' && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs px-1.5">
                Special
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="w-4 h-4" />
            <span>
              {workHours.reason === 'TIME_OFF'
                ? 'Time Off Today'
                : 'Not Available Today'}
            </span>
          </div>
        )}

        {/* Today's Jobs */}
        {jobs.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">
              {jobs.length} Job{jobs.length > 1 ? 's' : ''} Today
            </p>
            {jobs.slice(0, 3).map((job) => (
              <button
                key={job.id}
                onClick={() => router.push(`/artisan/jobs/${job.id}`)}
                className="w-full text-left p-2 rounded-md border border-gray-100 hover:border-primary-200 hover:bg-primary-50/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.client.name}</p>
                  </div>
                  <Badge
                    className={`text-xs flex-shrink-0 ml-2 ${
                      job.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-green-100 text-green-700 border-green-200'
                    }`}
                  >
                    {job.status.replace('_', ' ')}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No jobs scheduled for today</p>
        )}

        {/* Link to calendar */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push('/artisan/calendar')}
        >
          Open Calendar
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
