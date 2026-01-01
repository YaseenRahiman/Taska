import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Taska terms of service - Rules and guidelines for using our platform.',
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-cream-200 bg-white/95 backdrop-blur">
        <div className="container-wide flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <div className="h-8 w-8 rounded-lg bg-gradient-primary"></div>
            <span className="text-xl font-bold text-gray-900">Taska</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-600 mb-8">Last updated: January 2025</p>

            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700">
                By using Taska's services, you agree to these terms. Please read them carefully.
              </p>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700">
                  By accessing and using Taska, you accept and agree to be bound by these Terms of Service
                  and our Privacy Policy. If you do not agree to these terms, please do not use our platform.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Accounts</h2>
                <p className="text-gray-700 mb-4">
                  When creating an account, you must provide accurate and complete information. You are
                  responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Maintaining the security of your account</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Conduct</h2>
                <p className="text-gray-700 mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Post false, inaccurate, or misleading information</li>
                  <li>Impersonate any person or entity</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Attempt to circumvent our fees or payment systems</li>
                </ul>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Services and Fees</h2>
                <p className="text-gray-700">
                  Taska is a platform connecting clients with artisans. We are not responsible for the
                  quality of work performed. Service fees and payment terms are outlined in our pricing
                  documentation.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Dispute Resolution</h2>
                <p className="text-gray-700">
                  While we provide tools to facilitate communication and transactions, disputes between
                  users must be resolved directly. We may offer mediation services at our discretion.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
                <p className="text-gray-700">
                  Taska is not liable for any indirect, incidental, or consequential damages arising from
                  your use of the platform or services provided by artisans.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Governing Law</h2>
                <p className="text-gray-700">
                  These terms are governed by the laws of South Africa. Any disputes will be resolved in
                  South African courts.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700">
                  Questions about our Terms of Service? Contact us at{' '}
                  <a href="mailto:legal@taska.co.za" className="text-primary-600 hover:text-primary-700">
                    legal@taska.co.za
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
