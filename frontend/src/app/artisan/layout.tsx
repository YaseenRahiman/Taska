'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

export default function ArtisanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Public routes that don't require authentication
  const isPublicRoute = pathname === '/artisan/register';

  useEffect(() => {
    // Skip auth check for public routes
    if (isPublicRoute) {
      return;
    }

    if (!loading) {
      // Redirect to login if not authenticated
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Redirect to correct dashboard if wrong role
      if (user.role !== 'ARTISAN') {
        if (user.role === 'CLIENT') {
          router.push('/client/dashboard');
        } else if (user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, loading, router, pathname, isPublicRoute]);

  // Allow public routes to render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated or wrong role
  if (!user || user.role !== 'ARTISAN') {
    return null;
  }

  return <>{children}</>;
}
