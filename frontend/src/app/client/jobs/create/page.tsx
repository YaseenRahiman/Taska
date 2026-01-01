'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientNavbar } from '@/components/client/ClientNavbar';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { JobCreationWizard } from '@/components/client/JobCreationWizard';

export default function CreateJobPage() {
  useEffect(() => {
    document.title = 'Taska - Create Job';
  }, []);

  const router = useRouter();

  const handleSuccess = (jobId: string) => {
    // Redirect to the job details page or jobs list
    router.push(`/client/jobs/${jobId}`);
  };

  const handleCancel = () => {
    // Go back to previous page or dashboard
    router.push('/client/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
            <p className="text-gray-600 mt-2">
              Fill in the details below to post your job and connect with qualified artisans
            </p>
          </div>
        </div>

        {/* Job Creation Wizard */}
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
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Check out our{' '}
            <a href="/how-it-works" className="text-primary-600 hover:text-primary-700 underline">
              guide on posting jobs
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
