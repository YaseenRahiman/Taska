import { useContext } from 'react';
import { AuthContext } from '@/components/providers/auth-provider';

export interface User {
  id: string;
  email: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR';
  verified: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
  };
}

export interface AuthContextType {
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

/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to check if user has specific role(s)
 * @param role - Single role or array of roles to check
 */
export function useHasRole(role: User['role'] | User['role'][]): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}

/**
 * Hook to get current user
 */
export function useCurrentUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check route access permission
 * @param route - Route path to check access for
 */
export function useCanAccessRoute(route: string): boolean {
  const { canAccessRoute } = useAuth();
  return canAccessRoute(route);
}
