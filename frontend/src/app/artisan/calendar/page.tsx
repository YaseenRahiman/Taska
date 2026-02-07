'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar'
import { Button } from '@/components/ui/button'
import { useCalendar, CalendarEvent } from '@/hooks/useCalendar'
import CalendarViewToggle from '@/components/artisan/calendar/CalendarViewToggle'
import MonthView from '@/components/artisan/calendar/MonthView'
import WeekView from '@/components/artisan/calendar/WeekView'
import DayView from '@/components/artisan/calendar/DayView'
import CalendarSidebar from '@/components/artisan/calendar/CalendarSidebar'
import TimeOffModal from '@/components/artisan/calendar/TimeOffModal'
import SpecialHoursModal from '@/components/artisan/calendar/SpecialHoursModal'
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Clock,
  Loader2,
} from 'lucide-react'

export default function ArtisanCalendarPage() {
  const router = useRouter()
  const {
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
    refreshEvents,
  } = useCalendar()

  const [showTimeOffModal, setShowTimeOffModal] = useState(false)
  const [showSpecialHoursModal, setShowSpecialHoursModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    if (currentView === 'month') {
      goToDate(date)
      setCurrentView('day')
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'JOB' && event.jobId) {
      router.push(`/artisan/jobs/${event.jobId}`)
    }
  }

  const getHeaderLabel = () => {
    if (currentView === 'month') {
      return currentDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
    }
    if (currentView === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      const startStr = startOfWeek.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
      const endStr = endOfWeek.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
      return `${startStr} - ${endStr}`
    }
    return currentDate.toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ArtisanNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">Manage your schedule and upcoming jobs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDate(new Date())
                setShowSpecialHoursModal(true)
              }}
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Special Hours
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedDate(new Date())
                setShowTimeOffModal(true)
              }}
            >
              <CalendarPlus className="w-4 h-4 mr-1.5" />
              Time Off
            </Button>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevPeriod}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextPeriod}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{getHeaderLabel()}</h2>
          </div>
          <CalendarViewToggle currentView={currentView} onViewChange={setCurrentView} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Calendar View */}
          <div>
            {loading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-muted-foreground">Loading calendar...</p>
              </div>
            ) : (
              <>
                {currentView === 'month' && (
                  <MonthView
                    currentDate={currentDate}
                    events={events}
                    getEventsForDate={getEventsForDate}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                  />
                )}
                {currentView === 'week' && (
                  <WeekView
                    currentDate={currentDate}
                    getEventsForDate={getEventsForDate}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                  />
                )}
                {currentView === 'day' && (
                  <DayView
                    currentDate={currentDate}
                    getEventsForDate={getEventsForDate}
                    onEventClick={handleEventClick}
                  />
                )}
              </>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-400" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-400" />
                <span>Upcoming</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gray-300" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-400" />
                <span>Time Off</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-400" />
                <span>Special Hours</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="order-first lg:order-last">
            <CalendarSidebar upcomingJobs={upcomingJobs} loading={loading} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <TimeOffModal
        isOpen={showTimeOffModal}
        onClose={() => setShowTimeOffModal(false)}
        onCreated={refreshEvents}
        initialDate={selectedDate}
      />
      <SpecialHoursModal
        isOpen={showSpecialHoursModal}
        onClose={() => setShowSpecialHoursModal(false)}
        onCreated={refreshEvents}
        initialDate={selectedDate}
      />
    </div>
  )
}
