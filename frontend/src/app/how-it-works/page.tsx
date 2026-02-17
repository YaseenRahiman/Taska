import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how Taska connects you with skilled artisans in just a few simple steps.',
};

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-20">
          <div className="container-wide text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              How Taska Works
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Getting your project done is simple with our streamlined process
            </p>
          </div>
        </section>

        {/* For Clients */}
        <section className="py-20">
          <div className="container-wide">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">For Clients</h2>
              <p className="text-lg text-gray-600">Find and hire skilled artisans in minutes</p>
            </div>

            <div className="grid gap-12 lg:gap-16">
              {[
                {
                  step: '01',
                  title: 'Post Your Job',
                  description: 'Describe your project in detail - what needs to be done, where, and when. Upload photos to help artisans understand the scope. Set your budget and timeline preferences.',
                  features: ['Quick 5-minute form', 'Upload photos', 'Set budget range', 'Choose timeline']
                },
                {
                  step: '02',
                  title: 'Receive Multiple Quotes',
                  description: 'Qualified artisans in your area will review your job posting and send you detailed quotes. Compare pricing, timelines, and artisan profiles all in one place.',
                  features: ['Multiple quotes within hours', 'Compare side-by-side', 'View artisan profiles', 'Read past reviews']
                },
                {
                  step: '03',
                  title: 'Choose Your Artisan',
                  description: 'Review quotes, ratings, and portfolios. Message artisans directly to discuss details. Select the best fit for your project with confidence.',
                  features: ['Direct messaging', 'View portfolios', 'Check ratings', 'Verify credentials']
                },
                {
                  step: '04',
                  title: 'Get the Job Done',
                  description: 'Your chosen artisan completes the work to your specifications. Track progress, communicate easily, and only pay when you\'re satisfied with the results.',
                  features: ['Secure payments', 'Progress tracking', 'Easy communication', 'Quality guarantee']
                }
              ].map((item, index) => (
                <div key={index} className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="flex items-center mb-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-xl">
                        {item.step}
                      </div>
                      <h3 className="ml-4 text-2xl font-semibold text-gray-900">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-lg text-gray-600 mb-6">
                      {item.description}
                    </p>
                    <ul className="space-y-2">
                      {item.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-gray-700">
                          <CheckCircle className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="card bg-gradient-to-br from-primary-50 to-cream-50 aspect-video flex items-center justify-center">
                      <span className="text-6xl">{['📝', '💬', '✅', '🎉'][index]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Artisans */}
        <section className="bg-cream-50 py-20">
          <div className="container-wide">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">For Artisans</h2>
              <p className="text-lg text-gray-600">Grow your business with quality leads</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Create Your Profile',
                  description: 'Showcase your skills, experience, and past work. Get verified to build trust with potential clients.',
                  icon: '👤'
                },
                {
                  title: 'Browse Jobs & Bid',
                  description: 'Find jobs that match your skills. Submit competitive quotes and communicate your value proposition.',
                  icon: '🔍'
                },
                {
                  title: 'Build Your Reputation',
                  description: 'Complete jobs, earn great reviews, and grow your business. Access tools to manage projects efficiently.',
                  icon: '⭐'
                }
              ].map((item, index) => (
                <div key={index} className="card text-center">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href="/artisan/register" className="btn-primary text-lg px-8 py-3">
                Join as an Artisan
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary-600 py-16">
          <div className="container-wide text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-100 mb-8">
              Join thousands using Taska to connect with skilled professionals
            </p>
            <Link href="/auth/register" className="btn-primary bg-white text-primary-600 hover:bg-cream-50">
              Create Free Account
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
