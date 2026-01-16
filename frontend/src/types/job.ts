export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export interface JobImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  order: number;
}

export interface JobCompletionConfirmation {
  id: string;
  jobId: string;
  userId: string;
  userRole: 'CLIENT' | 'ARTISAN';
  rating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  communicationRating?: number;
  valueRating?: number;
  feedback?: string;
  confirmedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  budget: number;
  location: string;
  status: JobStatus;
  images: JobImage[];
  userId: string;
  // Completion confirmation tracking
  clientConfirmedAt?: string;
  artisanConfirmedAt?: string;
  completionConfirmations?: JobCompletionConfirmation[];
  createdAt: string;
  updatedAt: string;
  bidCount?: number;
}

export interface JobCompletionStatus {
  jobId: string;
  clientConfirmed: boolean;
  clientConfirmedAt?: string;
  artisanConfirmed: boolean;
  artisanConfirmedAt?: string;
  isFullyConfirmed: boolean;
  jobStatus: string;
}

export interface ConfirmCompletionDto {
  rating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  communicationRating?: number;
  valueRating?: number;
  feedback?: string;
}

export interface ConfirmCompletionResponse {
  job: Job;
  message: string;
  isFullyConfirmed: boolean;
}

export interface CreateJobDto {
  title: string;
  description: string;
  categoryId: string;
  budget: number;
  location: string;
  status?: JobStatus;
  images?: File[];
}

export interface UpdateJobDto {
  title?: string;
  description?: string;
  categoryId?: string;
  budget?: number;
  location?: string;
  status?: JobStatus;
}

export interface JobFilters {
  status?: JobStatus;
  categoryId?: string;
  minBudget?: number;
  maxBudget?: number;
  location?: string;
  search?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
}
