'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Star, Users, Shield, Clock, Menu, X } from 'lucide-react';
import { useState } from 'react';

// Note: metadata export only works in server components, moved to layout or remove if using 'use client'
// export const metadata: Metadata = {
//   title: 'Home',
//   description: 'Find trusted artisans for your home improvement projects across South Africa.',
// };

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-cream-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container-wide flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary"></div>
            <span className="text-xl font-bold text-gray-900">Taska</span>
          </div>

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
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            data-testid="mobile-menu"
          >
            <span className="sr-only">Open main menu</span>
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
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-50 to-primary-50 py-20 sm:py-32">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-hero font-bold tracking-tight text-gray-900">
              Connect with{' '}
              <span className="text-primary-600">Skilled Artisans</span>{' '}
              across South Africa
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Find trusted professionals for your home improvement projects. From plumbing to electrical work, 
              carpentry to painting - connect with verified artisans in your area.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
                Post Your Job
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/browse" className="btn-outline text-lg px-8 py-3">
                Find Artisans
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6" aria-hidden="true">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary-300 to-accent-400 opacity-30"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-section font-bold tracking-tight text-gray-900">
              Why Choose Taska?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We make it easy to find trusted artisans and complete your projects with confidence.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-primary-600">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <dt className="text-xl font-semibold leading-7 text-gray-900">
                  Verified Professionals
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    All artisans are background-checked and verified. View ratings, reviews, and portfolios 
                    before making your choice.
                  </p>
                </dd>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-secondary-600">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <dt className="text-xl font-semibold leading-7 text-gray-900">
                  Quick Responses
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Get multiple quotes within hours. Our platform ensures artisans respond quickly 
                    to your project requirements.
                  </p>
                </dd>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-accent-600">
                  <Users className="h-8 w-8 text-accent-900" />
                </div>
                <dt className="text-xl font-semibold leading-7 text-gray-900">
                  Local Community
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Support local businesses and skilled craftspeople in your community. 
                    Build lasting relationships with trusted professionals.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="bg-cream-50 py-20 sm:py-32">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-section font-bold tracking-tight text-gray-900">
              Popular Services
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Find skilled artisans for the most common home improvement projects.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4 lg:gap-8">
            {[
              { name: 'Plumbing', jobs: 150, icon: '🔧' },
              { name: 'Electrical', jobs: 120, icon: '⚡' },
              { name: 'Carpentry', jobs: 200, icon: '🔨' },
              { name: 'Painting', jobs: 180, icon: '🎨' },
              { name: 'Roofing', jobs: 90, icon: '🏠' },
              { name: 'Tiling', jobs: 110, icon: '🧱' },
              { name: 'Garden Services', jobs: 140, icon: '🌱' },
              { name: 'Cleaning', jobs: 160, icon: '✨' },
            ].map((category) => (
              <div key={category.name} className="card card-hover group cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-4">{category.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {category.jobs}+ active jobs
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-32">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-section font-bold tracking-tight text-gray-900">
              How Taska Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Getting your project done is simple with our streamlined process.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-3 lg:gap-x-8">
              {[
                {
                  step: '01',
                  title: 'Post Your Job',
                  description: 'Describe your project, upload photos, set your budget and timeline. Our easy form takes just minutes to complete.',
                },
                {
                  step: '02',
                  title: 'Receive Quotes',
                  description: 'Qualified artisans in your area will review your job and send you detailed quotes with timelines and pricing.',
                },
                {
                  step: '03',
                  title: 'Choose & Complete',
                  description: 'Compare quotes, read reviews, and choose the best artisan. Pay securely through our platform when the job is done.',
                },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold leading-7 text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600">
        <div className="container-wide py-20 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-section font-bold tracking-tight text-white">
              Ready to get started?
            </h2>
            <p className="mt-6 text-lg leading-8 text-primary-100">
              Join thousands of satisfied customers who have found their perfect artisan on Taska.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/register" className="bg-white text-primary-600 hover:bg-cream-50 font-medium py-3 px-8 rounded-lg transition-all duration-200 hover:scale-105">
                Post Your First Job
              </Link>
              <Link href="/browse" className="text-white hover:text-primary-100 font-medium">
                Browse Artisans <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
