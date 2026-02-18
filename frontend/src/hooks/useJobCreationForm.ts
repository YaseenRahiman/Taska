'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import {
  getCachedJobValidationSettings,
  JobValidationSettings,
  DEFAULT_JOB_VALIDATION_SETTINGS,
} from '@/lib/api/settings';

// Category type from backend
export interface Category {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  parentId: string | null;
  sortOrder: number;
  children?: Category[];
}

// Create a dynamic job schema based on settings
function createJobSchema(settings: JobValidationSettings) {
  return z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
    description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description too long'),
    categoryId: z.string().min(1, 'Please select a category'),
    budget: z
      .number()
      .min(settings.minBudget, `Minimum budget is R${settings.minBudget.toLocaleString()}`)
      .max(settings.maxBudget, `Maximum budget is R${settings.maxBudget.toLocaleString()}`)
      .positive('Budget must be a positive number'),
    budgetType: z.enum(['FIXED', 'HOURLY', 'NEGOTIABLE']),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    addressLine1: z.string().min(5, 'Please enter a valid address').max(255, 'Address too long'),
    addressLine2: z.string().max(255, 'Address too long').optional(),
    city: z.string().min(2, 'Please enter a city').max(100, 'City name too long'),
    province: z.string().min(2, 'Please select a province').max(100, 'Province name too long'),
    postalCode: z.string()
      .min(4, 'Please enter a postal code')
      .max(10, 'Postal code too long')
      .regex(/^\d+$/, 'Postal code must contain only numbers'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    requirements: z.array(z.string().max(200)).max(10, 'Maximum 10 requirements').optional(),
    timeline: z.string().optional(),
    toolsRequired: z.boolean().optional(),
  });
}

// Default schema using default settings
const defaultJobSchema = createJobSchema(DEFAULT_JOB_VALIDATION_SETTINGS);

export type JobFormData = z.infer<typeof defaultJobSchema>;

export interface UseJobCreationFormOptions {
  onSuccess?: (jobId: string) => void;
  onError?: (error: Error) => void;
}

