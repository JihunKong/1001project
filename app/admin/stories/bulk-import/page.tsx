'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';

type ImportType = 'STORIES' | 'USERS' | 'MEDIA';
type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';

interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface ImportSummary {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  duration: number;
}

interface BulkImport {
  id: string;
  filename: string;
  originalName: string;
  type: ImportType;
  status: ImportStatus;
  totalRows?: number;
  processedRows?: number;
  successfulRows?: number;
  errorRows?: number;
  errors?: ImportError[];
  summary?: ImportSummary;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
}

interface ImportResult {
  importId: string;
  totalRows: number;
  successful: number;
  failed: number;
  errors: ImportError[];
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw },
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function BulkImport() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [importHistory, setImportHistory] = useState<BulkImport[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const fetchImportHistory = async () => {
    try {
      const response = await fetch('/api/admin/bulk-import');
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      setImportHistory(data.imports);
    } catch (error) {
      console.error('Error fetching import history:', error);
    }
  };

  useEffect(() => {
    fetchImportHistory();
  }, []);

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'STORIES');

      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result: ImportResult = await response.json();
      setImportResult(result);
      setSelectedFile(null);
      
      // Refresh import history
      fetchImportHistory();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `title,content,summary,language,category,ageGroup,priority,tags,authorName,authorEmail
"The Magic Forest","Once upon a time in a magical forest...","A story about friendship","en","Fantasy","6-8","MEDIUM","adventure,friendship","John Doe","john@example.com"
"Learning Numbers","Numbers are all around us...","Educational story about math","en","Education","3-5","HIGH","education,math","Jane Smith","jane@example.com"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/stories')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bulk Import Stories</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Import multiple stories from CSV or Excel files
                </p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>
              
              {/* File Upload */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600 font-medium">Drop the file here...</p>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">
                      Drag and drop your file here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports CSV, XLS, XLSX files up to 10MB
                    </p>
                  </>
                )}
              </div>

              {/* Selected File */}
              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Import Result */}
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Errors (showing first 10):</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded text-sm">
                          <span className="font-medium">Row {error.row}:</span> {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Download the template file to see the required format</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>Fill in your story data following the template structure</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Upload the CSV or Excel file using the upload area</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p>Review the import results and fix any errors if needed</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> If an author email doesn&apos;t exist in the system, a new user account will be created automatically.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Import History */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Import History</h2>
              </div>
              <div className="p-6">
                {importHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No import history yet</p>
                ) : (
                  <div className="space-y-4">
                    {importHistory.map((importRecord) => {
                      const statusInfo = statusConfig[importRecord.status];
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div key={importRecord.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-gray-900">{importRecord.originalName}</h3>
                              <p className="text-sm text-gray-500">
                                by {importRecord.uploadedBy.name} • {new Date(importRecord.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {statusInfo.label}
                            </span>
                          </div>
                          
                          {importRecord.summary && (
                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-medium text-gray-900">{importRecord.summary.totalProcessed}</div>
                                <div className="text-gray-500">Total</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-green-600">{importRecord.summary.successCount}</div>
                                <div className="text-gray-500">Success</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-red-600">{importRecord.summary.errorCount}</div>
                                <div className="text-gray-500">Failed</div>
                              </div>
                            </div>
                          )}
                          
                          {importRecord.errors && importRecord.errors.length > 0 && (
                            <div className="mt-3">
                              <details className="group">
                                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-700">
                                  View {importRecord.errors.length} errors
                                </summary>
                                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                  {importRecord.errors.slice(0, 5).map((error: ImportError, index: number) => (
                                    <div key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                                      Row {error.row}: {error.message}
                                    </div>
                                  ))}
                                  {importRecord.errors.length > 5 && (
                                    <p className="text-xs text-gray-500">
                                      ...and {importRecord.errors.length - 5} more errors
                                    </p>
                                  )}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}