'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import * as Papa from 'papaparse';
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Filter,
  Columns,
  Calendar
} from 'lucide-react';
import type { BulkExportRequest } from '../../../types/bulk-operations.types';

// Entity field configurations for dynamic field selection
const ENTITY_FIELDS = {
  USERS: [
    { id: 'id', label: 'ID', required: true },
    { id: 'email', label: 'Email', required: true },
    { id: 'role', label: 'Role', required: true },
    { id: 'status', label: 'Status', required: true },
    { id: 'verified', label: 'Verified', required: false },
    { id: 'firstName', label: 'First Name', required: false },
    { id: 'lastName', label: 'Last Name', required: false },
    { id: 'phone', label: 'Phone', required: false },
    { id: 'createdAt', label: 'Created At', required: false },
    { id: 'updatedAt', label: 'Updated At', required: false }
  ],
  JOBS: [
    { id: 'id', label: 'ID', required: true },
    { id: 'title', label: 'Title', required: true },
    { id: 'status', label: 'Status', required: true },
    { id: 'clientId', label: 'Client ID', required: false },
    { id: 'artisanId', label: 'Artisan ID', required: false },
    { id: 'budget', label: 'Budget', required: false },
    { id: 'createdAt', label: 'Created At', required: false }
  ],
  PAYMENTS: [
    { id: 'id', label: 'ID', required: true },
    { id: 'amount', label: 'Amount', required: true },
    { id: 'status', label: 'Status', required: true },
    { id: 'userId', label: 'User ID', required: false },
    { id: 'jobId', label: 'Job ID', required: false },
    { id: 'createdAt', label: 'Created At', required: false }
  ],
  REVIEWS: [
    { id: 'id', label: 'ID', required: true },
    { id: 'rating', label: 'Rating', required: true },
    { id: 'comment', label: 'Comment', required: false },
    { id: 'reviewerId', label: 'Reviewer ID', required: false },
    { id: 'artisanId', label: 'Artisan ID', required: false },
    { id: 'createdAt', label: 'Created At', required: false }
  ]
};

interface ImportPreview {
  headers: string[];
  rows: any[];
  validationErrors: ValidationError[];
  totalRows: number;
}

interface ValidationError {
  row: number;
  field: string;
  error: string;
}

interface ColumnMapping {
  [csvColumn: string]: string;
}

