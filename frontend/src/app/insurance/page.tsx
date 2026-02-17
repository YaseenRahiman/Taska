import { Metadata } from 'next';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Insurance Information',
  description: 'Learn about Taska insurance coverage and protection for your projects.',
};

export default function InsurancePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-20">
          <div className="container-wide text-center">
            <Shield className="h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Insurance Coverage</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Protection and peace of mind for every project on Taska
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Coverage Overview</h2>
                <p className="text-lg text-gray-700 mb-8">
                  Taska provides comprehensive insurance coverage to protect both clients and artisans
                  during project execution.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  <div className="card">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Liability Coverage</h3>
                    <p className="text-gray-700">
                      Protection against property damage and injury claims during project work.
                      Coverage up to R5 million per incident.
                    </p>
                  </div>

                  <div className="card">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Work Guarantee</h3>
                    <p className="text-gray-700">
                      Quality guarantee on completed work. Issues reported within 30 days are
                      covered for repairs or corrections.
                    </p>
                  </div>

                  <div className="card">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Protection</h3>
                    <p className="text-gray-700">
                      Secure escrow system ensures artisans are paid for completed work and
                      clients receive agreed-upon services.
                    </p>
                  </div>

                  <div className="card">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Equipment Coverage</h3>
                    <p className="text-gray-700">
                      Artisan tools and equipment used during projects are covered against
                      theft or damage on site.
                    </p>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-6">How to File a Claim</h2>
                <div className="card">
                  <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                    <li>Document the incident with photos and detailed description</li>
                    <li>Report the claim through your Taska dashboard within 48 hours</li>
                    <li>Provide any additional information requested by our claims team</li>
                    <li>Our team will review and process your claim within 5 business days</li>
                    <li>Receive resolution or compensation based on coverage terms</li>
                  </ol>
                </div>

                <div className="mt-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Need Help?</h2>
                  <p className="text-gray-700 mb-4">
                    Questions about insurance coverage or need to file a claim?
                  </p>
                  <Link href="/contact" className="btn-primary">
                    Contact Insurance Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
