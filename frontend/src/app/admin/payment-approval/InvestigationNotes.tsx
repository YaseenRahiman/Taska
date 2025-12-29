'use client';

import { useState } from 'react';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentApprovalService from '@/lib/api/payment-approval';
import type { InvestigationNote } from '@/types/payment-approval.types';

interface InvestigationNotesProps {
  paymentId: string;
  notes: InvestigationNote[];
  onNoteAdded?: (note: InvestigationNote) => void;
}

export default function InvestigationNotes({
  paymentId,
  notes,
  onNoteAdded
}: InvestigationNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    if (newNote.trim().length < 10) {
      toast.error('Note must be at least 10 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      const note = await paymentApprovalService.addInvestigationNote({
        paymentId,
        note: newNote.trim(),
      });

      toast.success('Note added successfully');
      setNewNote('');

      if (onNoteAdded) {
        onNoteAdded(note);
      }
    } catch (error: any) {
      console.error('Failed to add note:', error);
      toast.error(error.response?.data?.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-gray-600" aria-hidden="true" />
        <h3 className="text-lg font-medium text-gray-900">Investigation Notes</h3>
        <span className="text-sm text-gray-500">({notes.length})</span>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an investigation note (min 10 characters)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          maxLength={1000}
          disabled={isSubmitting}
          aria-label="Investigation note"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {newNote.length}/1000 characters
          </span>
          <button
            type="submit"
            disabled={isSubmitting || newNote.trim().length < 10}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>

      {/* Notes History */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No investigation notes yet</p>
            <p className="text-sm">Add the first note above</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {note.adminName}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <time dateTime={note.createdAt}>
                          {formatDate(note.createdAt)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap pl-10">
                  {note.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
