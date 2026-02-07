'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: string
  type: 'JOB' | 'TIME_OFF' | 'SPECIAL_HOURS'
  title: string
  startDate: string
  endDate: string | null
  status?: string
  category?: string
  client?: { name: string }
  amount?: number
  jobId?: string
  reason?: string
  note?: string
  isAvailable?: boolean
  startTime?: string
  endTime?: string
}

export interface UpcomingJob {
  id: string
  title: string
  status: string
  startDate: string | null
  endDate: string | null
  category: { name: string }
  client: { profile: { firstName: string; lastName: string } }
  bids: { id: string; amount: number }[]
}

export function useCalendar() {
  const [currentView, setCurrentView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJob[]>([])
  const [loading, setLoading] = useState(true)

  const getDateRange = useCallback(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    if (currentView === 'month') {
      // Get the first day of month's week and last day of month's week
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      // Extend to full weeks
      const startOfWeek = new Date(firstDay)
      startOfWeek.setDate(firstDay.getDate() - firstDay.getDay())
      const endOfWeek = new Date(lastDay)
      endOfWeek.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
      return {
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
      }
    } else if (currentView === 'week') {
      const day = currentDate.getDay()
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - day)
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      return {
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
      }
    } else {
      const start = new Date(currentDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(currentDate)
      end.setHours(23, 59, 59, 999)
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      }
    }
  }, [currentDate, currentView])

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const range = getDateRange()
      const [eventsData, jobsData] = await Promise.all([
        api.getCalendarEvents(range),
        api.getUpcomingJobs(),
      ])
      setEvents(Array.isArray(eventsData) ? eventsData : [])
      setUpcomingJobs(Array.isArray(jobsData) ? jobsData : [])
    } catch (err) {
      console.error('Error fetching calendar data:', err)
    } finally {
      setLoading(false)
    }
  }, [getDateRange])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const nextPeriod = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (currentView === 'month') next.setMonth(next.getMonth() + 1)
      else if (currentView === 'week') next.setDate(next.getDate() + 7)
      else next.setDate(next.getDate() + 1)
      return next
    })
  }, [currentView])

  const prevPeriod = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (currentView === 'month') next.setMonth(next.getMonth() - 1)
      else if (currentView === 'week') next.setDate(next.getDate() - 7)
      else next.setDate(next.getDate() - 1)
      return next
    })
  }, [currentView])

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const getEventsForDate = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().split('T')[0]
      return events.filter((event) => {
        const eventStart = new Date(event.startDate).toISOString().split('T')[0]
        const eventEnd = event.endDate
          ? new Date(event.endDate).toISOString().split('T')[0]
          : eventStart
        return dateStr >= eventStart && dateStr <= eventEnd
      })
    },
    [events]
  )

  return {
    currentView,
    setCurrentView,
    currentDate,
    events,
    upcomingJobs,
    loading,
    nextPeriod,
    prevPeriod,
    goToDate,
    goToToday,
    getEventsForDate,
    refreshEvents: fetchEvents,
  }
}
