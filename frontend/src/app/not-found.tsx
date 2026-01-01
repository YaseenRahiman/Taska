'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cream-50 to-primary-50 px-4">
      <div className="w-full max-w-2xl text-center">
        {/* 404 Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-primary-100 p-8">
            <FileQuestion className="h-24 w-24 text-primary-600" />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          404 - Page Not Found
        </h1>

        {/* 404 Number (Visual) */}
        <div className="mb-6">
          <div className="text-9xl font-bold text-primary-600 opacity-20" aria-hidden="true">
            404
          </div>
        </div>
        <p className="mb-8 text-lg text-gray-600">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted,
          or the link you followed may be incorrect.
        </p>

        {/* Popular Links */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Popular Pages
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/browse"
              className="flex items-center gap-2 rounded-lg border border-cream-200 p-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50"
            >
              <Search className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-900">
                Find Artisans
              </span>
            </Link>
            <Link
              href="/post-job"
              className="flex items-center gap-2 rounded-lg border border-cream-200 p-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50"
            >
              <FileQuestion className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-900">
                Post a Job
              </span>
            </Link>
            <Link
              href="/how-it-works"
              className="flex items-center gap-2 rounded-lg border border-cream-200 p-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50"
            >
              <FileQuestion className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-900">
                How It Works
              </span>
            </Link>
            <Link
              href="/categories"
              className="flex items-center gap-2 rounded-lg border border-cream-200 p-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50"
            >
              <Search className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-900">
                Browse Categories
              </span>
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.history.back()}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
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
          Still can't find what you're looking for?{' '}
          <Link
            href="/contact"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Contact our support team
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
