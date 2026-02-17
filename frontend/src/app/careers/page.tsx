import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin, Clock } from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the Taska team and help us build the future of skilled work in South Africa.',
};

export default function CareersPage() {
  const openings = [
    { title: 'Senior Full Stack Developer', department: 'Engineering', location: 'Johannesburg', type: 'Full-time' },
    { title: 'Product Manager', department: 'Product', location: 'Cape Town', type: 'Full-time' },
    { title: 'Customer Success Manager', department: 'Support', location: 'Remote', type: 'Full-time' },
    { title: 'Marketing Specialist', department: 'Marketing', location: 'Johannesburg', type: 'Full-time' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-20">
          <div className="container-wide text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Careers at Taska</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join us in building the future of work. Help connect skilled artisans with opportunities across South Africa.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Open Positions</h2>
              <div className="space-y-4">
                {openings.map((job, index) => (
                  <div key={index} className="card card-hover">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1" />
                            {job.department}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {job.type}
                          </div>
                        </div>
                      </div>
                      <Link href={`/careers/${index + 1}`} className="btn-primary">
                        Apply
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <p className="text-gray-600 mb-4">Don't see the right role?</p>
                <Link href="/contact" className="btn-outline">
                  Send us your CV
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
