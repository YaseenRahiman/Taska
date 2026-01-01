'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { JobCreationWizard } from '@/components/client/JobCreationWizard';
import { api } from '@/lib/api';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  location: {
    city: string;
    province: string;
  };
  images?: Array<{
    id: string;
    url: string;
  }>;
}

export default function EditJobPage() {
  useEffect(() => {
    document.title = 'Taska - Edit Job';
  }, []);

  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/jobs/${jobId}`);
      setJob(response.data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
      setError('Failed to load job details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (updatedJobId: string) => {
    // Redirect to the job details page
    router.push(`/client/jobs/${updatedJobId}`);
  };

  const handleCancel = () => {
    // Go back to job details
    router.push(`/client/jobs/${jobId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-turquoise-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Job</h3>
            <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
            <Button
              onClick={() => router.push('/client/jobs')}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Only allow editing if job is DRAFT or OPEN
  if (job.status !== 'DRAFT' && job.status !== 'OPEN') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Cannot Edit Job</h3>
            <p className="text-yellow-700 mb-4">
              This job cannot be edited because it is {job.status.toLowerCase().replace('_', ' ')}.
            </p>
            <Button
              onClick={() => router.push(`/client/jobs/${jobId}`)}
              variant="outline"
              className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Job Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Details
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
            <p className="text-gray-600 mt-2">
              Update your job details to better attract qualified artisans
            </p>
          </div>
        </div>

        {/* Job Edit Wizard */}
        <Card className="shadow-xl">
          <div className="p-8">
            <JobCreationWizard
              layout="page"
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </Card>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Editing Guidelines:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Update job details to provide more clarity for artisans</li>
            <li>• Adjust budget if needed based on initial bid feedback</li>
            <li>• Add or remove images to better showcase the work required</li>
            <li>• Changes will be visible immediately to all artisans</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
