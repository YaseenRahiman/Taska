'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR';
  profile?: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: User['role'] | User['role'][]) => boolean;
  canAccessRoute: (route: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored token and validate
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Validate token and get user data
      fetchUserProfile();
    } else {
      setLoading(false);
    }

    // Listen for authentication failures from API client
    const handleUnauthorized = () => {
      // Clear user state
      setUser(null);

      // Show notification
      toast.error('Your session has expired. Please log in again.', {
        duration: 5000,
        position: 'top-center',
      });

      // Redirect to homepage
      router.push('/');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Cleanup event listener
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [router]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        // Token is invalid, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Clear tokens on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Enable cookies
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Also set cookies for middleware synchronously
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

      // Decode JWT to get user info
      let userData = null;
      if (data.user) {
        userData = data.user;
      } else {
        // Decode JWT token to extract user info
        try {
          const tokenPayload = JSON.parse(atob(data.accessToken.split('.')[1]));
          userData = {
            id: tokenPayload.sub,
            email: tokenPayload.email,
            role: tokenPayload.role as 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR',
          };
        } catch (error) {
          console.error('Failed to decode token:', error);
        }
      }

      // Set user state synchronously
      setUser(userData);
      setLoading(false);

      // Wait for React state to flush before navigation
      await new Promise(resolve => setTimeout(resolve, 0));

      // Determine redirect path based on role
      let redirectPath = '/client/dashboard';
      if (userData?.role === 'ARTISAN') {
        redirectPath = '/artisan/dashboard';
      } else if (userData?.role === 'ADMIN') {
        redirectPath = '/admin/dashboard';
      }

      console.log('[AuthProvider] Login successful, redirecting to:', redirectPath);

      // Perform redirect after state is settled
      await new Promise(resolve => setTimeout(resolve, 150)); window.location.href = redirectPath;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear cookies
    document.cookie = 'accessToken=; path=/; max-age=0';
    document.cookie = 'refreshToken=; path=/; max-age=0';

    // Clear user state
    setUser(null);

    // Redirect to homepage
    router.push('/');
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      console.log('[AuthProvider] Starting registration with role:', data.role);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Enable cookies
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      console.log('[AuthProvider] Registration response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AuthProvider] Registration failed:', errorData);
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      console.log('[AuthProvider] Registration successful, received tokens:', !!result.accessToken);

      // Store tokens (backend now returns tokens immediately)
      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        console.log('[AuthProvider] Tokens stored in localStorage');

        // Also set cookies for middleware synchronously
        document.cookie = `accessToken=${result.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        document.cookie = `refreshToken=${result.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

        // Decode JWT to get user info
        let userData = null;
        if (result.user) {
          userData = result.user;
        } else {
          try {
            const tokenPayload = JSON.parse(atob(result.accessToken.split('.')[1]));
            userData = {
              id: tokenPayload.sub,
              email: tokenPayload.email,
              role: tokenPayload.role as 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR',
            };
            console.log('[AuthProvider] Decoded user from token:', { id: userData.id, email: userData.email, role: userData.role });
          } catch (error) {
            console.error('[AuthProvider] Failed to decode token:', error);
          }
        }

        // Set user state synchronously
        setUser(userData);
        setLoading(false);

        // Wait for React state to flush before navigation
        await new Promise(resolve => setTimeout(resolve, 0));

        // Determine redirect path based on role (auto-login after registration)
        let redirectPath = '/client/dashboard';
        if (userData?.role === 'ARTISAN') {
          redirectPath = '/artisan/dashboard';
        } else if (userData?.role === 'ADMIN') {
          redirectPath = '/admin/dashboard';
        }

        console.log('[AuthProvider] Registration successful, redirecting to:', redirectPath);

        // Perform redirect after state is settled
        await new Promise(resolve => setTimeout(resolve, 150)); window.location.href = redirectPath;
      } else {
        console.warn('[AuthProvider] No tokens in response, redirecting to verify email');
        setLoading(false);
        // Fallback: if no tokens returned, redirect to verify email
        router.push('/auth/verify-email');
      }
    } catch (error) {
      console.error('[AuthProvider] Registration error:', error);
      setLoading(false);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${apiUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);

      return data.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  const hasRole = (role: User['role'] | User['role'][]): boolean => {
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  };

  const canAccessRoute = (route: string): boolean => {
    if (!user) return false;

    // Define role-based route access
    if (route.startsWith('/client')) {
      return user.role === 'CLIENT';
    }

    if (route.startsWith('/artisan')) {
      return user.role === 'ARTISAN';
    }

    if (route.startsWith('/admin')) {
      return user.role === 'ADMIN' || user.role === 'ASSESSOR';
    }

    // Default: allow access to public routes
    return true;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    refreshToken,
    isAuthenticated: !!user,
    hasRole,
    canAccessRoute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
