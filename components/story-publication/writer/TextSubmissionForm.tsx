'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2, Save, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TermsAndDisclosuresModal from './TermsAndDisclosuresModal';
import StorySubmittedModal from './StorySubmittedModal';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-[#E5E5EA] rounded-lg overflow-hidden bg-white min-h-[400px] flex items-center justify-center">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  )
});
import {
  formSubmissionSchema,
  type FormSubmissionData
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
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    resolver: zodResolver(formSubmissionSchema) as any,
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      language: 'en',
      category: [],
      tags: [],
    }
  });

  const watchedContent = watch('content');
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

  const handleContentChange = (content: string) => {
    setValue('content', content, { shouldDirty: true });
  };

  const onSubmit = async (data: TextSubmissionFormData, saveAsDraft = false) => {
    setIsSubmitting(true);
    setIsDraft(saveAsDraft);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    let redirectTarget: string | null = null;
    let shouldRedirectToStories = false;

    try {
      const url = mode === 'edit' && submissionId
        ? `/api/text-submissions/${submissionId}`
        : '/api/text-submissions';

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save submission');
      }

      const result = await response.json();

      // If not saving as draft, submit for review
      if (!saveAsDraft) {
        const targetId = mode === 'edit' ? submissionId : result.submission.id;
        const submitResponse = await fetch(`/api/text-submissions/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit' }),
        });
      } else {
        // Prepare redirect target for draft save
        redirectTarget = mode === 'edit' ? submissionId : result.submission.id;
      }

      toast.success(
        saveAsDraft
          ? t('dashboard.writer.submitText.draftSavedSuccess')
          : mode === 'edit'
            ? t('dashboard.writer.submitText.submissionUpdatedSuccess')
            : t('dashboard.writer.submitText.submissionCreatedSuccess')
      );

      // Handle non-draft redirect
      if (!saveAsDraft) {
        onSuccess?.();

        if (!onSuccess) {
          shouldRedirectToStories = true;
        }
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save submission');
    } finally {
      setIsSubmitting(false);
      setIsDraft(false);
    }

    // Handle redirects after state cleanup
    if (redirectTarget) {
      // Wait for toast to render before redirect
      setTimeout(() => {
        router.push(`/dashboard/writer/story/${redirectTarget}`);
      }, 500);
    } else if (shouldRedirectToStories) {
      router.push('/dashboard/writer/stories');
    }
  };

  const handleSaveDraft = () => {
    handleSubmit(
      (data) => {
        onSubmit(data, true);
      },
      (errors) => {
        toast.error(t('dashboard.writer.submitText.fillRequiredFields'));
      }
    )();
  };

  const handleSubmitForReview = () => {
    handleSubmit(
      (data) => {
        setShowTermsModal(true);
      },
      (errors) => {
        toast.error(t('dashboard.writer.submitText.fillRequiredFields'));
      }
    )();
  };

  const handleAgreeToTerms = async () => {
    await handleSubmit(
      async (data) => {
        await onSubmit(data, false);
        setShowTermsModal(false);
        setShowSuccessModal(true);
      },
      (errors) => {
        toast.error(t('dashboard.writer.submitText.fillRequiredFields'));
      }
    )();
  };

  const handleTrackStatus = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/dashboard/writer/stories');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            placeholder={t('dashboard.writer.submitText.placeholder')}
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
              {charCount} {t('dashboard.writer.submitText.characters')} &nbsp;&nbsp; {wordCount} {t('dashboard.writer.submitText.words')}
            </span>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-[#8E8E93]">
            {isDirty && `• ${t('dashboard.writer.submitText.unsavedChanges')}`}
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
              {t('dashboard.writer.submitText.saveAsDraft')}
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
              {mode === 'edit' ? t('dashboard.writer.submitText.updateSubmission') : t('dashboard.writer.submitText.submitForReview')}
            </button>
          </div>
        </div>
      </form>

      {/* Terms & Disclosures Modal */}
      <TermsAndDisclosuresModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={handleAgreeToTerms}
        isSubmitting={isSubmitting && !isDraft}
      />

      {/* Story Submitted Success Modal */}
      <StorySubmittedModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onTrackStatus={handleTrackStatus}
        storyTitle={watchedTitle}
      />
    </div>
  );
}