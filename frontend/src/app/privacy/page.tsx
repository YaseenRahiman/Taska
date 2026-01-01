import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Taska privacy policy - How we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Last updated: January 2025</p>

            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700">
                At Taska, we respect your privacy and are committed to protecting your personal information.
                This policy explains how we collect, use, and safeguard your data.
              </p>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
                <p className="text-gray-700 mb-4">We collect information you provide directly to us, including:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Name, email address, and phone number</li>
                  <li>Profile information and business details</li>
                  <li>Payment and billing information</li>
                  <li>Communications and messages through the platform</li>
                  <li>Location data when using our services</li>
                </ul>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze trends and usage</li>
                  <li>Detect, prevent, and address fraud and security issues</li>
                </ul>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Protection</h2>
                <p className="text-gray-700">
                  We implement appropriate technical and organizational measures to protect your personal data
                  against unauthorized access, alteration, disclosure, or destruction. This includes encryption,
                  secure servers, and regular security assessments.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">POPIA Compliance</h2>
                <p className="text-gray-700">
                  Taska complies with the Protection of Personal Information Act (POPIA) of South Africa.
                  You have the right to access, correct, or delete your personal information at any time.
                </p>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700">
                  If you have questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:privacy@taska.co.za" className="text-primary-600 hover:text-primary-700">
                    privacy@taska.co.za
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