export function useJobCreationForm(options: UseJobCreationFormOptions = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image handling
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Geocoding
  const [geocoding, setGeocoding] = useState(false);

  // Requirements (tag-based)
  const [requirementInput, setRequirementInput] = useState('');

  // Dynamic validation settings from backend
  const [validationSettings, setValidationSettings] = useState<JobValidationSettings>(
    DEFAULT_JOB_VALIDATION_SETTINGS
  );
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Create dynamic schema based on settings
  const jobSchema = useMemo(() => createJobSchema(validationSettings), [validationSettings]);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    mode: 'onChange',
    defaultValues: {
      budget: validationSettings.minBudget, // Default to minimum budget to avoid NaN
      budgetType: 'FIXED',
      urgency: 'MEDIUM',
      requirements: [],
      latitude: 0,
      longitude: 0,
      toolsRequired: false,
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
    reset
  } = form;

  const watchedValues = watch();

  // Fetch validation settings from API on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoadingSettings(true);
        const settings = await getCachedJobValidationSettings();
        setValidationSettings(settings);
        // Update budget default if not already set by user
        const currentBudget = form.getValues('budget');
        if (!currentBudget || currentBudget < settings.minBudget) {
          form.setValue('budget', settings.minBudget, { shouldValidate: false });
        }
      } catch (error) {
        console.error('Failed to fetch validation settings:', error);
        // Continue with default settings
      } finally {
        setLoadingSettings(false);
      }
    }
    fetchSettings();
  }, [form]);

  // Fetch categories from API on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true);
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setError('Failed to load categories. Please refresh the page.');
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  // Geocode address to get latitude/longitude
  // Uses Google Maps Geocoding API if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set,
  // otherwise falls back to Nominatim (OpenStreetMap).
  const geocodeAddress = async () => {
    const address = watchedValues.addressLine1;
    const city = watchedValues.city;
    const province = watchedValues.province;

    if (!address || !city || !province) {
      return;
    }

    setGeocoding(true);
    const fullAddress = `${address}, ${city}, ${province}, South Africa`;

    try {
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const isGoogleKeyConfigured =
        googleApiKey && googleApiKey !== 'your_google_maps_api_key_here';

      if (isGoogleKeyConfigured) {
        // Google Maps Geocoding API
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleApiKey}`
        );
        const data = await res.json();
        if (data.status === 'OK' && data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          setValue('latitude', lat);
          setValue('longitude', lng);
        } else {
          setValue('latitude', -26.2041);
          setValue('longitude', 28.0473);
        }
      } else {
        // Fallback: Nominatim (OpenStreetMap) – no API key needed
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setValue('latitude', parseFloat(data[0].lat));
          setValue('longitude', parseFloat(data[0].lon));
        } else {
          setValue('latitude', -26.2041);
          setValue('longitude', 28.0473);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setValue('latitude', -26.2041);
      setValue('longitude', 28.0473);
    } finally {
      setGeocoding(false);
    }
  };

  // Image handling
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newImages = files.slice(0, 5 - selectedImages.length);

    setSelectedImages(prev => [...prev, ...newImages]);

    // Generate previews
    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Step navigation
  const nextStep = async () => {
    let fieldsToValidate: (keyof JobFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'description'];
        break;
      case 2:
        fieldsToValidate = ['categoryId'];
        break;
      case 3:
        fieldsToValidate = ['budget', 'budgetType', 'urgency'];
        break;
      case 4:
        fieldsToValidate = ['addressLine1', 'city', 'province', 'postalCode'];
        // Geocode before moving to next step
        if (watchedValues.addressLine1 && watchedValues.city && watchedValues.province) {
          await geocodeAddress();
        }
        break;
    }

    if (fieldsToValidate.length > 0) {
      const isStepValid = await trigger(fieldsToValidate);
      if (!isStepValid) return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProgress = () => {
    switch (currentStep) {
      case 1:
        return !!watchedValues.title && !!watchedValues.description && !errors.title && !errors.description;
      case 2:
        return !!watchedValues.categoryId && !errors.categoryId;
      case 3:
        return !!watchedValues.budget && watchedValues.budget > 0 && !!watchedValues.budgetType && !!watchedValues.urgency && !errors.budget;
      case 4:
        return !!watchedValues.addressLine1 && !!watchedValues.city && !!watchedValues.province && !!watchedValues.postalCode;
      default:
        return true;
    }
  };

  const canSubmit = () => {
    // Check if all required fields are filled and valid
    const hasAllRequiredFields =
      !!watchedValues.title &&
      !!watchedValues.description &&
      !!watchedValues.categoryId &&
      !!watchedValues.budget &&
      watchedValues.budget > 0 &&
      watchedValues.budget >= validationSettings.minBudget && // Dynamic minimum budget validation
      watchedValues.budget <= validationSettings.maxBudget && // Dynamic maximum budget validation
      !!watchedValues.budgetType &&
      !!watchedValues.urgency &&
      !!watchedValues.addressLine1 &&
      !!watchedValues.city &&
      !!watchedValues.province &&
      !!watchedValues.postalCode;

    // Check if there are no validation errors
    const hasNoErrors = Object.keys(errors).length === 0;

    // Both conditions must be true
    return hasAllRequiredFields && hasNoErrors && !isSubmitting;
  };

  // Form submission
  const onSubmit = async (data: JobFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Upload images first if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((file) => {
          formData.append('images', file);
        });

        try {
          const uploadResponse = await api.post('/jobs/upload-images', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          imageUrls = uploadResponse.data.urls || [];
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue without images
        }
      }

      // Ensure coordinates are set (geocode if not done)
      if (data.latitude === 0 && data.longitude === 0) {
        await geocodeAddress();
      }

      // Transform data to match backend DTO
      const jobData = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        budget: data.budget,
        budgetType: data.budgetType,
        urgency: data.urgency,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        latitude: data.latitude || -26.2041,
        longitude: data.longitude || 28.0473,
        images: imageUrls,
        requirements: data.requirements || undefined,
        timeline: data.timeline || undefined,
        toolsRequired: data.toolsRequired || false,
        isDraft: false,
      };

      const response = await api.post('/jobs', jobData);
      const jobId = response.data.id;

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(jobId);
      }

      // Reset form
      resetForm();
    } catch (error: any) {
      console.error('Failed to create job:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create job. Please try again.';
      setError(errorMessage);

      if (options.onError) {
        options.onError(new Error(errorMessage));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    reset();
    setCurrentStep(1);
    setSelectedImages([]);
    setImagePreviews([]);
    setError(null);
    setRequirementInput('');
  };

  // Add/remove requirements (tag-based system)
  const addRequirement = () => {
    if (requirementInput.trim() && (!watchedValues.requirements || watchedValues.requirements.length < 10)) {
      const currentReqs = watchedValues.requirements || [];
      setValue('requirements', [...currentReqs, requirementInput.trim()]);
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    const currentReqs = watchedValues.requirements || [];
    setValue('requirements', currentReqs.filter((_, i) => i !== index));
  };

  return {
    // Form state
    currentStep,
    isSubmitting,
    error,
    setError,

    // Form methods
    register,
    handleSubmit: handleSubmit(onSubmit),
    watch,
    watchedValues,
    setValue,
    errors,
    trigger,
    resetForm,

    // Categories
    categories,
    loadingCategories,

    // Validation settings (from admin config)
    validationSettings,
    loadingSettings,

    // Step navigation
    nextStep,
    prevStep,
    canProgress,
    canSubmit,

    // Image handling
    selectedImages,
    imagePreviews,
    handleImageUpload,
    removeImage,

    // Geocoding
    geocoding,
    geocodeAddress,

    // Requirements
    requirementInput,
    setRequirementInput,
    addRequirement,
    removeRequirement,
  };
}
