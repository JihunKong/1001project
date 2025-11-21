'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface UserDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: User | null;
}

export function UserDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  user
}: UserDeleteModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (confirmText !== 'DELETE') return;

    setLoading(true);
    try {
      await onConfirm();
      onClose();
      setConfirmText('');
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('dashboard.admin.userManagement.delete.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium">
              {t('dashboard.admin.userManagement.delete.warning')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-700">
              {t('dashboard.admin.userManagement.delete.aboutTo')}
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('dashboard.admin.userManagement.table.role')}: {user.role}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">
              {t('dashboard.admin.userManagement.delete.consequences')}
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>{t('dashboard.admin.userManagement.delete.softDelete')}</li>
              <li>{t('dashboard.admin.userManagement.delete.revokeAccess')}</li>
              <li>{t('dashboard.admin.userManagement.delete.preserveData')}</li>
              <li>{t('dashboard.admin.userManagement.delete.preventLogin')}</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard.admin.userManagement.delete.confirmText')}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={t('dashboard.admin.userManagement.delete.confirmPlaceholder')}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {t('dashboard.admin.userManagement.delete.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || confirmText !== 'DELETE'}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('dashboard.admin.userManagement.delete.deleting') : t('dashboard.admin.userManagement.delete.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
