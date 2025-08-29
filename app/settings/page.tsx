'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileJson, 
  FileSpreadsheet, 
  Shield, 
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Trash2,
  AlertTriangle,
  RotateCcw,
  UserX,
  ShoppingBag,
  BookOpen
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  // Deletion state management
  const [deletionStatus, setDeletionStatus] = useState<{
    status: string;
    canRequest: boolean;
    canRecover: boolean;
    createdAt?: string;
    softDeletedAt?: string;
    recoveryDeadline?: string;
    parentalConsentRequired?: boolean;
    reviewRequired?: boolean;
  } | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [deletionSuccess, setDeletionSuccess] = useState<string | null>(null);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [deletionReason, setDeletionReason] = useState('');

  // Fetch deletion status on component mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchDeletionStatus();
    }
  }, [session?.user?.id]);

  const fetchDeletionStatus = async () => {
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeletionStatus(data);
      }
    } catch (error) {
      console.error('Error fetching deletion status:', error);
    }
  };

  const handleAccountDeletion = async () => {
    setIsDeletingAccount(true);
    setDeletionError(null);
    setDeletionSuccess(null);

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: deletionReason || 'User requested account deletion',
          confirmationPhrase: confirmationPhrase
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setDeletionError(`Rate limit exceeded. ${data.message}`);
        } else {
          setDeletionError(data.error || 'Failed to process deletion request');
        }
        return;
      }

      setDeletionSuccess(data.message);
      setShowDeletionModal(false);
      setConfirmationPhrase('');
      setDeletionReason('');
      
      // Refresh deletion status
      await fetchDeletionStatus();

    } catch (error) {
      console.error('Deletion error:', error);
      setDeletionError('Network error occurred. Please check your connection and try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleAccountRecovery = async () => {
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel'
        }),
      });

      if (response.ok) {
        setDeletionSuccess('Account recovery initiated. Please check your email for confirmation.');
        await fetchDeletionStatus();
      } else {
        const data = await response.json();
        setDeletionError(data.error || 'Failed to initiate account recovery');
      }
    } catch (error) {
      console.error('Recovery error:', error);
      setDeletionError('Failed to initiate account recovery');
    }
  };

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleDataExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      const response = await fetch(`/api/user/export-data?format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          setExportStatus({
            type: 'error',
            message: `Rate limit exceeded. ${errorData.message}${errorData.resetTime ? ` You can try again after ${new Date(errorData.resetTime).toLocaleTimeString()}.` : ''}`
          });
        } else {
          setExportStatus({
            type: 'error',
            message: errorData.error || 'Failed to export data. Please try again.'
          });
        }
        return;
      }

      // Get the filename from Content-Disposition header or create a default one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `1001stories-data-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus({
        type: 'success',
        message: `Your data has been exported successfully as ${format.toUpperCase()} format. The download should start automatically.`
      });

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: 'Network error occurred. Please check your connection and try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and privacy preferences.</p>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{session?.user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{session?.user?.name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="text-gray-900 capitalize">{session?.user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </motion.div>

        {/* Purchase History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Purchase History</h2>
            </div>
            <Link
              href="/library/orders"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All →
            </Link>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              View your complete purchase history, order details, and download receipts for your digital book purchases.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/library/orders"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              View Purchase History
            </Link>
            <Link
              href="/library"
              className="flex items-center gap-2 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              My Library
            </Link>
          </div>
        </motion.div>

        {/* Data Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Data Export</h2>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Under GDPR Article 15 (Right of Access), you have the right to obtain a copy of your personal data 
              that we process. You can download your data in machine-readable formats below.
            </p>
            
            {/* GDPR Compliance Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Your Data Rights</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• This export includes all personal data we have about you</li>
                    <li>• Data is provided in structured, machine-readable formats</li>
                    <li>• You can request this data up to 3 times per hour</li>
                    <li>• For questions, contact privacy@1001stories.org</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Rate Limiting Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-2">Usage Limits</h3>
                  <p className="text-sm text-yellow-800">
                    To prevent abuse, you can request your data export up to 3 times per hour. 
                    All export requests are logged for security and compliance purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {exportStatus.type && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-6 p-4 rounded-lg border ${
                exportStatus.type === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : exportStatus.type === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {exportStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
                {exportStatus.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />}
                {exportStatus.type === 'info' && <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />}
                <p className={`text-sm ${
                  exportStatus.type === 'success' 
                    ? 'text-green-800' 
                    : exportStatus.type === 'error'
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}>
                  {exportStatus.message}
                </p>
              </div>
            </motion.div>
          )}

          {/* Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* JSON Export */}
            <button
              onClick={() => handleDataExport('json')}
              disabled={isExporting}
              className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <FileJson className="w-5 h-5 text-blue-600" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900">Export as JSON</p>
                  <p className="text-sm text-gray-600">Structured data format</p>
                </div>
              </div>
            </button>

            {/* CSV Export */}
            <button
              onClick={() => handleDataExport('csv')}
              disabled={isExporting}
              className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900">Export as CSV</p>
                  <p className="text-sm text-gray-600">Spreadsheet format</p>
                </div>
              </div>
            </button>
          </div>

          {/* Data Categories Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Your export will include:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>• Personal information & profile</div>
              <div>• Account & authentication data</div>
              <div>• Subscription information</div>
              <div>• Educational progress & enrollments</div>
              <div>• Reading history & bookmarks</div>
              <div>• Order & purchase history</div>
              <div>• Donation records</div>
              <div>• Content submissions</div>
              <div>• Volunteer data (if applicable)</div>
              <div>• System notifications & logs</div>
              <div>• Onboarding progress</div>
              <div>• COPPA compliance data</div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Privacy & Security</h3>
            <p className="text-sm text-gray-600">
              Your data export contains sensitive personal information. Please store it securely and 
              delete it when no longer needed. For our full privacy policy and your rights under GDPR, 
              visit our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </motion.div>

        {/* Account Deletion Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 mt-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <UserX className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Account Deletion</h2>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Under GDPR Article 17 (Right to Erasure), you have the right to request deletion of your personal data. 
              This action is permanent and cannot be undone after the recovery period.
            </p>
            
            {/* GDPR Article 17 Info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-900 mb-2">Important Information</h3>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Account deletion is permanent after the 7-day recovery period</li>
                    <li>• All personal data will be removed from our systems</li>
                    <li>• Published content may remain but will be anonymized</li>
                    <li>• Financial records are retained for legal compliance</li>
                    {deletionStatus?.parentalConsentRequired && (
                      <li>• Parental consent required for users under 13 (COPPA)</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Deletion Status */}
            {deletionStatus && deletionStatus.status !== 'none' && (
              <div className="mb-6 p-4 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-2">Current Deletion Status</h3>
                    <p className="text-sm text-blue-800 mb-2">
                      Status: <span className="font-semibold uppercase">{deletionStatus.status}</span>
                    </p>
                    {deletionStatus.createdAt && (
                      <p className="text-sm text-blue-800 mb-2">
                        Requested: {new Date(deletionStatus.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    {deletionStatus.recoveryDeadline && (
                      <p className="text-sm text-blue-800 mb-2">
                        Recovery Deadline: {new Date(deletionStatus.recoveryDeadline).toLocaleDateString()}
                      </p>
                    )}
                    {deletionStatus.canRecover && (
                      <button
                        onClick={handleAccountRecovery}
                        className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4 inline mr-2" />
                        Recover Account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {(deletionError || deletionSuccess) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-6 p-4 rounded-lg border ${
                  deletionSuccess 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {deletionSuccess && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
                  {deletionError && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />}
                  <p className={`text-sm ${
                    deletionSuccess ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {deletionSuccess || deletionError}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Deletion Action */}
          {(!deletionStatus || deletionStatus.status === 'none') && (
            <div className="space-y-4">
              <button
                onClick={() => setShowDeletionModal(true)}
                className="flex items-center gap-3 p-4 w-full border-2 border-dashed border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-left"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">Request Account Deletion</p>
                  <p className="text-sm text-gray-600">Permanently delete your account and personal data</p>
                </div>
              </button>
            </div>
          )}

          {/* Deletion Confirmation Modal */}
          {showDeletionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Account Deletion</h3>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-sm text-gray-600">
                    This action will permanently delete your account. You will have 7 days to recover your account 
                    before it is permanently deleted.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for deletion (optional)
                    </label>
                    <textarea
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={3}
                      placeholder="Help us improve by telling us why you're leaving..."
                    />
                  </div>

                  {process.env.NODE_ENV === 'production' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type &quot;DELETE MY ACCOUNT&quot; to confirm
                      </label>
                      <input
                        type="text"
                        value={confirmationPhrase}
                        onChange={(e) => setConfirmationPhrase(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="DELETE MY ACCOUNT"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeletionModal(false);
                      setConfirmationPhrase('');
                      setDeletionReason('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAccountDeletion}
                    disabled={isDeletingAccount || (process.env.NODE_ENV === 'production' && confirmationPhrase !== 'DELETE MY ACCOUNT')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Data Deletion Timeline */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Deletion Process Timeline:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Day 1: Account deactivated (soft delete)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Day 1-7: Recovery period (account can be restored)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Day 8: Permanent deletion (data anonymized/removed)</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600">
              If you have questions about data deletion or need assistance, contact our privacy team at{' '}
              <a href="mailto:privacy@1001stories.org" className="text-blue-600 hover:underline">
                privacy@1001stories.org
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}