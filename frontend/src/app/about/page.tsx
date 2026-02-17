import { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Users, Shield, TrendingUp } from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Taska\'s mission to connect skilled artisans with clients across South Africa.',
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-20">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-6">
                Connecting Communities Through Skilled Work
              </h1>
              <p className="text-xl text-gray-600">
                Taska is South Africa's trusted platform for connecting homeowners with verified skilled artisans.
                We're building a future where quality work is accessible to all.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-lg text-gray-600">
                  To empower skilled artisans and homeowners by creating a transparent, efficient, and
                  trusted marketplace that fosters economic growth and builds stronger communities across South Africa.
                </p>
              </div>
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
                <p className="text-lg text-gray-600">
                  A South Africa where every skilled worker has access to dignified work opportunities,
                  and every homeowner can easily find trusted professionals for their projects.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-cream-50 py-20">
          <div className="container-wide">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
              <p className="text-lg text-gray-600">The principles that guide everything we do</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <Shield className="h-8 w-8" />,
                  title: 'Trust & Safety',
                  description: 'Every artisan is verified and vetted to ensure quality and reliability.'
                },
                {
                  icon: <Heart className="h-8 w-8" />,
                  title: 'Community First',
                  description: 'Supporting local businesses and skilled workers in our communities.'
                },
                {
                  icon: <Users className="h-8 w-8" />,
                  title: 'Empowerment',
                  description: 'Providing tools and opportunities for artisans to grow their businesses.'
                },
                {
                  icon: <TrendingUp className="h-8 w-8" />,
                  title: 'Excellence',
                  description: 'Committed to delivering exceptional experiences for all users.'
                }
              ].map((value, index) => (
                <div key={index} className="card text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary-600 text-white mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20">
          <div className="container-wide">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { number: '10,000+', label: 'Verified Artisans' },
                { number: '50,000+', label: 'Jobs Completed' },
                { number: '25,000+', label: 'Happy Clients' },
                { number: '4.8/5', label: 'Average Rating' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="bg-cream-50 py-20">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Story</h2>
              <div className="space-y-6 text-lg text-gray-600">
                <p>
                  Taska was born from a simple observation: finding reliable, skilled artisans for home
                  projects in South Africa was unnecessarily difficult. Homeowners struggled to find
                  trustworthy professionals, while skilled artisans lacked access to consistent work opportunities.
                </p>
                <p>
                  Founded in 2024, we set out to bridge this gap with technology. Our platform provides a
                  transparent marketplace where quality work meets fair opportunities, all while supporting
                  the growth of local businesses and communities.
                </p>
                <p>
                  Today, Taska connects thousands of artisans with clients across South Africa, facilitating
                  everything from small home repairs to major renovation projects. We're proud to play a part
                  in South Africa's economic growth and skills development.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary-600 py-16">
          <div className="container-wide text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Join the Taska Community
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Whether you're looking for skilled professionals or you're an artisan seeking opportunities,
              Taska is here to help you succeed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/register" className="btn-primary bg-white text-primary-600 hover:bg-cream-50">
                Get Started
              </Link>
              <Link href="/contact" className="btn-outline text-white border-white hover:bg-white/10">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
