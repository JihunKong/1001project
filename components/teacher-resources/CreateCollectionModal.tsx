'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { X, Folder, Globe, Lock } from 'lucide-react';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; isPublic: boolean }) => void;
  isLoading?: boolean;
}

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}: CreateCollectionModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), description: description.trim(), isPublic });
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPublic(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('teacherResources.collections.create')}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('teacherResources.collections.nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('teacherResources.collections.namePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('teacherResources.collections.descriptionLabel')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('teacherResources.collections.descriptionPlaceholder')}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('teacherResources.collections.visibilityLabel')}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    !isPublic
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {t('teacherResources.collections.private')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    isPublic
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {t('teacherResources.collections.public')}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? t('common.creating') : t('common.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
