import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, CheckCircle } from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Safety Information',
  description: 'Learn about Taska safety features and best practices for secure transactions.',
};

export default function SafetyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-20">
          <div className="container-wide text-center">
            <Shield className="h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Safety Matters</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've built multiple safety features to protect you when using Taska
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Safety Features</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { title: 'Verified Artisans', description: 'All artisans undergo background checks and skill verification' },
                    { title: 'Secure Payments', description: 'Encrypted payment processing with escrow protection' },
                    { title: 'Review System', description: 'Transparent ratings and reviews from real users' },
                    { title: 'Identity Verification', description: 'Government ID verification for all users' },
                    { title: '24/7 Support', description: 'Our support team is always available to help' },
                    { title: 'Insurance Coverage', description: 'Projects covered by liability insurance' },
                  ].map((feature, index) => (
                    <div key={index} className="card">
                      <div className="flex items-start">
                        <CheckCircle className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                          <p className="text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Safety Tips</h2>
                <div className="card space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">For Clients:</h3>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700">
                      <li>Always check artisan reviews and ratings before hiring</li>
                      <li>Keep all communication and payments within the platform</li>
                      <li>Get detailed quotes in writing before work begins</li>
                      <li>Report any suspicious behavior immediately</li>
                    </ul>
                  </div>
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">For Artisans:</h3>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700">
                      <li>Verify client identity before starting work</li>
                      <li>Document all work with photos and descriptions</li>
                      <li>Use platform payment systems for protection</li>
                      <li>Report clients who request off-platform payments</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Report Safety Concerns</h2>
                <p className="text-gray-700 mb-4">
                  If you encounter any safety issues, suspicious behavior, or have concerns about a user,
                  please report it immediately to our safety team.
                </p>
                <Link href="/contact" className="btn-primary">
                  Contact Safety Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
