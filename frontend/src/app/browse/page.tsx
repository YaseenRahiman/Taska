import { Metadata } from 'next';
import Link from 'next/link';
import { Search, MapPin, Star, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Browse Artisans',
  description: 'Find and connect with verified skilled artisans in your area.',
};

export default function BrowsePage() {
  const artisans = [
    { id: 1, name: 'Thabo Molefe', category: 'Plumber', rating: 4.9, jobs: 127, location: 'Johannesburg', verified: true },
    { id: 2, name: 'Sarah van der Merwe', category: 'Electrician', rating: 4.8, jobs: 98, location: 'Cape Town', verified: true },
    { id: 3, name: 'David Nkosi', category: 'Carpenter', rating: 4.9, jobs: 145, location: 'Durban', verified: true },
    { id: 4, name: 'Lerato Khumalo', category: 'Painter', rating: 4.7, jobs: 82, location: 'Pretoria', verified: true },
    { id: 5, name: 'Johan Coetzee', category: 'Tiler', rating: 4.8, jobs: 91, location: 'Port Elizabeth', verified: true },
    { id: 6, name: 'Nomsa Dlamini', category: 'Cleaner', rating: 4.9, jobs: 203, location: 'Johannesburg', verified: true },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-cream-200 bg-white/95 backdrop-blur">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <div className="h-8 w-8 rounded-lg bg-gradient-primary"></div>
            <span className="text-xl font-bold text-gray-900">Taska</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="nav-link">Sign In</Link>
            <Link href="/auth/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-12">
          <div className="container-wide">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Find Skilled Artisans
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Browse verified professionals in your area
            </p>

            {/* Search and Filters */}
            <div className="card max-w-4xl">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label htmlFor="search" className="sr-only">Search artisans</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="search"
                      type="text"
                      placeholder="Search by name, skill, or service..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="location" className="sr-only">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="location"
                      type="text"
                      placeholder="Location"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Artisan Listings */}
        <section className="py-12">
          <div className="container-wide">
            <div className="flex items-center justify-between mb-8">
              <p className="text-gray-600">{artisans.length} artisans found</p>
              <select className="border border-gray-300 rounded-lg px-4 py-2 focus:border-primary-500 focus:ring-primary-500">
                <option>Sort by: Recommended</option>
                <option>Highest Rated</option>
                <option>Most Jobs</option>
                <option>Nearest</option>
              </select>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {artisans.map((artisan) => (
                <div key={artisan.id} className="card card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{artisan.name}</h3>
                      <p className="text-sm text-gray-600">{artisan.category}</p>
                    </div>
                    {artisan.verified && (
                      <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 fill-accent-500 text-accent-500 mr-1" />
                      <span className="font-medium">{artisan.rating}</span>
                      <span className="mx-1">·</span>
                      <span>{artisan.jobs} jobs completed</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{artisan.location}</span>
                    </div>
                  </div>

                  <Link
                    href={`/artisan/${artisan.id}`}
                    className="btn-primary w-full justify-center"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center space-x-2">
              <button className="btn-outline px-4 py-2">Previous</button>
              <button className="btn-primary px-4 py-2">1</button>
              <button className="btn-outline px-4 py-2">2</button>
              <button className="btn-outline px-4 py-2">3</button>
              <button className="btn-outline px-4 py-2">Next</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
