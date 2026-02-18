'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams?.get('accessToken') ?? null;
    const refreshToken = searchParams?.get('refreshToken') ?? null;
    const expiresIn = searchParams?.get('expiresIn') ?? null;
    const error = searchParams?.get('error') ?? null;

    if (error || !accessToken || !refreshToken) {
      router.replace('/auth/login?error=google_auth_failed');
      return;
    }

    // Store tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Sync to cookies for middleware
    const maxAge = expiresIn || String(7 * 24 * 60 * 60);
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

    // Notify auth provider
    window.dispatchEvent(new CustomEvent('auth:google:success', { detail: { accessToken } }));

    // Redirect to client dashboard
    router.replace('/client/dashboard');
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Signing you in with Google...</p>
      </div>
    </div>
  );
}
