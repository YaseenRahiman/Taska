import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Post a Job',
};

export default function PostJobPage() {
  // Redirect authenticated clients to job creation
  redirect('/client/jobs/create');
}
