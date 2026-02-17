import { Metadata } from 'next';
import PublicNavbar from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Press & Media',
  description: 'Taska press releases, media kit, and news coverage.',
};

export default function PressPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-20">
          <div className="container-wide text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Press & Media</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Latest news, press releases, and media resources from Taska
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Media Inquiries</h2>
              <div className="card mb-12">
                <p className="text-lg text-gray-700 mb-4">
                  For press inquiries, interviews, or media requests, please contact our communications team:
                </p>
                <p className="text-gray-700">
                  Email:{' '}
                  <a href="mailto:press@taska.co.za" className="text-primary-600 hover:text-primary-700">
                    press@taska.co.za
                  </a>
                </p>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-8">Media Kit</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                <div className="card">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Brand Assets</h3>
                  <p className="text-gray-600 mb-4">Logos, colors, and brand guidelines</p>
                  <button className="btn-outline">Download Kit</button>
                </div>

                <div className="card">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Info</h3>
                  <p className="text-gray-600 mb-4">Fact sheet and key statistics</p>
                  <button className="btn-outline">Download PDF</button>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-8">Recent News</h2>
              <div className="space-y-6">
                {[
                  { date: 'January 2025', title: 'Taska Reaches 10,000 Verified Artisans Milestone' },
                  { date: 'December 2024', title: 'Platform Expansion to Three New Provinces' },
                  { date: 'November 2024', title: 'Taska Launches Mobile App for iOS and Android' },
                ].map((item, index) => (
                  <div key={index} className="card">
                    <p className="text-sm text-gray-600 mb-2">{item.date}</p>
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
