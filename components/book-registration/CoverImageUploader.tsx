'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { MAX_IMAGE_SIZE_MB } from '@/lib/validation/book-registration.schema';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface CoverImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  existingImage?: string;
  bookId?: string;
  bookTitle?: string;
  bookContent?: string;
  bookSummary?: string;
  onAIGenerated?: (imageUrl: string) => void;
}

export function CoverImageUploader({ onFileSelect, disabled, existingImage, bookId, bookTitle, bookContent, bookSummary, onAIGenerated }: CoverImageUploaderProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existingImage || null);
  const [error, setError] = useState<string | null>(null);
  const [isExisting, setIsExisting] = useState<boolean>(!!existingImage);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const hasValidContent = bookContent && bookContent.replace(/<[^>]*>/g, '').trim().length >= 50;

  const generateAICover = async () => {
    if (!bookId) {
      toast.error('Book ID is required for AI cover generation');
      return;
    }

    setIsGeneratingAI(true);
    setError(null);

    try {
      const response = await fetch(`/api/books/${bookId}/generate-cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate cover');
      }

      const imageUrl = data.coverImage + '?t=' + Date.now();
      setPreview(imageUrl);
      setIsExisting(true);
      setFile(null);
      toast.success(t('dashboard.registerBook.ai.coverSuccess'));

      if (onAIGenerated) {
        onAIGenerated(imageUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('dashboard.registerBook.ai.error');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateAICoverPreview = async () => {
    if (!bookTitle) {
      toast.error(t('dashboard.registerBook.ai.contentRequired'));
      return;
    }

    if (!hasValidContent && !bookSummary) {
      toast.error(t('dashboard.registerBook.ai.contentRequired'));
      return;
    }

    setIsGeneratingAI(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-cover-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookTitle,
          summary: bookSummary,
          content: bookContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate cover');
      }

      const dataUrl = `data:image/png;base64,${data.base64Data}`;
      setPreview(dataUrl);
      setIsExisting(false);

      const blob = await fetch(dataUrl).then(r => r.blob());
      const generatedFile = new File([blob], 'ai-cover.png', { type: 'image/png' });
      setFile(generatedFile);
      onFileSelect(generatedFile);

      toast.success(t('dashboard.registerBook.ai.coverSuccess'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('dashboard.registerBook.ai.error');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateCover = () => {
    if (bookId) {
      generateAICover();
    } else {
      generateAICoverPreview();
    }
  };

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
      setIsExisting(false);
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
    setIsExisting(false);
    onFileSelect(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (preview) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Cover Image (Optional)</label>
        <div className={`border rounded-lg p-4 ${isExisting ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
          <div className="flex items-start space-x-4">
            <div className="relative w-32 h-48 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
              <Image
                src={preview}
                alt="Cover preview"
                fill
                className="object-cover"
                unoptimized={isExisting}
              />
            </div>
            <div className="flex-1 min-w-0">
              {file ? (
                <>
                  <div className="font-medium text-gray-900 truncate">{file.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{formatFileSize(file.size)}</div>
                </>
              ) : (
                <>
                  <div className="font-medium text-gray-900">Current Cover Image</div>
                  <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Keeping existing
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="mt-3 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {isExisting ? 'Remove and upload new' : 'Remove image'}
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

      {!preview && (
        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm text-purple-800">
                {hasValidContent || bookId
                  ? (bookTitle ? `${t('dashboard.registerBook.ai.generateCover')} "${bookTitle}"` : t('dashboard.registerBook.ai.generateCover'))
                  : t('dashboard.registerBook.ai.enterContentFirst')
                }
              </span>
            </div>
            <button
              type="button"
              onClick={handleGenerateCover}
              disabled={disabled || isGeneratingAI || (!bookId && !hasValidContent)}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {isGeneratingAI ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('dashboard.registerBook.ai.generating')}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>{t('dashboard.registerBook.ai.generateCover')}</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-purple-600">
            {hasValidContent || bookId
              ? t('dashboard.registerBook.ai.coverHint')
              : t('dashboard.registerBook.ai.autoGenerateHint')
            }
          </p>
        </div>
      )}
    </div>
  );
}
