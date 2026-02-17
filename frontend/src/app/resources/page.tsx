import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Video, Book } from 'lucide-react';
import PublicNavbar from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Helpful guides and resources for using Taska platform.',
};

export default function ResourcesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-cream-50 to-primary-50 py-20">
          <div className="container-wide text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Resources</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Guides, tutorials, and helpful content to get the most out of Taska
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container-wide">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="card text-center">
                <FileText className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Guides</h3>
                <p className="text-gray-600 mb-4">Step-by-step guides for clients and artisans</p>
                <ul className="text-left space-y-2 text-gray-700">
                  <li>• How to post your first job</li>
                  <li>• Creating a winning artisan profile</li>
                  <li>• Safety tips and best practices</li>
                  <li>• Payment and billing guide</li>
                </ul>
              </div>

              <div className="card text-center">
                <Video className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Video Tutorials</h3>
                <p className="text-gray-600 mb-4">Watch and learn from our tutorial series</p>
                <ul className="text-left space-y-2 text-gray-700">
                  <li>• Platform walkthrough</li>
                  <li>• Submitting competitive quotes</li>
                  <li>• Managing multiple projects</li>
                  <li>• Building client relationships</li>
                </ul>
              </div>

              <div className="card text-center">
                <Book className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Blog</h3>
                <p className="text-gray-600 mb-4">Tips, insights, and industry news</p>
                <ul className="text-left space-y-2 text-gray-700">
                  <li>• Home improvement trends</li>
                  <li>• Artisan success stories</li>
                  <li>• Platform updates</li>
                  <li>• Industry insights</li>
                </ul>
              </div>
            </div>

            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Need more help?</h2>
              <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
              <Link href="/contact" className="btn-outline">
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
