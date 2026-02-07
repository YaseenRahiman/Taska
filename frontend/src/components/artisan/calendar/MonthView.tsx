'use client'

import React from 'react'
import { CalendarEvent } from '@/hooks/useCalendar'
import CalendarEventCard from './CalendarEventCard'

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  getEventsForDate: (date: Date) => CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthView({
  currentDate,
  events,
  getEventsForDate,
  onDateClick,
  onEventClick,
}: MonthViewProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startDay = firstDayOfMonth.getDay() // 0-6

  const days: (Date | null)[] = []

  // Fill leading empty cells
  for (let i = 0; i < startDay; i++) {
    const prevDate = new Date(year, month, -startDay + i + 1)
    days.push(prevDate)
  }

  // Fill month days
  for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  // Fill trailing to complete last week
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i))
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date) => date.getMonth() === month

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAY_HEADERS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((date, idx) => {
          if (!date) return <div key={idx} className="border-b border-r border-gray-100 min-h-[100px]" />

          const dayEvents = getEventsForDate(date)
          const inMonth = isCurrentMonth(date)
          const todayClass = isToday(date)

          return (
            <div
              key={idx}
              className={`border-b border-r border-gray-100 min-h-[100px] md:min-h-[120px] p-1 cursor-pointer hover:bg-gray-50/50 transition-colors ${
                !inMonth ? 'bg-gray-50/30' : ''
              }`}
              onClick={() => onDateClick(date)}
            >
              {/* Date number */}
              <div className="flex justify-end mb-0.5">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                    todayClass
                      ? 'bg-primary-500 text-white font-bold'
                      : inMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => {
                      // Stop propagation is handled in the component
                      onEventClick(event)
                    }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-xs text-gray-500 px-1">
                    +{dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
