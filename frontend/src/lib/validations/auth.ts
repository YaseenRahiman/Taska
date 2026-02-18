import { z } from 'zod';

// Password validation schema - matches backend requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Phone number validation (South African format)
// Accepts: +27821234567, +27 82 123 4567, (082) 123-4567, 0821234567, 0123456789
// More lenient pattern that accepts various formats with 10+ digits
const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^[\+]?[0-9]{0,4}[\s\-\.]?[(]?[0-9]{2,4}[)]?[\s\-\.]?[0-9]{3,4}[\s\-\.]?[0-9]{3,4}$/,
    'Please enter a valid phone number (e.g., +27123456789 or 0123456789)');

// User registration schema (CLIENT role)
export const userRegisterSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Artisan registration schema (ARTISAN role)
export const artisanRegisterSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  trade: z.string().min(1, 'Please select your primary trade'),
  experience: z.coerce
    .number()
    .min(0, 'Experience must be 0 or greater')
    .max(60, 'Please enter a valid years of experience'),
  location: z.string().min(2, 'Please enter your city or area'),
  bio: z.string().optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Type exports
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type ArtisanRegisterInput = z.infer<typeof artisanRegisterSchema>;

// API payload types
export interface UserRegisterPayload {
  email: string;
  password: string;
  role: 'CLIENT';
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface ArtisanRegisterPayload {
  email: string;
  password: string;
  role: 'ARTISAN';
  firstName: string;
  lastName: string;
  phoneNumber: string;
  trade?: string;
  experience?: number;
  location?: string;
  bio?: string;
}
