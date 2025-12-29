import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import UserLoginForm from '@/components/auth/UserLoginForm';

export const metadata: Metadata = {
  title: 'Taska - Login',
  description: 'Sign in to your Taska account to manage your projects and connect with artisans.',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-cream-200 bg-white/95 backdrop-blur">
        <div className="container-wide flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity" data-testid="logo-link">
            <ArrowLeft className="h-5 w-5" />
            <div className="h-8 w-8 rounded-lg bg-gradient-primary"></div>
            <span className="text-xl font-bold text-gray-900" data-testid="brand-name">Taska</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-cream-50 to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          <div className="card mt-8">
            <UserLoginForm />

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500" data-testid="register-link">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
