import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Service Categories',
  description: 'Browse all service categories and find the right artisan for your project.',
};

export default function CategoriesPage() {
  const categories = [
    { name: 'Plumbing', icon: '🔧', count: 150, description: 'Installation, repairs, and maintenance' },
    { name: 'Electrical', icon: '⚡', count: 120, description: 'Wiring, repairs, and installations' },
    { name: 'Carpentry', icon: '🔨', count: 200, description: 'Furniture, built-ins, and repairs' },
    { name: 'Painting', icon: '🎨', count: 180, description: 'Interior and exterior painting' },
    { name: 'Roofing', icon: '🏠', count: 90, description: 'Installation, repairs, and waterproofing' },
    { name: 'Tiling', icon: '🧱', count: 110, description: 'Floor and wall tiling' },
    { name: 'Garden Services', icon: '🌱', count: 140, description: 'Landscaping and maintenance' },
    { name: 'Cleaning', icon: '✨', count: 160, description: 'Residential and commercial cleaning' },
    { name: 'HVAC', icon: '❄️', count: 75, description: 'Heating and cooling systems' },
    { name: 'Flooring', icon: '📐', count: 95, description: 'Installation and repairs' },
    { name: 'Masonry', icon: '🧱', count: 85, description: 'Brickwork and stonework' },
    { name: 'Welding', icon: '🔥', count: 65, description: 'Metal fabrication and repairs' },
    { name: 'Security', icon: '🔒', count: 80, description: 'Alarms, gates, and surveillance' },
    { name: 'Pool Services', icon: '🏊', count: 55, description: 'Maintenance and repairs' },
    { name: 'Handyman', icon: '🛠️', count: 210, description: 'General repairs and maintenance' },
    { name: 'Moving', icon: '📦', count: 70, description: 'Packing and transportation' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-16">
          <div className="container-wide text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Service Categories
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find skilled artisans across all categories for your home and business needs
            </p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16">
          <div className="container-wide">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={`/browse?category=${category.name.toLowerCase()}`}
                  className="card card-hover group"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">{category.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {category.description}
                    </p>
                    <p className="text-sm font-medium text-primary-600">
                      {category.count}+ artisans available
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-center text-sm text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Browse category
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary-600 py-16">
          <div className="container-wide text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Post your job and let artisans come to you with their best quotes
            </p>
            <Link href="/auth/register" className="btn-primary bg-white text-primary-600 hover:bg-cream-50">
              Post Your Job
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
