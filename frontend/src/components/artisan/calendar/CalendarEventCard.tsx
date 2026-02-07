'use client'

import React from 'react'
import { CalendarEvent } from '@/hooks/useCalendar'

interface CalendarEventCardProps {
  event: CalendarEvent
  compact?: boolean
  onClick?: () => void
}

function getEventColor(event: CalendarEvent) {
  if (event.type === 'TIME_OFF') return 'bg-red-100 text-red-800 border-red-200'
  if (event.type === 'SPECIAL_HOURS') return 'bg-orange-100 text-orange-800 border-orange-200'
  // Job statuses
  if (event.status === 'IN_PROGRESS') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (event.status === 'COMPLETED') return 'bg-gray-100 text-gray-600 border-gray-200'
  return 'bg-green-100 text-green-800 border-green-200' // upcoming/open
}

function getEventDot(event: CalendarEvent) {
  if (event.type === 'TIME_OFF') return 'bg-red-500'
  if (event.type === 'SPECIAL_HOURS') return 'bg-orange-500'
  if (event.status === 'IN_PROGRESS') return 'bg-blue-500'
  if (event.status === 'COMPLETED') return 'bg-gray-400'
  return 'bg-green-500'
}

export default function CalendarEventCard({ event, compact, onClick }: CalendarEventCardProps) {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate border ${getEventColor(event)} hover:opacity-80 transition-opacity`}
      >
        {event.title}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border ${getEventColor(event)} hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-start gap-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getEventDot(event)}`} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{event.title}</p>
          {event.client && (
            <p className="text-xs opacity-75 mt-0.5">{event.client.name}</p>
          )}
          {event.category && (
            <p className="text-xs opacity-75">{event.category}</p>
          )}
          {event.note && (
            <p className="text-xs opacity-75 mt-0.5 truncate">{event.note}</p>
          )}
        </div>
      </div>
    </button>
  )
}

export { getEventColor, getEventDot }
