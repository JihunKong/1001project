'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CoverImageUploader } from './CoverImageUploader';
import { MetadataForm } from './MetadataForm';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { BookRegistrationInput } from '@/lib/validation/book-registration.schema';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface BookFormInitialData {
  id?: string;
  title?: string;
  subtitle?: string;
  summary?: string;
  authorName?: string;
  authorAlias?: string;
  content?: string;
  language?: string;
  ageRange?: string;
  category?: string[];
  tags?: string[];
  visibility?: 'PUBLIC' | 'RESTRICTED' | 'CLASSROOM' | 'PRIVATE';
  isPremium?: boolean;
  price?: number;
  coverImage?: string;
}

interface BookRegistrationFormProps {
  mode?: 'create' | 'edit';
  bookId?: string;
  initialData?: BookFormInitialData;
  onSuccess?: (book: any) => void;
}

export function BookRegistrationForm({
  mode = 'create',
  bookId,
  initialData,
  onSuccess
}: BookRegistrationFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const isEditMode = mode === 'edit';

  const [formData, setFormData] = useState<Partial<BookRegistrationInput>>(() => {
    if (initialData) {
      const visibilityValue = initialData.visibility === 'PUBLIC' || initialData.visibility === 'RESTRICTED' || initialData.visibility === 'CLASSROOM'
        ? initialData.visibility
        : 'PUBLIC';
      return {
        title: initialData.title || '',
        subtitle: initialData.subtitle || '',
        summary: initialData.summary || '',
        authorName: initialData.authorName || '',
        authorAlias: initialData.authorAlias || '',
        contentType: 'TEXT',
        content: initialData.content || '',
        language: initialData.language || 'en',
        ageRange: initialData.ageRange || '',
        category: initialData.category || [],
        tags: initialData.tags || [],
        visibility: visibilityValue,
        isPremium: initialData.isPremium || false,
        price: initialData.price,
      };
    }
    return {
      contentType: 'TEXT',
      language: 'en',
      category: [],
      tags: [],
      visibility: 'PUBLIC',
      isPremium: false,
    };
  });

  const handleFieldChange = (field: keyof BookRegistrationInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasValidContent = formData.contentType === 'TEXT' && formData.content &&
    formData.content.replace(/<[^>]*>/g, '').trim().length >= 50;

  const generateAISummary = async () => {
    if (!hasValidContent) {
      toast.error(t('dashboard.registerBook.ai.contentRequired'));
      return;
    }

    setIsGeneratingSummary(true);
    const loadingToast = toast.loading(t('dashboard.registerBook.ai.generating'));

    try {
      const endpoint = isEditMode && bookId
        ? `/api/books/${bookId}/generate-summary`
        : '/api/ai/generate-summary-preview';

      const body = isEditMode && bookId
        ? {}
        : { title: formData.title || 'Untitled', content: formData.content };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate summary');
      }

      handleFieldChange('summary', result.summary);
      toast.success(t('dashboard.registerBook.ai.summarySuccess'), { id: loadingToast });
    } catch (error) {
      console.error('Summary generation error:', error);
      toast.error(
        error instanceof Error ? error.message : t('dashboard.registerBook.ai.error'),
        { id: loadingToast }
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.authorName) {
      toast.error('Title and author name are required');
      return;
    }

    if (!formData.category || formData.category.length === 0) {
      toast.error('At least one category is required');
      return;
    }

    // Check if TEXT content is empty (including empty HTML tags like <p></p>)
    const isContentEmpty = !formData.content ||
      formData.content.replace(/<[^>]*>/g, '').trim() === '';

    if (isContentEmpty) {
      toast.error('Content is required');
      return;
    }

    if (formData.isPremium && !formData.price) {
      toast.error('Price is required for premium books');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitFormData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            submitFormData.append(key, JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            submitFormData.append(key, value.toString());
          } else {
            submitFormData.append(key, value.toString());
          }
        }
      });

      if (coverImage) {
        submitFormData.append('coverImage', coverImage);
      }

      const apiUrl = isEditMode && bookId
        ? `/api/books/${bookId}`
        : '/api/books/direct-register';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method,
        body: submitFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Show detailed validation errors if available
        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details.map((err: { path?: string[]; message?: string }) =>
            err.path ? `${err.path.join('.')}: ${err.message}` : err.message
          ).join('\n');
          throw new Error(errorMessages || result.error || `Failed to ${isEditMode ? 'update' : 'register'} book`);
        }
        throw new Error(result.error || result.message || `Failed to ${isEditMode ? 'update' : 'register'} book`);
      }

      const successMessage = isEditMode
        ? 'Book updated successfully!'
        : 'Book registered and published successfully!';
      toast.success(successMessage);

      if (onSuccess) {
        onSuccess(result.book || result);
      } else {
        router.push(`/dashboard`);
      }
    } catch (error) {
      console.error(`Book ${isEditMode ? 'update' : 'registration'} error:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'register'} book`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter book title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subtitle
          </label>
          <input
            type="text"
            value={formData.subtitle || ''}
            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter subtitle (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Author Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.authorName || ''}
            onChange={(e) => handleFieldChange('authorName', e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter author name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Summary
            </label>
            {formData.contentType === 'TEXT' && (
              <button
                type="button"
                onClick={generateAISummary}
                disabled={isSubmitting || isGeneratingSummary || !hasValidContent}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingSummary ? (
                  <>
                    <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('dashboard.registerBook.ai.generating')}
                  </>
                ) : (
                  <>
                    <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t('dashboard.registerBook.ai.generateSummary')}
                  </>
                )}
              </button>
            )}
          </div>
          <textarea
            value={formData.summary || ''}
            onChange={(e) => handleFieldChange('summary', e.target.value)}
            disabled={isSubmitting || isGeneratingSummary}
            rows={4}
            placeholder="Brief description of the book"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
          {formData.contentType === 'TEXT' && (
            <p className="mt-1 text-xs text-gray-500">
              {hasValidContent
                ? t('dashboard.registerBook.ai.summaryHint')
                : t('dashboard.registerBook.ai.enterContentFirst')
              }
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Content</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Content <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            content={formData.content || ''}
            onChange={(value) => handleFieldChange('content', value)}
            placeholder="Write your story here..."
            readOnly={isSubmitting}
          />
        </div>

        <CoverImageUploader
          onFileSelect={setCoverImage}
          disabled={isSubmitting}
          existingImage={initialData?.coverImage}
          bookId={isEditMode ? bookId : undefined}
          bookTitle={formData.title}
          bookContent={formData.content}
          bookSummary={formData.summary}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Metadata</h2>
        <MetadataForm
          data={formData}
          onChange={handleFieldChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {t('dashboard.registerBook.form.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>
            {isSubmitting
              ? (isEditMode ? 'Saving...' : t('dashboard.registerBook.form.submitting'))
              : (isEditMode ? 'Save Changes' : t('dashboard.registerBook.form.submit'))
            }
          </span>
        </button>
      </div>
    </form>
  );
}
