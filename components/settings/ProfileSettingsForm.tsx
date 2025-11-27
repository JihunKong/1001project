'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AvatarUploader } from './AvatarUploader';

interface ProfileData {
  name: string;
  bio: string;
  tags: string[];
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
}

interface ProfileSettingsFormProps {
  initialData: ProfileData;
  onSave: (data: Partial<ProfileData>) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

const MAX_BIO_LENGTH = 500;
const MAX_TAGS = 10;

export function ProfileSettingsForm({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}: ProfileSettingsFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [tagInput, setTagInput] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isChanged =
      formData.name !== initialData.name ||
      formData.bio !== initialData.bio ||
      formData.avatarUrl !== initialData.avatarUrl ||
      formData.firstName !== initialData.firstName ||
      formData.lastName !== initialData.lastName ||
      JSON.stringify(formData.tags) !== JSON.stringify(initialData.tags);
    setHasChanges(isChanged);
  }, [formData, initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (avatarUrl: string | null) => {
    setFormData((prev) => ({ ...prev, avatarUrl }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && formData.tags.length < MAX_TAGS && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSave({
        name: formData.name,
        bio: formData.bio,
        tags: formData.tags,
        avatarUrl: formData.avatarUrl,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('settings.profile.avatar.title')}
        </h3>
        <AvatarUploader
          currentAvatarUrl={formData.avatarUrl}
          onAvatarChange={handleAvatarChange}
          disabled={isSaving}
        />
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('settings.profile.basicInfo.title')}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.profile.basicInfo.firstName')}
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                maxLength={50}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.profile.basicInfo.lastName')}
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.profile.basicInfo.displayName')}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSaving}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.profile.bio.title')}
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={isSaving}
              rows={4}
              maxLength={MAX_BIO_LENGTH}
              placeholder={t('settings.profile.bio.placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.bio.length}/{MAX_BIO_LENGTH}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('settings.profile.tags.title')}
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving || formData.tags.length >= MAX_TAGS}
              placeholder={t('settings.profile.tags.placeholder')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={isSaving || formData.tags.length >= MAX_TAGS || !tagInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('settings.profile.tags.add')}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {formData.tags.length}/{MAX_TAGS} {t('settings.profile.tags.count')}
          </p>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isSaving}
                    className="hover:text-blue-900 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {t('settings.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSaving || !hasChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSaving ? t('settings.saving') : t('settings.save')}
        </button>
      </div>
    </form>
  );
}
