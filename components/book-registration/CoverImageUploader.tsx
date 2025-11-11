'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '@/lib/validation/book-registration.schema';

interface CoverImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function CoverImageUploader({ onFileSelect, disabled }: CoverImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        setError('Please select a valid image file');
        return;
      }

      const selectedFile = acceptedFiles[0];

      if (selectedFile.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`Image size must be less than ${MAX_IMAGE_SIZE_MB}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);

      setFile(selectedFile);
      onFileSelect(selectedFile);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    disabled,
  });

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onFileSelect(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (file && preview) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Cover Image (Optional)</label>
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start space-x-4">
            <div className="relative w-32 h-48 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
              <Image
                src={preview}
                alt="Cover preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{file.name}</div>
              <div className="text-sm text-gray-500 mt-1">{formatFileSize(file.size)}</div>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="mt-3 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Remove image
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Cover Image (Optional)</label>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <svg
          className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2 2l1.586-1.586a2 2 0 012.828 0L20 18m-2 2l1.586-1.586a2 2 0 012.828 0L24 20m-2 2l1.586-1.586a2 2 0 012.828 0L28 24m-2 2l1.586-1.586a2 2 0 012.828 0L32 28m-2 2l1.586-1.586a2 2 0 012.828 0L36 32M4 42h40"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="4" y="16" width="40" height="26" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14" cy="24" r="2" fill="currentColor" />
        </svg>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {isDragActive ? (
              <span className="font-medium text-blue-600">Drop the image here</span>
            ) : (
              <>
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, WEBP up to {MAX_IMAGE_SIZE_MB}MB
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