export default function CsvExportImport() {
  // Export State
  const [entityType, setEntityType] = useState<'USERS' | 'JOBS' | 'PAYMENTS' | 'REVIEWS'>('USERS');
  const [format, setFormat] = useState<'CSV' | 'JSON' | 'EXCEL'>('CSV');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Import State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize selected fields with required fields when entity type changes
  useState(() => {
    const requiredFields = ENTITY_FIELDS[entityType]
      .filter(f => f.required)
      .map(f => f.id);
    setSelectedFields(requiredFields);
  });

  // ===== EXPORT FUNCTIONS =====

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    try {
      setExportLoading(true);

      // Build filters object
      const filters: Record<string, any> = {};

      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (statusFilter.length > 0) filters.status = statusFilter;
      if (roleFilter.length > 0 && entityType === 'USERS') filters.role = roleFilter;

      const requestBody: BulkExportRequest = {
        entityType,
        format,
        filters,
        fields: selectedFields
      };

      const response = await fetch('http://localhost:3000/api/v1/admin/bulk/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
      }

      // Get blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${entityType.toLowerCase()}_export_${Date.now()}.${format.toLowerCase()}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export completed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Export failed');
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const toggleFieldSelection = (fieldId: string, required: boolean) => {
    if (required) return; // Can't deselect required fields

    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleRoleFilter = (role: string) => {
    setRoleFilter(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  // ===== IMPORT FUNCTIONS =====

  const handleFileUpload = useCallback((file: File) => {
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only CSV files are supported');
      return;
    }

    // Parse CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const totalRows = results.data.length;
        const previewRows = results.data.slice(0, 10);
        const validationErrors = validateImportData(results.data as any[]);

        const preview: ImportPreview = {
          headers,
          rows: previewRows,
          validationErrors,
          totalRows
        };

        setPreview(preview);
        setUploadedFile(file);

        // Auto-map columns based on matching names
        const autoMapping: ColumnMapping = {};
        const requiredFields = ENTITY_FIELDS[entityType].map(f => f.id);

        headers.forEach(header => {
          const normalizedHeader = header.toLowerCase().trim();
          const matchingField = requiredFields.find(
            field => field.toLowerCase() === normalizedHeader
          );
          if (matchingField) {
            autoMapping[header] = matchingField;
          }
        });

        setColumnMapping(autoMapping);

        if (validationErrors.length > 0) {
          toast.error(`Found ${validationErrors.length} validation errors - please review before import`);
        } else {
          toast.success(`File validated successfully - ${totalRows} rows ready to import`);
        }
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
        console.error('CSV parse error:', error);
      }
    });
  }, [entityType]);

  const validateImportData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const requiredFields = ENTITY_FIELDS[entityType]
      .filter(f => f.required)
      .map(f => f.id);

    data.forEach((row, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || String(row[field]).trim() === '') {
          errors.push({
            row: index + 1,
            field,
            error: `Required field '${field}' is missing or empty`
          });
        }
      });

      // Validate email format for users
      if (entityType === 'USERS' && row.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push({
            row: index + 1,
            field: 'email',
            error: 'Invalid email format'
          });
        }
      }

      // Validate numeric fields
      if (entityType === 'PAYMENTS' && row.amount) {
        if (isNaN(Number(row.amount))) {
          errors.push({
            row: index + 1,
            field: 'amount',
            error: 'Amount must be a valid number'
          });
        }
      }

      if (entityType === 'REVIEWS' && row.rating) {
        const rating = Number(row.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
          errors.push({
            row: index + 1,
            field: 'rating',
            error: 'Rating must be between 1 and 5'
          });
        }
      }
    });

    return errors;
  };

  const handleImport = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a file first');
      return;
    }

    if (preview && preview.validationErrors.length > 0) {
      toast.error('Please fix validation errors before importing');
      return;
    }

    try {
      setImportLoading(true);
      setImportProgress(0);

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('entityType', entityType);
      formData.append('columnMapping', JSON.stringify(columnMapping));

      // Simulate progress (in real app, use WebSocket or polling)
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('http://localhost:3000/api/v1/admin/bulk/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // Note: Don't set Content-Type, browser sets it with boundary
        },
        body: formData
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const result = await response.json();

      toast.success(
        `Import completed! ${result.succeeded} succeeded, ${result.failed} failed`,
        { duration: 5000 }
      );

      // If there are failed records, offer to download them
      if (result.failed > 0 && result.failedRecords) {
        downloadFailedRecords(result.failedRecords);
      }

      // Reset form
      setUploadedFile(null);
      setPreview(null);
      setColumnMapping({});
      setImportProgress(0);

    } catch (error: any) {
      toast.error(error.message || 'Import failed');
      console.error('Import error:', error);
    } finally {
      setImportLoading(false);
    }
  };

  const downloadFailedRecords = (failedRecords: any[]) => {
    const csv = Papa.unparse(failedRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_imports_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Failed records downloaded');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setPreview(null);
    setColumnMapping({});
    setImportProgress(0);
  };

  // ===== RENDER FUNCTIONS =====

  const renderExportSection = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Download className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
      </div>

      <div className="space-y-6">
        {/* Entity Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entity Type
          </label>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value as any);
              // Reset filters when entity changes
              setSelectedFields(
                ENTITY_FIELDS[e.target.value as keyof typeof ENTITY_FIELDS]
                  .filter(f => f.required)
                  .map(f => f.id)
              );
              setStatusFilter([]);
              setRoleFilter([]);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="USERS">Users</option>
            <option value="JOBS">Jobs</option>
            <option value="PAYMENTS">Payments</option>
            <option value="REVIEWS">Reviews</option>
          </select>
        </div>

        {/* Format Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="flex gap-4">
            {(['CSV', 'JSON', 'EXCEL'] as const).map((fmt) => (
              <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value={fmt}
                  checked={format === fmt}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{fmt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Status Filter
          </label>
          <div className="flex flex-wrap gap-2">
            {entityType === 'USERS' && ['ACTIVE', 'SUSPENDED', 'BANNED'].map(status => (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  statusFilter.includes(status)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
            {entityType === 'JOBS' && ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(status => (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  statusFilter.includes(status)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Role Filter (Users only) */}
        {entityType === 'USERS' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Filter
            </label>
            <div className="flex flex-wrap gap-2">
              {['CLIENT', 'ARTISAN', 'ADMIN'].map(role => (
                <button
                  key={role}
                  onClick={() => toggleRoleFilter(role)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    roleFilter.includes(role)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Field Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Columns className="w-4 h-4 inline mr-1" />
            Fields to Export ({selectedFields.length} selected)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {ENTITY_FIELDS[entityType].map(field => (
              <label
                key={field.id}
                className={`flex items-center gap-2 ${
                  field.required ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.id)}
                  onChange={() => toggleFieldSelection(field.id, field.required)}
                  disabled={field.required}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exportLoading || selectedFields.length === 0}
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {exportLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export {entityType}
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderImportSection = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Import Data</h2>
      </div>

      <div className="space-y-6">
        {/* Entity Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Import To
          </label>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value as any);
              clearUpload();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="USERS">Users</option>
            <option value="JOBS">Jobs</option>
            <option value="PAYMENTS">Payments</option>
            <option value="REVIEWS">Reviews</option>
          </select>
        </div>

        {/* File Upload Dropzone */}
        {!uploadedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your CSV file here, or
            </p>
            <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
              Browse Files
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-3">
              Maximum file size: 10MB
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                    {preview && ` • ${preview.totalRows} rows`}
                  </p>
                </div>
              </div>
              <button
                onClick={clearUpload}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                aria-label="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Preview Table */}
        {preview && preview.rows.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Preview (showing first 10 rows)
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {preview.headers.map((header, i) => (
                        <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {preview.headers.map((header, j) => (
                          <td key={j} className="px-3 py-2 text-xs text-gray-900">
                            {String(row[header] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {preview && preview.validationErrors.length > 0 && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-900 mb-2">
                  Validation Errors ({preview.validationErrors.length})
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {preview.validationErrors.slice(0, 10).map((error, i) => (
                    <p key={i} className="text-xs text-red-700">
                      Row {error.row}: {error.field} - {error.error}
                    </p>
                  ))}
                  {preview.validationErrors.length > 10 && (
                    <p className="text-xs text-red-600 font-medium">
                      ...and {preview.validationErrors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Indicator */}
        {preview && preview.validationErrors.length === 0 && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-900">
                File validated successfully - ready to import {preview.totalRows} rows
              </p>
            </div>
          </div>
        )}

        {/* Import Progress */}
        {importLoading && (
          <div>
            <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
              <span>Importing...</span>
              <span>{importProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={
            !uploadedFile ||
            !preview ||
            preview.validationErrors.length > 0 ||
            importLoading
          }
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {importLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Import {preview?.totalRows || 0} Records
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {renderExportSection()}
      {renderImportSection()}
    </div>
  );
}
