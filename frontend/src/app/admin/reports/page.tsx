'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Reports
        </h1>
        <p className="text-gray-600 mt-2">
          Generate and view platform reports
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-500">Report generation interface will be displayed here</p>
      </Card>
    </div>
  );
}
