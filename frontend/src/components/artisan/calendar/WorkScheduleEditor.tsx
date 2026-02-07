'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkSchedule, ScheduleDay } from '@/hooks/useWorkSchedule'
import { Clock, Save, Loader2 } from 'lucide-react'

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

export default function WorkScheduleEditor() {
  const { schedule, loading, saving, error, saveSchedule, updateDay } = useWorkSchedule()
  const [showBreaks, setShowBreaks] = useState(false)

  const handleSave = async () => {
    try {
      await saveSchedule()
    } catch {
      // Error already handled by hook
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-muted-foreground">Loading schedule...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Work Schedule
            </CardTitle>
            <CardDescription className="mt-1">
              Set your weekly working hours. Clients see when you're available.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBreaks(!showBreaks)}
          >
            {showBreaks ? 'Hide Breaks' : 'Show Breaks'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Header row */}
        <div className="hidden md:grid md:grid-cols-[140px_60px_1fr_1fr] gap-3 items-center px-2 text-xs font-medium text-gray-500 uppercase">
          <span>Day</span>
          <span>Active</span>
          <span>Start</span>
          <span>End</span>
        </div>

        {schedule.map((day) => (
          <DayRow
            key={day.dayOfWeek}
            day={day}
            showBreaks={showBreaks}
            onUpdate={(updates) => updateDay(day.dayOfWeek, updates)}
          />
        ))}

        <div className="pt-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {schedule.filter((d) => d.isAvailable).length} days active
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Schedule
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DayRow({
  day,
  showBreaks,
  onUpdate,
}: {
  day: ScheduleDay
  showBreaks: boolean
  onUpdate: (updates: Partial<ScheduleDay>) => void
}) {
  const isWeekend = day.dayOfWeek === 'SATURDAY' || day.dayOfWeek === 'SUNDAY'

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        day.isAvailable ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
      }`}
    >
      <div className="grid grid-cols-[1fr_auto] md:grid-cols-[140px_60px_1fr_1fr] gap-3 items-center">
        {/* Day name */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{DAY_LABELS[day.dayOfWeek]}</span>
          {isWeekend && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              Weekend
            </Badge>
          )}
        </div>

        {/* Toggle */}
        <div className="flex justify-end md:justify-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={day.isAvailable}
              onChange={(e) => onUpdate({ isAvailable: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {/* Start time */}
        <div className="col-span-2 md:col-span-1">
          <input
            type="time"
            value={day.startTime}
            onChange={(e) => onUpdate({ startTime: e.target.value })}
            disabled={!day.isAvailable}
            className="w-full px-3 py-1.5 border rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
          />
        </div>

        {/* End time */}
        <div className="col-span-2 md:col-span-1">
          <input
            type="time"
            value={day.endTime}
            onChange={(e) => onUpdate({ endTime: e.target.value })}
            disabled={!day.isAvailable}
            className="w-full px-3 py-1.5 border rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
          />
        </div>
      </div>

      {/* Break times */}
      {showBreaks && day.isAvailable && (
        <div className="mt-2 pt-2 border-t border-dashed grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Break Start</label>
            <input
              type="time"
              value={day.breakStart || ''}
              onChange={(e) => onUpdate({ breakStart: e.target.value || null })}
              className="w-full px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="12:00"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Break End</label>
            <input
              type="time"
              value={day.breakEnd || ''}
              onChange={(e) => onUpdate({ breakEnd: e.target.value || null })}
              className="w-full px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="13:00"
            />
          </div>
        </div>
      )}
    </div>
  )
}
