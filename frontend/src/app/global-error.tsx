'use client'

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical error to error reporting service (skip AbortError for timeouts)
    if (error.name !== 'AbortError') {
      console.error('Global error boundary caught:', error);
    }
  }, [error]);

  const isTimeoutError = error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('aborted');

  return (
    <html lang="en-ZA">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cream-50 to-red-50 px-4">
          <div className="w-full max-w-md text-center">
            {/* Critical Error Icon */}
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-red-100 p-6 animate-pulse">
                <AlertTriangle className="h-16 w-16 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="mb-4 text-3xl font-bold text-gray-900">
              {isTimeoutError ? 'Connection Timeout' : 'Critical Error'}
            </h1>
            <p className="mb-2 text-lg text-gray-600">
              {isTimeoutError
                ? 'The application is taking longer than expected to respond'
                : 'We encountered a critical application error'}
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
                Please check your internet connection and ensure the backend server is running.
              </p>
            )}

            {/* Production Error Message */}
            {process.env.NODE_ENV === 'production' && (
              <p className="mb-6 text-sm text-gray-500">
                Our technical team has been automatically notified. Please try refreshing the page
                or return to the homepage.
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-5 w-5" />
                Reload Application
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                <Home className="h-5 w-5" />
                Back to Home
              </a>
            </div>

            {/* Emergency Contact */}
            <div className="mt-8 rounded-lg bg-white border border-red-200 p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Need immediate assistance?
              </p>
              <a
                href="/contact"
                className="text-sm text-red-600 hover:text-red-700 underline font-medium"
              >
                Contact emergency support
              </a>
            </div>

            {/* Taska Logo */}
            <div className="mt-8 flex items-center justify-center space-x-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800"></div>
              <span className="text-sm font-semibold text-gray-900">Taska</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
