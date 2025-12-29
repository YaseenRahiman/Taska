'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Download } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onExport?: () => void;
}

export function DateRangeSelector({
  startDate,
  endDate,
  onDateRangeChange,
  onExport,
}: DateRangeSelectorProps) {
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const handleQuickSelect = (preset: string) => {
    const end = new Date();
    let start: Date;

    switch (preset) {
      case 'today':
        start = new Date();
        break;
      case '7days':
        start = subDays(end, 7);
        break;
      case '30days':
        start = subDays(end, 30);
        break;
      case '90days':
        start = subDays(end, 90);
        break;
      case 'thisMonth':
        start = startOfMonth(end);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(end, 1));
        break;
      case 'thisYear':
        start = new Date(end.getFullYear(), 0, 1);
        break;
      default:
        start = subDays(end, 30);
    }

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    setCustomStart(startStr);
    setCustomEnd(endStr);
    onDateRangeChange(startStr, endStr);
  };

  const handleCustomApply = () => {
    onDateRangeChange(customStart, customEnd);
  };

  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'Last 90 Days', value: '90days' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Year', value: 'thisYear' },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Date Range</h3>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-2">
            <Button onClick={handleCustomApply} size="sm">
              Apply Custom Range
            </Button>

            {onExport && (
              <Button onClick={onExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            )}
          </div>

          {/* Current selection display */}
          <div className="text-sm text-muted-foreground">
            Showing data from <span className="font-medium">{startDate}</span> to{' '}
            <span className="font-medium">{endDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
