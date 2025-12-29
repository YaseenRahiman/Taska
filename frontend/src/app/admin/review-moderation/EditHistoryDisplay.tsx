'use client';

import { EditHistory } from '@/types/review-moderation.types';
import { Clock, User, Star, FileText } from 'lucide-react';

interface EditHistoryDisplayProps {
  history: EditHistory[];
  loading?: boolean;
}

export default function EditHistoryDisplay({ history, loading }: EditHistoryDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDiff = (previous: string, current: string) => {
    // Simple diff highlighting - could be enhanced with proper diff library
    if (previous === current) return null;

    return (
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-medium text-red-800 mb-1">Previous:</p>
          <p className="text-sm text-red-900 whitespace-pre-wrap">{previous}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs font-medium text-green-800 mb-1">Current:</p>
          <p className="text-sm text-green-900 whitespace-pre-wrap">{current}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>No edit history</p>
        <p className="text-sm mt-1">This review has not been edited</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline items */}
        <div className="space-y-6">
          {history.map((edit, index) => {
            const editorName = edit.editor?.profile
              ? `${edit.editor.profile.firstName || ''} ${edit.editor.profile.lastName || ''}`.trim()
              : edit.editor?.email || 'Unknown Editor';

            return (
              <div key={edit.id} className="relative pl-12">
                {/* Timeline dot */}
                <div className="absolute left-4 top-2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow" />

                {/* Edit card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-full">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{editorName}</p>
                        <p className="text-xs text-gray-500">{edit.editor?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(edit.createdAt)}
                    </div>
                  </div>

                  {/* Edit reason */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-blue-800 mb-1">Edit Reason:</p>
                    <p className="text-sm text-blue-900">{edit.editReason}</p>
                  </div>

                  {/* Rating changes */}
                  {edit.previousRating !== edit.newRating && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        Rating Change:
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-red-600 font-medium">{edit.previousRating}/5</span>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < edit.previousRating ? 'text-red-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-green-600 font-medium">{edit.newRating}/5</span>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < edit.newRating ? 'text-green-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content diff */}
                  {edit.previousContent !== edit.newContent && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Content Changes:</p>
                      {getDiff(edit.previousContent, edit.newContent)}
                    </div>
                  )}

                  {/* No changes indicator */}
                  {edit.previousRating === edit.newRating && edit.previousContent === edit.newContent && (
                    <div className="text-sm text-gray-500 italic">
                      No changes detected (metadata update only)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
