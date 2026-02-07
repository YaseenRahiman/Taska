'use client'

import React from 'react'
import { CalendarEvent } from '@/hooks/useCalendar'
import CalendarEventCard from './CalendarEventCard'

interface WeekViewProps {
  currentDate: Date
  getEventsForDate: (date: Date) => CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeekView({
  currentDate,
  getEventsForDate,
  onDateClick,
  onEventClick,
}: WeekViewProps) {
  // Get start of the week (Sunday)
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    days.push(d)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {days.map((date, idx) => (
          <div
            key={idx}
            className={`px-2 py-3 text-center border-r last:border-r-0 border-gray-100 ${
              isToday(date) ? 'bg-primary-50' : 'bg-gray-50'
            }`}
          >
            <div className="text-xs font-medium text-gray-500 uppercase">
              {WEEKDAY_HEADERS[idx]}
            </div>
            <div
              className={`text-lg font-semibold mt-0.5 ${
                isToday(date) ? 'text-primary-600' : 'text-gray-900'
              }`}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Event columns */}
      <div className="grid grid-cols-7 min-h-[400px]">
        {days.map((date, idx) => {
          const dayEvents = getEventsForDate(date)
          return (
            <div
              key={idx}
              className={`border-r last:border-r-0 border-gray-100 p-1.5 cursor-pointer hover:bg-gray-50/50 transition-colors ${
                isToday(date) ? 'bg-primary-50/20' : ''
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onEventClick(event)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
