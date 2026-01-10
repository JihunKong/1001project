'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ExportRequest {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'DOWNLOADED';
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  fileSize: number | null;
  downloadUrl?: string;
  errorMessage?: string;
}

export default function DataExportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportRequest[]>([]);
  const [currentExport, setCurrentExport] = useState<ExportRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchExportHistory();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentExport && ['PENDING', 'PROCESSING'].includes(currentExport.status)) {
      interval = setInterval(() => {
        checkExportStatus(currentExport.id);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentExport]);

  const fetchExportHistory = async () => {
    try {
      const res = await fetch('/api/user/export');
      if (res.ok) {
        const data = await res.json();
        setExportHistory(data.exports || []);
        const pending = data.exports?.find((e: ExportRequest) =>
          ['PENDING', 'PROCESSING'].includes(e.status)
        );
        if (pending) {
          setCurrentExport(pending);
        }
      }
    } catch (err) {
      console.error('Failed to fetch export history:', err);
    }
  };

  const checkExportStatus = async (exportId: string) => {
    try {
      const res = await fetch(`/api/user/export/${exportId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentExport({
          id: exportId,
          status: data.status,
          requestedAt: currentExport?.requestedAt || new Date().toISOString(),
          completedAt: data.completedAt || null,
          expiresAt: data.expiresAt || null,
          fileSize: data.fileSize || null,
          downloadUrl: data.downloadUrl,
          errorMessage: data.errorMessage,
        });
        if (!['PENDING', 'PROCESSING'].includes(data.status)) {
          fetchExportHistory();
        }
      }
    } catch (err) {
      console.error('Failed to check export status:', err);
    }
  };

  const requestExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to request export');
        return;
      }
      setCurrentExport({
        id: data.exportId,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
        completedAt: null,
        expiresAt: null,
        fileSize: null,
      });
    } catch (err) {
      setError('Failed to request export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async (exportId: string) => {
    window.open(`/api/user/export/${exportId}?download=true`, '_blank');
    fetchExportHistory();
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      DOWNLOADED: 'bg-gray-100 text-gray-800',
      FAILED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Export Your Data</h1>
            <p className="mt-1 text-sm text-gray-500">
              Download a copy of all your personal data stored on 1001 Stories
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">What&apos;s included in your export?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Personal profile information</li>
                <li>• Reading history and progress</li>
                <li>• Education data (class enrollments, submissions)</li>
                <li>• Content you&apos;ve created (stories, comments)</li>
                <li>• Volunteer activity records</li>
                <li>• Financial records (orders, donations)</li>
                <li>• System data (notifications, achievements)</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {currentExport && ['PENDING', 'PROCESSING'].includes(currentExport.status) ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      {currentExport.status === 'PENDING' ? 'Export Pending...' : 'Processing Export...'}
                    </h3>
                    <p className="text-sm text-yellow-700">
                      This may take a few minutes. You can leave this page and come back later.
                    </p>
                  </div>
                </div>
              </div>
            ) : currentExport?.status === 'COMPLETED' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Export Ready!</h3>
                    <p className="text-sm text-green-700">
                      Size: {formatFileSize(currentExport.fileSize)} •
                      Expires: {formatDate(currentExport.expiresAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadExport(currentExport.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Download ZIP
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={requestExport}
                disabled={loading}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Requesting Export...' : 'Request Data Export'}
              </button>
            )}

            <div className="mt-4 text-sm text-gray-500">
              <p>
                Exports are available for download for 7 days. You can request a new export once
                every 24 hours.
              </p>
            </div>
          </div>

          {exportHistory.length > 0 && (
            <div className="px-6 py-5 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Export History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exportHistory.map((exp) => (
                      <tr key={exp.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(exp.requestedAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(exp.status)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(exp.fileSize)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(exp.expiresAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {exp.status === 'COMPLETED' && (
                            <button
                              onClick={() => downloadExport(exp.id)}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Download
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your Data Rights</h3>
            <p className="text-xs text-gray-500">
              Under GDPR, PIPA (Korea), and FERPA (US), you have the right to access, correct,
              and delete your personal data. This export function helps you exercise your right
              to data portability. For data deletion, please visit your account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
