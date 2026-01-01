'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Job } from '@/types/job';
import StatusBadge from './StatusBadge';

interface JobCardProps {
  job: Job;
  viewMode?: 'client' | 'artisan';
  onBidClick?: (jobId: string) => void;
}

export default function JobCard({ job, viewMode = 'client', onBidClick }: JobCardProps) {
  const baseUrl = viewMode === 'client' ? '/client/jobs' : '/artisan/jobs';
  const primaryImage = job.images?.[0]?.url || '/images/placeholder-job.jpg';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <Link href={`${baseUrl}/${job.id}`}>
        <div className="relative h-48 w-full bg-gray-200">
          <Image
            src={primaryImage}
            alt={job.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link href={`${baseUrl}/${job.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">
              {job.title}
            </h3>
          </Link>
          <StatusBadge status={job.status} />
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {job.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location}
          </span>
          {job.category && (
            <span className="text-blue-600 font-medium">
              {job.category.name}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              R{job.budget.toLocaleString()}
            </span>
            {viewMode === 'client' && job.bidCount !== undefined && (
              <span className="ml-2 text-sm text-gray-500">
                {job.bidCount} {job.bidCount === 1 ? 'bid' : 'bids'}
              </span>
            )}
          </div>

          {viewMode === 'artisan' && onBidClick && (
            <button
              onClick={() => onBidClick(job.id)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Place Bid
            </button>
          )}

          {viewMode === 'client' && (
            <Link
              href={`${baseUrl}/${job.id}/edit`}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
