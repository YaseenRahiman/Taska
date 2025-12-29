'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function ActivityLogsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-8 h-8" />
          Activity Logs
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor system activity and audit trails
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-500">Activity logs will be displayed here</p>
      </Card>
    </div>
  );
}
