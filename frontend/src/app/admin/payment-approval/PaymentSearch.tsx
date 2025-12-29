'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface PaymentSearchProps {
  onSearch: (query: string, searchBy: 'paymentId' | 'clientName' | 'artisanName' | 'jobId') => void;
  onClear?: () => void;
}

const searchOptions = [
  { value: 'paymentId' as const, label: 'Payment ID' },
  { value: 'clientName' as const, label: 'Client Name' },
  { value: 'artisanName' as const, label: 'Artisan Name' },
  { value: 'jobId' as const, label: 'Job ID' },
];

export default function PaymentSearch({ onSearch, onClear }: PaymentSearchProps) {
  const [query, setQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'paymentId' | 'clientName' | 'artisanName' | 'jobId'>('paymentId');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), searchBy);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      {/* Search By Dropdown */}
      <select
        value={searchBy}
        onChange={(e) => setSearchBy(e.target.value as typeof searchBy)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        aria-label="Search field"
      >
        {searchOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Search Input */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search by ${searchOptions.find(o => o.value === searchBy)?.label.toLowerCase()}...`}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search query"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Button */}
      <button
        type="submit"
        disabled={!query.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Search
      </button>
    </form>
  );
}
