'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star } from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';
import { useSearchParams, useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api-url';

interface Artisan {
  id: string;
  name: string;
  category: string;
  rating: number;
  jobs: number;
  location: string;
  verified: boolean;
  bio?: string;
  avatar?: string;
}

const FALLBACK_ARTISANS: Artisan[] = [
  { id: '1', name: 'Thabo Molefe', category: 'Plumber', rating: 4.9, jobs: 127, location: 'Johannesburg', verified: true, bio: 'Licensed plumber with 10+ years experience.' },
  { id: '2', name: 'Sarah van der Merwe', category: 'Electrician', rating: 4.8, jobs: 98, location: 'Cape Town', verified: true, bio: 'Certified electrician specialising in home installations.' },
  { id: '3', name: 'David Nkosi', category: 'Carpenter', rating: 4.9, jobs: 145, location: 'Durban', verified: true, bio: 'Master carpenter with expertise in custom furniture.' },
  { id: '4', name: 'Lerato Khumalo', category: 'Painter', rating: 4.7, jobs: 82, location: 'Pretoria', verified: true, bio: 'Interior and exterior painting specialist.' },
  { id: '5', name: 'Johan Coetzee', category: 'Tiler', rating: 4.8, jobs: 91, location: 'Port Elizabeth', verified: true, bio: 'Floor and wall tiling with 8 years experience.' },
  { id: '6', name: 'Nomsa Dlamini', category: 'Cleaner', rating: 4.9, jobs: 203, location: 'Johannesburg', verified: true, bio: 'Professional cleaning service for homes and offices.' },
];

export default function BrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [artisans, setArtisans] = useState<Artisan[]>(FALLBACK_ARTISANS);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    // Set initial category from URL param
    const cat = searchParams.get('category');
    if (cat) {
      setCategoryFilter(cat);
      setSearch(cat);
    }
  }, [searchParams]);

  // Fetch artisans from API, fall back to static data
  useEffect(() => {
    async function fetchArtisans() {
      setLoading(true);
      try {
        const apiUrl = getApiBaseUrl();
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (locationFilter) params.set('location', locationFilter);
        if (categoryFilter) params.set('category', categoryFilter);
        params.set('limit', '24');

        const res = await fetch(`${apiUrl}/users/artisans?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.artisans || data.data || []);
          if (list.length > 0) {
            const mapped: Artisan[] = list.map((a: any) => ({
              id: a.id,
              name: `${a.profile?.firstName || ''} ${a.profile?.lastName || ''}`.trim() || 'Artisan',
              category: a.specializations?.[0]?.category?.name || a.profile?.trade || 'General',
              rating: parseFloat(a.artisanLevel?.averageRating || '0') || 0,
              jobs: a.artisanLevel?.totalJobsCompleted || 0,
              location: a.profile?.city || a.profile?.location || 'South Africa',
              verified: a.profile?.isVerified || false,
              bio: a.profile?.bio || '',
              avatar: a.profile?.profilePictureUrl || undefined,
            }));
            setArtisans(mapped);
            setLoading(false);
            return;
          }
        }
      } catch {
        // API unavailable - use fallback
      }
      // Use fallback and filter client-side
      setArtisans(FALLBACK_ARTISANS);
      setLoading(false);
    }

    const debounce = setTimeout(fetchArtisans, 300);
    return () => clearTimeout(debounce);
  }, [search, locationFilter, categoryFilter]);

  // Client-side filter on fallback data
  const displayed = artisans.filter(a => {
    const q = search.toLowerCase();
    const loc = locationFilter.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    const matchLoc = !loc || a.location.toLowerCase().includes(loc);
    return matchSearch && matchLoc;
  });

  // Sort
  const sorted = [...displayed].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'jobs') return b.jobs - a.jobs;
    return b.rating * Math.log(b.jobs + 1) - a.rating * Math.log(a.jobs + 1); // recommended
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero / Search Section */}
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-12">
          <div className="container-wide">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Find Skilled Artisans
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Browse {loading ? '...' : displayed.length} verified professionals in your area
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
                      type="search"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
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
                      value={locationFilter}
                      onChange={e => setLocationFilter(e.target.value)}
                      placeholder="City or province..."
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
              <p className="text-gray-600">
                {loading ? 'Searching...' : `${sorted.length} artisan${sorted.length !== 1 ? 's' : ''} found`}
              </p>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="recommended">Sort by: Recommended</option>
                <option value="rating">Highest Rated</option>
                <option value="jobs">Most Jobs Completed</option>
              </select>
            </div>

            {loading && (
              <div className="text-center py-12 text-gray-500">
                Searching for artisans...
              </div>
            )}

            {!loading && sorted.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No artisans found</h3>
                <p className="text-gray-600">Try a different search term or location.</p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sorted.map((artisan) => (
                <div key={artisan.id} className="card card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {artisan.avatar ? (
                        <img src={artisan.avatar} alt={artisan.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-lg">
                          {artisan.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{artisan.name}</h3>
                        <p className="text-sm text-gray-600">{artisan.category}</p>
                      </div>
                    </div>
                    {artisan.verified && (
                      <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 shrink-0">
                        Verified
                      </span>
                    )}
                  </div>

                  {artisan.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{artisan.bio}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 fill-accent-500 text-accent-500 mr-1" />
                      <span className="font-medium">{artisan.rating > 0 ? artisan.rating.toFixed(1) : 'New'}</span>
                      {artisan.jobs > 0 && (
                        <>
                          <span className="mx-1">·</span>
                          <span>{artisan.jobs} jobs completed</span>
                        </>
                      )}
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
          </div>
        </section>
      </main>
    </div>
  );
}
