'use client';

import { useState } from 'react';
import Modal from '@/components/figma/ui/Modal';
import { AlertCircle, CheckCircle2, FileText, Send } from 'lucide-react';

interface SubmissionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  wordCount: number;
  isSubmitting?: boolean;
}

export default function SubmissionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  wordCount,
  isSubmitting = false
}: SubmissionConfirmationModalProps) {
  const [copyrightConfirmed, setCopyrightConfirmed] = useState(false);
  const [understandReview, setUnderstandReview] = useState(false);

  const handleConfirm = () => {
    if (!copyrightConfirmed || !understandReview) {
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCopyrightConfirmed(false);
      setUnderstandReview(false);
      onClose();
    }
  };

  const canSubmit = copyrightConfirmed && understandReview;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit Story for Review"
      size="md"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="space-y-6">
        {/* Story Summary */}
        <div className="bg-[#F9FAFB] border border-[#E5E5EA] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-[#8E8E93] mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-[#141414] mb-1">
                Story Title
              </h3>
              <p
                className="text-[#141414] truncate"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                {title || 'Untitled Story'}
              </p>
              <p className="text-sm text-[#8E8E93] mt-1">
                {wordCount.toLocaleString()} words
              </p>
            </div>
          </div>
        </div>

        {/* Information Notice */}
        <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-[#5951E7] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4
                className="text-[#5951E7] mb-2"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                What happens next?
              </h4>
              <ul className="space-y-2 text-sm text-[#5951E7]">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 bg-[#5951E7] rounded-full flex-shrink-0"></span>
                  <span>Your story will be reviewed by our editorial team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 bg-[#5951E7] rounded-full flex-shrink-0"></span>
                  <span>Review typically takes 3-5 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 bg-[#5951E7] rounded-full flex-shrink-0"></span>
                  <span>You&apos;ll receive feedback or revision requests via email</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmation Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="copyright-confirm"
              checked={copyrightConfirmed}
              onChange={(e) => setCopyrightConfirmed(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 w-5 h-5 rounded border-[#E5E5EA] text-[#141414] focus:ring-[#141414] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
            <label
              htmlFor="copyright-confirm"
              className={`flex-1 text-sm text-[#141414] select-none ${!isSubmitting ? 'cursor-pointer' : 'opacity-50'}`}
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                lineHeight: '1.5'
              }}
            >
              <span className="font-medium">Copyright Confirmation:</span> I confirm that this is my original work and I own the copyright, or I have obtained necessary permissions to submit this story.
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="review-understand"
              checked={understandReview}
              onChange={(e) => setUnderstandReview(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 w-5 h-5 rounded border-[#E5E5EA] text-[#141414] focus:ring-[#141414] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
            <label
              htmlFor="review-understand"
              className={`flex-1 text-sm text-[#141414] select-none ${!isSubmitting ? 'cursor-pointer' : 'opacity-50'}`}
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                lineHeight: '1.5'
              }}
            >
              <span className="font-medium">Review Process:</span> I understand that my story will be reviewed and I may receive requests for revisions before publication.
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-[#E5E5EA] rounded-lg text-[#141414] font-medium hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#141414] text-white rounded-lg font-medium hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit for Review</span>
              </>
            )}
          </button>
        </div>

        {!canSubmit && !isSubmitting && (
          <p className="text-sm text-[#DC2626] text-center -mt-2">
            Please confirm both statements above to submit
          </p>
        )}
      </div>
    </Modal>
  );
}
