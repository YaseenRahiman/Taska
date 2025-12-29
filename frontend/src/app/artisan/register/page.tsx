import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ArtisanRegisterForm from '@/components/auth/ArtisanRegisterForm';

export const metadata: Metadata = {
  title: 'Artisan Registration',
  description: 'Join Taska as a verified artisan and grow your business.',
};

export default function ArtisanRegisterPage() {
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

      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-cream-50 to-primary-50 py-12 px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as an Artisan</h1>
            <p className="text-gray-600">Start growing your business with quality leads</p>
          </div>

          <div className="card">
            <ArtisanRegisterForm />
          </div>
        </div>
      </main>
    </div>
  );
}
