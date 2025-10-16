'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2, Save, Send, Eye, X } from 'lucide-react';

const RichTextEditor = dynamic(() => import('./ui/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-[#E5E5EA] rounded-lg overflow-hidden bg-white min-h-[400px] flex items-center justify-center">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  )
});
import {
  formSubmissionSchema,
  type FormSubmissionData,
  AGE_RANGES,
  READING_LEVELS,
  CATEGORIES,
  LICENSE_TYPES
} from '@/lib/validation/submission.schema';

type TextSubmissionFormData = FormSubmissionData;

interface TextSubmissionFormProps {
  initialData?: Partial<TextSubmissionFormData>;
  submissionId?: string;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
  onClose?: () => void; // Alias for onCancel for backward compatibility
  displayMode?: 'page' | 'modal'; // Control layout mode
  onFormChange?: (data: any) => void; // Callback for form data changes
}

export default function TextSubmissionForm({
  initialData,
  submissionId,
  mode = 'create',
  onSuccess,
  onCancel,
  onFormChange
}: TextSubmissionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Cleanup for proper resource management
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<TextSubmissionFormData>({
    resolver: zodResolver(formSubmissionSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      summary: initialData?.summary || '',
      authorAlias: initialData?.authorAlias || '',
      language: initialData?.language || 'en',
      ageRange: initialData?.ageRange ?? null,
      category: initialData?.category || [],
      tags: initialData?.tags || [],
      readingLevel: initialData?.readingLevel ?? null,
      copyrightConfirmed: initialData?.copyrightConfirmed || false,
      originalWork: initialData?.originalWork || true,
      licenseType: initialData?.licenseType ?? null,
      termsAccepted: initialData?.termsAccepted || false,
    }
  });

  const watchedContent = watch('content');
  const watchedCategory = watch('category');
  const watchedTags = watch('tags');
  const watchedTitle = watch('title');
  const watchedSummary = watch('summary');
  const watchedAgeRange = watch('ageRange');

  // Update character and word counts when content changes
  useEffect(() => {
    if (watchedContent) {
      // Strip HTML tags for counting
      const plainText = watchedContent.replace(/<[^>]*>/g, '');
      setCharCount(plainText.length);

      // Count words
      const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    } else {
      setCharCount(0);
      setWordCount(0);
    }
  }, [watchedContent]);

  // Notify parent component of form changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange({
        title: watchedTitle,
        summary: watchedSummary,
        content: watchedContent,
        ageRange: watchedAgeRange,
        wordCount
      });
    }
  }, [watchedTitle, watchedSummary, watchedContent, watchedAgeRange, wordCount, onFormChange]);

  // Auto-expand details section when there are validation errors in hidden fields
  useEffect(() => {
    if (errors.authorAlias || errors.summary || errors.termsAccepted || errors.copyrightConfirmed || errors.licenseType) {
      console.log('Validation errors detected in hidden fields:', {
        authorAlias: errors.authorAlias?.message,
        summary: errors.summary?.message,
        termsAccepted: errors.termsAccepted?.message,
        copyrightConfirmed: errors.copyrightConfirmed?.message,
        licenseType: errors.licenseType?.message
      });
      setDetailsOpen(true);
      if (detailsRef.current) {
        detailsRef.current.open = true;
        detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [errors]);

  const handleContentChange = (content: string) => {
    setValue('content', content, { shouldDirty: true });
  };

  const addCategory = (category: string) => {
    if (!watchedCategory.includes(category)) {
      setValue('category', [...watchedCategory, category], { shouldDirty: true });
    }
  };

  const removeCategory = (category: string) => {
    setValue('category', watchedCategory.filter(c => c !== category), { shouldDirty: true });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !watchedTags.includes(tag)) {
      setValue('tags', [...watchedTags, tag], { shouldDirty: true });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setValue('tags', watchedTags.filter(t => t !== tag), { shouldDirty: true });
  };

  const onSubmit = async (data: TextSubmissionFormData, saveAsDraft = false) => {
    console.log('onSubmit called with saveAsDraft:', saveAsDraft);
    console.log('Form data:', data);

    setIsSubmitting(true);
    setIsDraft(saveAsDraft);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const url = mode === 'edit' && submissionId
        ? `/api/text-submissions/${submissionId}`
        : '/api/text-submissions';

      const method = mode === 'edit' ? 'PUT' : 'POST';

      console.log('Making API request:', { url, method, mode, submissionId });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: abortControllerRef.current.signal,
      });

      console.log('API response status:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error('API error response:', error);
        throw new Error(error.error || 'Failed to save submission');
      }

      const result = await response.json();
      console.log('API success result:', result);

      // If not saving as draft, submit for review
      if (!saveAsDraft && mode === 'create') {
        console.log('Submitting for review with ID:', result.submission.id);
        const submitResponse = await fetch(`/api/text-submissions/${result.submission.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit' }),
        });
        console.log('Submit for review response:', submitResponse.status, submitResponse.statusText);
      }

      toast.success(
        saveAsDraft
          ? 'Draft saved successfully!'
          : mode === 'edit'
            ? 'Submission updated successfully!'
            : 'Submission created and sent for review!'
      );

      console.log('Submission successful, redirecting...');

      // Only redirect if it's not a draft save
      if (!saveAsDraft) {
        onSuccess?.();

        if (!onSuccess) {
          console.log('Redirecting to /dashboard/writer');
          router.push('/dashboard/writer');
        }
      }

    } catch (error) {
      console.error('Error saving submission:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      toast.error(error instanceof Error ? error.message : 'Failed to save submission');
    } finally {
      console.log('onSubmit finally block - resetting states');
      setIsSubmitting(false);
      setIsDraft(false);
    }
  };

  const handleSaveDraft = () => {
    console.log('handleSaveDraft called');
    console.log('Current form errors:', errors);
    handleSubmit(
      (data) => {
        console.log('Draft validation passed, submitting:', data);
        onSubmit(data, true);
      },
      (errors) => {
        console.error('Draft validation failed:', errors);
        toast.error('Please fill in all required fields before saving');
      }
    )();
  };

  const handleSubmitForReview = () => {
    console.log('handleSubmitForReview called');
    console.log('Current form errors:', errors);
    handleSubmit(
      (data) => {
        console.log('Submission validation passed, submitting:', data);
        onSubmit(data, false);
      },
      (errors) => {
        console.error('Submission validation failed:', errors);
        toast.error('Please fill in all required fields before submitting');
      }
    )();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted via Enter key or submit event - prevented');
  };

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-10">
      <form onSubmit={handleFormSubmit} className="space-y-4">

        {/* Title Input */}
        <div>
          <input
            type="text"
            id="title"
            {...register('title')}
            placeholder=""
            className="w-full border-none focus:outline-none focus:ring-0 p-0 text-[#141414] bg-transparent"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '24px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Content Editor */}
        <div>
          <RichTextEditor
            content={watchedContent}
            onChange={handleContentChange}
            placeholder="Tell your story..."
            className="min-h-[400px]"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}

          {/* Character and Word Counter */}
          <div className="mt-4 text-center">
            <span
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193'
              }}
            >
              {charCount} characters &nbsp;&nbsp; {wordCount} words
            </span>
          </div>
        </div>

        {/* Additional Fields - Collapsible Section */}
        <details ref={detailsRef} open={detailsOpen} onToggle={(e) => setDetailsOpen((e.target as HTMLDetailsElement).open)} className="mt-6 border-t border-[#E5E5EA] pt-6">
          <summary className="cursor-pointer text-[#141414] font-medium mb-4" style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: 500
          }}>
            Additional Information
          </summary>

          <div className="space-y-6 mt-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="authorAlias" className="block text-sm font-medium text-[#141414]">
                  Author Name *
                </label>
                <input
                  type="text"
                  id="authorAlias"
                  {...register('authorAlias')}
                  className="mt-1 block w-full h-12 rounded-lg border border-[#E5E5EA] shadow-sm focus:border-[#141414] focus:ring-4 focus:ring-[#141414]/10 text-[#141414] placeholder:text-[#AEAEB2] px-3"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '1.193'
                  }}
                  placeholder="Your name"
                />
                {errors.authorAlias && (
                  <p className="mt-1 text-sm text-red-600">{errors.authorAlias.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="ageRange" className="block text-sm font-medium text-[#141414]">
                  Target Age Range
                </label>
                <select
                  id="ageRange"
                  {...register('ageRange')}
                  className="mt-1 block w-full h-12 rounded-lg border border-[#E5E5EA] shadow-sm focus:border-[#141414] focus:ring-4 focus:ring-[#141414]/10 text-[#141414] px-3"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '1.193'
                  }}
                >
                  <option value="">Select age range</option>
                  {AGE_RANGES.map(range => (
                    <option key={range} value={range}>{range} years</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="readingLevel" className="block text-sm font-medium text-[#141414]">
                  Reading Level
                </label>
                <select
                  id="readingLevel"
                  {...register('readingLevel')}
                  className="mt-1 block w-full h-12 rounded-lg border border-[#E5E5EA] shadow-sm focus:border-[#141414] focus:ring-4 focus:ring-[#141414]/10 text-[#141414] px-3"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '1.193'
                  }}
                >
                  <option value="">Select reading level</option>
                  {READING_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-[#141414]">
                Story Summary *
              </label>
              <textarea
                id="summary"
                rows={3}
                {...register('summary')}
                className="mt-1 block w-full rounded-lg border border-[#E5E5EA] shadow-sm focus:border-[#141414] focus:ring-4 focus:ring-[#141414]/10 text-[#141414] placeholder:text-[#AEAEB2] px-3 py-3"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '1.193'
                }}
                placeholder="Brief summary of your story (20-500 characters)"
              />
              {errors.summary && (
                <p className="mt-1 text-sm text-red-600">{errors.summary.message}</p>
              )}
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-2">
                Categories
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      watchedCategory.includes(category)
                        ? removeCategory(category)
                        : addCategory(category)
                    }
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      watchedCategory.includes(category)
                        ? 'bg-[#141414] text-white border-[#141414]'
                        : 'bg-white text-[#141414] border-[#E5E5EA] hover:border-[#141414]'
                    }`}
                    style={{
                      fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                      fontSize: '14px',
                      fontWeight: 400
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {watchedCategory.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-[#8E8E93]">Selected: {watchedCategory.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 h-12 rounded-lg border border-[#E5E5EA] shadow-sm focus:border-[#141414] focus:ring-4 focus:ring-[#141414]/10 text-[#141414] placeholder:text-[#AEAEB2] px-3"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '1.193'
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 h-12 bg-[#141414] text-white rounded-lg hover:bg-[#1f1f1f]"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '1.221'
                  }}
                >
                  Add
                </button>
              </div>
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 text-sm bg-[#F2F2F7] text-[#141414] rounded-lg"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-[#8E8E93] hover:text-[#141414]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Copyright and Licensing */}
            <div className="bg-[#F9FAFB] p-6 rounded-lg border border-[#E5E5EA]">
              <h3 className="text-lg font-medium text-[#141414] mb-4">Copyright & Licensing</h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="originalWork"
                    {...register('originalWork')}
                    className="rounded border-[#E5E5EA] text-[#141414] focus:ring-[#141414]"
                  />
                  <label htmlFor="originalWork" className="ml-2 text-sm text-[#141414]">
                    This is my original work
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="copyrightConfirmed"
                    {...register('copyrightConfirmed')}
                    className="rounded border-[#E5E5EA] text-[#141414] focus:ring-[#141414]"
                  />
                  <label htmlFor="copyrightConfirmed" className="ml-2 text-sm text-[#141414]">
                    I confirm that I own the copyright to this work or have permission to publish it
                  </label>
                </div>

                <div>
                  <label htmlFor="licenseType" className="block text-sm font-medium text-[#141414]">
                    License Type
                  </label>
                  <select
                    id="licenseType"
                    {...register('licenseType')}
                    className="mt-1 block w-full h-12 rounded-lg border border-[#E5E5EA] shadow-sm focus:border-[#141414] focus:ring-4 focus:ring-[#141414]/10 text-[#141414] px-3"
                    style={{
                      fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      lineHeight: '1.193'
                    }}
                  >
                    <option value="" className="text-[#AEAEB2]">Select license</option>
                    {LICENSE_TYPES.map(license => (
                      <option key={license} value={license}>{license}</option>
                    ))}
                  </select>
                </div>

                {/* Terms & Disclosures */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    {...register('termsAccepted')}
                    className="mt-1 rounded border-[#E5E5EA] text-[#141414] focus:ring-[#141414]"
                  />
                  <div className="ml-3">
                    <label htmlFor="termsAccepted" className="text-sm font-medium text-[#141414]">
                      Terms & Disclosures *
                    </label>
                    <p className="mt-1 text-sm text-[#8E8E93]">
                      I confirm this is my original work and grant 1001 Stories the right to publish and distribute this content.
                    </p>
                    {errors.termsAccepted && (
                      <p className="mt-1 text-sm text-red-600">{errors.termsAccepted.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-[#8E8E93]">
            {isDirty && '• Unsaved changes'}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-3 py-2.5 border border-[#E5E5EA] rounded-lg shadow-sm font-medium text-[#141414] bg-white hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {isDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" stroke="#141414" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" stroke="#141414" aria-hidden="true" />
              )}
              Save as Draft
            </button>

            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 border border-transparent rounded-lg shadow-sm font-medium text-white bg-[#141414] hover:bg-[#1f1f1f] disabled:opacity-50 transition-colors"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {isSubmitting && !isDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" stroke="#ffffff" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" stroke="#ffffff" aria-hidden="true" />
              )}
              {mode === 'edit' ? 'Update Submission' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}