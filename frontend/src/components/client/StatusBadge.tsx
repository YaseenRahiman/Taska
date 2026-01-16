'use client';

import { JobStatus } from '@/types/job';

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig = {
  [JobStatus.DRAFT]: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  [JobStatus.OPEN]: {
    label: 'Open',
    className: 'bg-green-100 text-green-800 border-green-300'
  },
  [JobStatus.IN_PROGRESS]: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  [JobStatus.COMPLETED]: {
    label: 'Completed',
    className: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  [JobStatus.CANCELLED]: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 border-red-300'
  },
  [JobStatus.DISPUTED]: {
    label: 'Disputed',
    className: 'bg-orange-100 text-orange-800 border-orange-300'
  }
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
