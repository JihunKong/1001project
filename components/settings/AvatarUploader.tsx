'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';

const MAX_AVATAR_SIZE_MB = 2;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (avatarUrl: string | null) => void;
  disabled?: boolean;
}

export function AvatarUploader({ currentAvatarUrl, onAvatarChange, disabled }: AvatarUploaderProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        setError(t('settings.profile.avatar.error.invalidFile'));
        return;
      }

      const file = acceptedFiles[0];

      if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
        setError(t('settings.profile.avatar.error.tooLarge'));
        return;
      }

      if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
        setError(t('settings.profile.avatar.error.invalidType'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        onAvatarChange(data.avatarUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('settings.profile.avatar.error.uploadFailed'));
        setPreview(currentAvatarUrl || null);
      } finally {
        setIsUploading(false);
      }
    },
    [currentAvatarUrl, onAvatarChange, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleRemove = async () => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }

      setPreview(null);
      onAvatarChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.profile.avatar.error.deleteFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t('settings.profile.avatar.title')}
      </label>

      <div className="flex items-center gap-6">
        <div
          {...getRootProps()}
          className={`
            relative w-24 h-24 rounded-full overflow-hidden cursor-pointer
            border-2 border-dashed transition-all
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${(disabled || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          {preview ? (
            <Image
              src={preview}
              alt="Avatar"
              fill
              className="object-cover"
              unoptimized={preview.startsWith('/')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg
                className={`w-8 h-8 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm text-gray-600">
            {t('settings.profile.avatar.description')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, WebP - Max {MAX_AVATAR_SIZE_MB}MB
          </p>

          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="mt-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {t('settings.profile.avatar.remove')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
