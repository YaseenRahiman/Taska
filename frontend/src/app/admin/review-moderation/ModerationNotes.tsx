'use client';

import { useState } from 'react';
import { ModerationNote, AddModerationNoteRequest } from '@/types/review-moderation.types';
import { reviewModerationApi } from '@/lib/api/review-moderation';
import { MessageSquare, User, Clock, Send, AlertCircle } from 'lucide-react';

interface ModerationNotesProps {
  reviewId: string;
  notes: ModerationNote[];
  onNoteAdded: () => void;
}

export default function ModerationNotes({ reviewId, notes, onNoteAdded }: ModerationNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddNote = async () => {
    if (newNote.trim().length < 10) {
      setError('Note must be at least 10 characters');
      return;
    }
    if (newNote.trim().length > 1000) {
      setError('Note must not exceed 1000 characters');
      return;
    }

    setAdding(true);
    try {
      await reviewModerationApi.addModerationNote(reviewId, {
        content: newNote.trim(),
      });
      setNewNote('');
      setError('');
      onNoteAdded();
    } catch (error) {
      console.error('Failed to add note:', error);
      setError('Failed to add note. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Add Moderation Note
        </h3>
        <div className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => {
              setNewNote(e.target.value);
              setError('');
            }}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Add a moderation note (visible only to admins)..."
          />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${newNote.length > 1000 ? 'text-red-600' : 'text-gray-500'}`}
              >
                {newNote.length} / 1000
              </span>
              <button
                onClick={handleAddNote}
                disabled={adding || !newNote.trim()}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Notes History</h3>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No moderation notes yet</p>
            <p className="text-sm mt-1">Add a note to track moderation decisions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const adminName = note.admin?.profile
                ? `${note.admin.profile.firstName || ''} ${note.admin.profile.lastName || ''}`.trim()
                : note.admin?.email || 'Unknown Admin';

              return (
                <div
                  key={note.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-full">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{adminName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(note.createdAt)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap pl-8">{note.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
