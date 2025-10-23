'use client';

import Modal from '@/components/figma/ui/Modal';
import { CheckCircle2 } from 'lucide-react';

interface StorySubmittedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackStatus: () => void;
  storyTitle?: string;
}

export default function StorySubmittedModal({
  isOpen,
  onClose,
  onTrackStatus,
  storyTitle
}: StorySubmittedModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      <div
        className="flex flex-col items-center gap-6 text-center"
        style={{ width: '458px', maxWidth: '100%', padding: '24px' }}
      >
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2
            className="text-[#141414]"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '32px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          >
            Story Submitted!
          </h2>
          {storyTitle && (
            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              &quot;{storyTitle}&quot;
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-3">
          <p
            className="text-[#141414]"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '1.5'
            }}
          >
            Your story has been successfully submitted for review.
          </p>
          <div className="space-y-2">
            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              What happens next:
            </p>
            <ul className="space-y-2 text-left">
              <li className="flex items-start gap-2 text-[#8E8E93]">
                <span className="mt-2 w-1.5 h-1.5 bg-[#8E8E93] rounded-full flex-shrink-0"></span>
                <span
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '1.5'
                  }}
                >
                  Our editorial team will review your story within 3-5 business days
                </span>
              </li>
              <li className="flex items-start gap-2 text-[#8E8E93]">
                <span className="mt-2 w-1.5 h-1.5 bg-[#8E8E93] rounded-full flex-shrink-0"></span>
                <span
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '1.5'
                  }}
                >
                  You&apos;ll receive feedback or revision requests via email
                </span>
              </li>
              <li className="flex items-start gap-2 text-[#8E8E93]">
                <span className="mt-2 w-1.5 h-1.5 bg-[#8E8E93] rounded-full flex-shrink-0"></span>
                <span
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '1.5'
                  }}
                >
                  Track your story&apos;s progress anytime from your dashboard
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onTrackStatus}
          className="w-full px-6 py-3 bg-[#141414] text-white rounded-lg hover:bg-[#1f1f1f] transition-colors"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: '1.221'
          }}
        >
          Track Status
        </button>
      </div>
    </Modal>
  );
}
