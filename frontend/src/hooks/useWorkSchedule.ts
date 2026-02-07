'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface ScheduleDay {
  dayOfWeek: string
  isAvailable: boolean
  startTime: string
  endTime: string
  breakStart: string | null
  breakEnd: string | null
}

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const DEFAULT_SCHEDULE: ScheduleDay[] = DAYS_ORDER.map((day) => ({
  dayOfWeek: day,
  isAvailable: day !== 'SATURDAY' && day !== 'SUNDAY',
  startTime: '09:00',
  endTime: '17:00',
  breakStart: null,
  breakEnd: null,
}))

export function useWorkSchedule() {
  const [schedule, setSchedule] = useState<ScheduleDay[]>(DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getWorkSchedule()
      if (Array.isArray(data) && data.length > 0) {
        // Sort by day order and ensure all 7 days present
        const mapped = DAYS_ORDER.map((day) => {
          const found = data.find((d: any) => d.dayOfWeek === day)
          return found
            ? {
                dayOfWeek: found.dayOfWeek,
                isAvailable: found.isAvailable,
                startTime: found.startTime,
                endTime: found.endTime,
                breakStart: found.breakStart || null,
                breakEnd: found.breakEnd || null,
              }
            : DEFAULT_SCHEDULE.find((d) => d.dayOfWeek === day)!
        })
        setSchedule(mapped)
      }
    } catch (err: any) {
      console.error('Error fetching work schedule:', err)
      setError('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const saveSchedule = useCallback(async (updatedSchedule?: ScheduleDay[]) => {
    const toSave = updatedSchedule || schedule
    try {
      setSaving(true)
      setError(null)
      await api.saveWorkSchedule(toSave)
      setSchedule(toSave)
    } catch (err: any) {
      console.error('Error saving work schedule:', err)
      setError('Failed to save schedule')
      throw err
    } finally {
      setSaving(false)
    }
  }, [schedule])

  const updateDay = useCallback((dayOfWeek: string, updates: Partial<ScheduleDay>) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...updates } : day
      )
    )
  }, [])

  return {
    schedule,
    loading,
    saving,
    error,
    saveSchedule,
    updateDay,
    refreshSchedule: fetchSchedule,
  }
}
