'use client'

import React from 'react'
import { CalendarEvent } from '@/hooks/useCalendar'
import CalendarEventCard from './CalendarEventCard'

interface DayViewProps {
  currentDate: Date
  getEventsForDate: (date: Date) => CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function DayView({
  currentDate,
  getEventsForDate,
  onEventClick,
}: DayViewProps) {
  const dayEvents = getEventsForDate(currentDate)

  const today = new Date()
  const isToday =
    currentDate.getDate() === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear()

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }

  const dateLabel = currentDate.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Day header */}
      <div className={`px-4 py-3 border-b ${isToday ? 'bg-primary-50' : 'bg-gray-50'}`}>
        <h3 className={`font-semibold ${isToday ? 'text-primary-700' : 'text-gray-900'}`}>
          {dateLabel}
          {isToday && <span className="ml-2 text-sm font-normal text-primary-500">(Today)</span>}
        </h3>
      </div>

      {/* All day events */}
      {dayEvents.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1.5">Events</p>
          <div className="space-y-1.5">
            {dayEvents.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hourly timeline */}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => {
          const nowHour = today.getHours()
          const isCurrentHour = isToday && hour === nowHour

          return (
            <div
              key={hour}
              className={`flex border-b border-gray-100 min-h-[48px] ${
                isCurrentHour ? 'bg-primary-50/30' : ''
              }`}
            >
              <div className="w-16 flex-shrink-0 px-2 py-1 text-right">
                <span className="text-xs text-gray-400">{formatHour(hour)}</span>
              </div>
              <div className="flex-1 border-l border-gray-100 px-2 py-1">
                {isCurrentHour && (
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <div className="flex-1 h-px bg-primary-300" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {dayEvents.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No events scheduled for this day
        </div>
      )}
    </div>
  )
}
