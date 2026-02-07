'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { X, Loader2 } from 'lucide-react'

interface TimeOffModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  initialDate?: Date
}

const REASONS = [
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'OTHER', label: 'Other' },
]

export default function TimeOffModal({ isOpen, onClose, onCreated, initialDate }: TimeOffModalProps) {
  const [startDate, setStartDate] = useState(
    initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [reason, setReason] = useState('PERSONAL')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date')
      return
    }

    try {
      setSaving(true)
      await api.createTimeOff({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason,
        note: note || undefined,
      })
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create time off')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Time Off</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-400 resize-none"
              placeholder="Add a note..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Time Off'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
