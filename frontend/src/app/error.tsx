'use client'

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service (skip AbortError for timeouts)
    if (error.name !== 'AbortError') {
      console.error('Error boundary caught:', error);
    }
  }, [error]);

  const isTimeoutError = error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('aborted');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cream-50 to-primary-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <AlertCircle className="h-16 w-16 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          {isTimeoutError ? 'Request Timeout' : 'Oops! Something went wrong'}
        </h1>
        <p className="mb-2 text-lg text-gray-600">
          {isTimeoutError
            ? 'The request took too long to complete'
            : 'We encountered an unexpected error'}
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && error.message && !isTimeoutError && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-mono text-red-800 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-600">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Timeout Helpful Message */}
        {isTimeoutError && (
          <p className="mb-6 text-sm text-gray-500">
            Please check your internet connection and try again.
          </p>
        )}

        {/* Production Error Message */}
        {process.env.NODE_ENV === 'production' && (
          <p className="mb-6 text-sm text-gray-500">
            Don't worry, our team has been notified and we're working on it.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="btn-outline inline-flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-500">
          Need help?{' '}
          <Link
            href="/contact"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Contact support
          </Link>
        </p>

        {/* Taska Logo */}
        <div className="mt-12 flex items-center justify-center space-x-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-primary"></div>
          <span className="text-sm font-semibold text-gray-900">Taska</span>
        </div>
      </div>
    </div>
  );
}
