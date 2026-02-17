'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Menu, X } from 'lucide-react';

interface PublicNavbarProps {
  showBackButton?: boolean;
}

export default function PublicNavbar({ showBackButton = true }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cream-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container-wide flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          {showBackButton && <ArrowLeft className="h-5 w-5" />}
          <div className="h-8 w-8 rounded-lg bg-gradient-primary"></div>
          <span className="text-xl font-bold text-gray-900">Taska</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/browse" className="nav-link">
            Find Artisans
          </Link>
          <Link href="/categories" className="nav-link">
            Categories
          </Link>
          <Link href="/how-it-works" className="nav-link">
            How It Works
          </Link>
          <Link href="/about" className="nav-link">
            About
          </Link>
        </div>

        {/* Desktop Auth Links */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/auth/login" className="nav-link">
            Sign In
          </Link>
          <Link href="/auth/register" className="btn-primary">
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden relative z-50 inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 active:bg-cream-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          data-testid="mobile-menu-button"
        >
          <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open main menu'}</span>
          {mobileMenuOpen ? (
            <X className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="block h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cream-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/browse"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-cream-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Artisans
            </Link>
            <Link
              href="/categories"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-cream-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categories
            </Link>
            <Link
              href="/how-it-works"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-cream-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-cream-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/auth/login"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-cream-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
