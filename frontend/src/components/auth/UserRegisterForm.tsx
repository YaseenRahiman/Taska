'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/providers/auth-provider';
import {
  userRegisterSchema,
  type UserRegisterInput,
} from '@/lib/validations/auth';

export default function UserRegisterForm() {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'ARTISAN'>('CLIENT');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserRegisterInput>({
    resolver: zodResolver(userRegisterSchema),
  });

  const onSubmit = async (data: UserRegisterInput) => {
    console.log('[UserRegisterForm] onSubmit called with data:', { ...data, password: '[REDACTED]' });
    console.log('[UserRegisterForm] Form errors:', errors);
    setIsLoading(true);

    try {
      // Transform form data to API payload
      const payload = {
        email: data.email,
        password: data.password,
        role: selectedRole, // Use the selected role from state
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      };

      console.log('[UserRegisterForm] Registration payload:', { ...payload, password: '[REDACTED]' });

      // Call registration via auth provider
      await registerUser(payload);

      // Show success message
      toast.success('Account created successfully! Redirecting to your dashboard...');

      // Auth provider handles redirect automatically via useEffect
      // Keep loading state active during redirect to prevent user interaction
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle different error types with improved messaging
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (Array.isArray(message)) {
          toast.error(message.join(', '));
        } else {
          toast.error(message);
        }
      } else if (error.message?.includes('abort')) {
        toast.error('Request timed out. Please check your connection and try again.');
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create account. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log('[UserRegisterForm] Form validation FAILED - errors:', JSON.stringify(errors));
      })}
      className="space-y-6"
    >
      {/* Hidden role selector for form compatibility */}
      <input type="hidden" name="role" value={selectedRole} />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I want to:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('CLIENT')}
              className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                selectedRole === 'CLIENT'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-primary-300 hover:bg-primary-50'
              }`}
              data-testid="register-client-role-button"
            >
              <span className="text-2xl mb-2">🏠</span>
              <span className="font-medium">Hire Artisans</span>
              <span className="text-xs mt-1">Post jobs</span>
            </button>
            <Link
              href="/artisan/register"
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <span className="text-2xl mb-2">🔧</span>
              <span className="font-medium">Work as Artisan</span>
              <span className="text-xs mt-1">Find jobs</span>
            </Link>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          First Name
        </label>
        <div className="mt-1">
          <input
            {...register('firstName')}
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            aria-invalid={errors.firstName ? 'true' : 'false'}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            className={`block w-full appearance-none rounded-lg border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
              errors.firstName
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            placeholder="John"
            disabled={isLoading}
            data-testid="register-firstName-input"
          />
          {errors.firstName && (
            <p id="firstName-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.firstName.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
          Last Name
        </label>
        <div className="mt-1">
          <input
            {...register('lastName')}
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            aria-invalid={errors.lastName ? 'true' : 'false'}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            className={`block w-full appearance-none rounded-lg border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
              errors.lastName
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            placeholder="Doe"
            disabled={isLoading}
            data-testid="register-lastName-input"
          />
          {errors.lastName && (
            <p id="lastName-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            {...register('email')}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`block w-full appearance-none rounded-lg border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
              errors.email
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            placeholder="you@example.com"
            disabled={isLoading}
            data-testid="register-email-input"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone number
        </label>
        <div className="mt-1">
          <input
            {...register('phoneNumber')}
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            aria-invalid={errors.phoneNumber ? 'true' : 'false'}
            aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : undefined}
            className={`block w-full appearance-none rounded-lg border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
              errors.phoneNumber
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            placeholder="+27123456789"
            disabled={isLoading}
            data-testid="register-phoneNumber-input"
          />
          {errors.phoneNumber && (
            <p id="phoneNumber-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            {...register('password')}
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error password-hint' : 'password-hint'}
            className={`block w-full appearance-none rounded-lg border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
              errors.password
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            placeholder="••••••••"
            disabled={isLoading}
            data-testid="register-password-input"
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
          <p id="password-hint" className="mt-1 text-xs text-gray-500">
            Must be at least 8 characters with uppercase, lowercase, numbers, and special characters
          </p>
        </div>
      </div>

      <div className="flex items-start">
        <input
          {...register('terms')}
          id="terms"
          name="terms"
          type="checkbox"
          aria-invalid={errors.terms ? 'true' : 'false'}
          aria-describedby={errors.terms ? 'terms-error' : undefined}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
          disabled={isLoading}
          data-testid="register-terms-checkbox"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
          I agree to the{' '}
          <Link href="/terms" className="font-medium text-primary-600 hover:text-primary-500">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
            Privacy Policy
          </Link>
        </label>
      </div>
      {errors.terms && (
        <p id="terms-error" className="text-xs text-red-600" role="alert">
          {errors.terms.message}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          data-testid="register-submit-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="btn-outline justify-center"
          disabled={isLoading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="ml-2">Google</span>
        </button>

        <button
          type="button"
          className="btn-outline justify-center"
          disabled={isLoading}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
          </svg>
          <span className="ml-2">WhatsApp</span>
        </button>
      </div>
    </form>
  );
}
