'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { CalendarView } from '@/hooks/useCalendar'

interface CalendarViewToggleProps {
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
}

export default function CalendarViewToggle({ currentView, onViewChange }: CalendarViewToggleProps) {
  const views: { value: CalendarView; label: string }[] = [
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
  ]

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {views.map((view) => (
        <button
          key={view.value}
          onClick={() => onViewChange(view.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentView === view.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
