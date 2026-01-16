'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/providers/auth-provider';
import {
  artisanRegisterSchema,
  type ArtisanRegisterInput,
} from '@/lib/validations/auth';

export default function ArtisanRegisterForm() {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArtisanRegisterInput>({
    resolver: zodResolver(artisanRegisterSchema),
  });

  const onSubmit = async (data: ArtisanRegisterInput) => {
    console.log('[ArtisanRegisterForm] onSubmit called with data:', { ...data, password: '[REDACTED]' });
    console.log('[ArtisanRegisterForm] Form errors:', errors);
    setIsLoading(true);

    try {
      // Transform form data to API payload
      const payload = {
        email: data.email,
        password: data.password,
        role: 'ARTISAN' as const,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        trade: data.trade,
        experience: data.experience,
        location: data.location,
        bio: data.bio,
      };

      console.log('[ArtisanRegisterForm] Registration payload:', { ...payload, password: '[REDACTED]' });

      // Call registration via auth provider
      await registerUser(payload);

      // Show success message
      toast.success('Artisan account created successfully! Redirecting...');

      // Auth provider handles redirect automatically
    } catch (error: any) {
      console.error('[ArtisanRegisterForm] Registration error:', error);

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
        console.log('[ArtisanRegisterForm] Form validation FAILED - errors:', JSON.stringify(errors));
      })}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First name *
          </label>
          <input
            {...register('firstName')}
            type="text"
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            aria-invalid={errors.firstName ? 'true' : 'false'}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            className={`block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
              errors.firstName
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            disabled={isLoading}
            data-testid="artisan-firstName-input"
          />
          {errors.firstName && (
            <p id="firstName-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last name *
          </label>
          <input
            {...register('lastName')}
            type="text"
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            aria-invalid={errors.lastName ? 'true' : 'false'}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            className={`block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
              errors.lastName
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            disabled={isLoading}
            data-testid="artisan-lastName-input"
          />
          {errors.lastName && (
            <p id="lastName-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address *
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
            errors.email
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          disabled={isLoading}
          data-testid="artisan-email-input"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Phone number *
        </label>
        <input
          {...register('phoneNumber')}
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          autoComplete="tel"
          aria-invalid={errors.phoneNumber ? 'true' : 'false'}
          aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : undefined}
          className={`block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
            errors.phoneNumber
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          placeholder="+27123456789"
          disabled={isLoading}
          data-testid="artisan-phoneNumber-input"
        />
        {errors.phoneNumber && (
          <p id="phoneNumber-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.phoneNumber.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="trade" className="block text-sm font-medium text-gray-700 mb-1">
          Primary Trade *
        </label>
        <select
          {...register('trade')}
          id="trade"
          name="trade"
          aria-invalid={errors.trade ? 'true' : 'false'}
          aria-describedby={errors.trade ? 'trade-error' : undefined}
          className={`block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
            errors.trade
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          disabled={isLoading}
          data-testid="artisan-trade-select"
        >
          <option value="">Select your trade</option>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="carpentry">Carpentry</option>
          <option value="painting">Painting</option>
          <option value="tiling">Tiling</option>
          <option value="roofing">Roofing</option>
          <option value="other">Other</option>
        </select>
        {errors.trade && (
          <p id="trade-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.trade.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
          Years of Experience *
        </label>
        <input
          {...register('experience')}
          type="number"
          id="experience"
          name="experience"
          min="0"
          max="60"
          aria-invalid={errors.experience ? 'true' : 'false'}
          aria-describedby={errors.experience ? 'experience-error' : undefined}
          className={`block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
            errors.experience
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          disabled={isLoading}
          data-testid="artisan-experience-input"
        />
        {errors.experience && (
          <p id="experience-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.experience.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          City/Area *
        </label>
        <input
          {...register('location')}
          type="text"
          id="location"
          name="location"
          aria-invalid={errors.location ? 'true' : 'false'}
          aria-describedby={errors.location ? 'location-error' : undefined}
          className={`block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
            errors.location
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          placeholder="e.g., Johannesburg, Cape Town"
          disabled={isLoading}
          data-testid="artisan-location-input"
        />
        {errors.location && (
          <p id="location-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.location.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Brief bio (optional)
        </label>
        <textarea
          {...register('bio')}
          id="bio"
          name="bio"
          rows={4}
          aria-invalid={errors.bio ? 'true' : 'false'}
          aria-describedby={errors.bio ? 'bio-error' : undefined}
          className={`block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
            errors.bio
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          placeholder="Tell clients about your experience and expertise..."
          disabled={isLoading}
          data-testid="artisan-bio-textarea"
        />
        {errors.bio && (
          <p id="bio-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.bio.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          name="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error password-hint' : 'password-hint'}
          className={`block w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
            errors.password
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          disabled={isLoading}
          data-testid="artisan-password-input"
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
          data-testid="artisan-terms-checkbox"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
          I agree to the{' '}
          <Link href="/terms" className="text-primary-600 hover:text-primary-700">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
            Privacy Policy
          </Link>
        </label>
      </div>
      {errors.terms && (
        <p id="terms-error" className="text-xs text-red-600" role="alert">
          {errors.terms.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        data-testid="artisan-submit-button"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Artisan Account'
        )}
      </button>

      <div className="text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <Link href="/auth/login" className="text-primary-600 hover:text-primary-700">
          Sign in
        </Link>
      </div>
    </form>
  );
}
