import { Metadata } from 'next';
import Link from 'next/link';
import { Star } from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Success Stories',
  description: 'Real stories from clients and artisans who found success on Taska.',
};

export default function SuccessStoriesPage() {
  const stories = [
    {
      name: 'Sarah M.',
      role: 'Homeowner, Cape Town',
      story: 'Found an amazing carpenter through Taska who transformed our kitchen. The process was seamless, and the quality exceeded our expectations.',
      rating: 5,
    },
    {
      name: 'David N.',
      role: 'Electrician, Johannesburg',
      story: 'Taska has helped me grow my business significantly. I now have a steady stream of quality clients and fair compensation for my work.',
      rating: 5,
    },
    {
      name: 'Lerato K.',
      role: 'Business Owner, Durban',
      story: 'Used Taska for our office renovation. Received 5 quotes within 24 hours and chose the perfect team for the job. Highly recommend!',
      rating: 5,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-20">
          <div className="container-wide text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real stories from our community of clients and artisans
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container-wide">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {stories.map((story, index) => (
                <div key={index} className="card">
                  <div className="flex mb-4">
                    {Array.from({ length: story.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-accent-500 text-accent-500" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{story.story}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{story.name}</p>
                    <p className="text-sm text-gray-600">{story.role}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to write your success story?</h2>
              <Link href="/auth/register" className="btn-primary">
                Get Started Today
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
