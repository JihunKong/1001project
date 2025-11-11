'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookContentType } from '@prisma/client';
import toast from 'react-hot-toast';
import { BookTypeSelector } from './BookTypeSelector';
import { PDFUploader } from './PDFUploader';
import { CoverImageUploader } from './CoverImageUploader';
import { MetadataForm } from './MetadataForm';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { BookRegistrationInput } from '@/lib/validation/book-registration.schema';

export function BookRegistrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const [formData, setFormData] = useState<Partial<BookRegistrationInput>>({
    contentType: 'TEXT',
    language: 'en',
    category: [],
    tags: [],
    visibility: 'PUBLIC',
    isPremium: false,
  });

  const handleFieldChange = (field: keyof BookRegistrationInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (formData.contentType === 'PDF' && !pdfFile) {
      toast.error('PDF file is required when content type is PDF');
      return;
    }

    if (formData.contentType === 'TEXT' && !formData.content) {
      toast.error('Content is required when content type is TEXT');
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

      if (pdfFile) {
        submitFormData.append('pdfFile', pdfFile);
      }

      if (coverImage) {
        submitFormData.append('coverImage', coverImage);
      }

      const response = await fetch('/api/books/direct-register', {
        method: 'POST',
        body: submitFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register book');
      }

      toast.success('Book registered and published successfully!');
      router.push(`/dashboard`);
    } catch (error) {
      console.error('Book registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register book');
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Summary
          </label>
          <textarea
            value={formData.summary || ''}
            onChange={(e) => handleFieldChange('summary', e.target.value)}
            disabled={isSubmitting}
            rows={4}
            placeholder="Brief description of the book"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Content</h2>

        <BookTypeSelector
          value={formData.contentType || 'TEXT'}
          onChange={(type) => handleFieldChange('contentType', type)}
          disabled={isSubmitting}
        />

        {formData.contentType === 'PDF' && (
          <PDFUploader
            onFileSelect={setPdfFile}
            disabled={isSubmitting}
          />
        )}

        {formData.contentType === 'TEXT' && (
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
        )}

        <CoverImageUploader
          onFileSelect={setCoverImage}
          disabled={isSubmitting}
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
          Cancel
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
          <span>{isSubmitting ? 'Publishing...' : 'Publish Book'}</span>
        </button>
      </div>
    </form>
  );
}
