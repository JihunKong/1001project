'use client';

import { useState } from 'react';
import Modal from '@/components/figma/ui/Modal';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface TermsAndDisclosuresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  isSubmitting?: boolean;
}

export default function TermsAndDisclosuresModal({
  isOpen,
  onClose,
  onAgree,
  isSubmitting = false
}: TermsAndDisclosuresModalProps) {
  const { t } = useTranslation();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedOriginalWork, setConfirmedOriginalWork] = useState(false);

  const handleAgree = () => {
    if (!agreedToTerms || !confirmedOriginalWork) {
      return;
    }
    onAgree();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAgreedToTerms(false);
      setConfirmedOriginalWork(false);
      onClose();
    }
  };

  const canAgree = agreedToTerms && confirmedOriginalWork;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="md"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="space-y-6" style={{ width: '528px', maxWidth: '100%' }}>
        {/* Header */}
        <div className="space-y-4">
          <h2
            className="text-[#141414]"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '24px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          >
            {t('dashboard.writer.submitText.termsModal.title')}
          </h2>
          <p
            className="text-[#141414]"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '1.193'
            }}
          >
            {t('dashboard.writer.submitText.termsModal.subtitle')}
          </p>
        </div>

        {/* Scrollable Terms Content */}
        <div
          className="space-y-3 overflow-y-auto pr-2"
          style={{
            maxHeight: '170px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#8E8E93 #F2F2F7'
          }}
        >
          {/* Copyright & Original Work */}
          <div className="space-y-1">
            <h3
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.193'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.copyright.title')}
            </h3>
            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.copyright.description')}
            </p>
          </div>

          {/* Content Guidelines */}
          <div className="space-y-1">
            <h3
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.193'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.guidelines.title')}
            </h3>
            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.guidelines.description')}
            </p>
          </div>

          {/* License Agreement */}
          <div className="space-y-1">
            <h3
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.193'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.license.title')}
            </h3>
            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.license.description')}
            </p>
          </div>

          {/* Review Process */}
          <div className="space-y-1">
            <h3
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.193'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.review.title')}
            </h3>
            <p
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.review.description')}
            </p>
          </div>
        </div>

        {/* Confirmation Checkboxes */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 w-5 h-5 rounded border-[#E5E5EA] text-[#141414] focus:ring-[#141414] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
            <label
              htmlFor="agree-terms"
              className={`flex-1 text-[#141414] select-none ${!isSubmitting ? 'cursor-pointer' : 'opacity-50'}`}
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.checkboxes.agreeTerms')}
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="confirm-original"
              checked={confirmedOriginalWork}
              onChange={(e) => setConfirmedOriginalWork(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 w-5 h-5 rounded border-[#E5E5EA] text-[#141414] focus:ring-[#141414] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
            <label
              htmlFor="confirm-original"
              className={`flex-1 text-[#141414] select-none ${!isSubmitting ? 'cursor-pointer' : 'opacity-50'}`}
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}
            >
              {t('dashboard.writer.submitText.termsModal.checkboxes.confirmOriginal')}
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[#E5E5EA] rounded-lg text-[#141414] hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '1.221'
            }}
          >
            {t('dashboard.writer.submitText.termsModal.buttons.cancel')}
          </button>
          <button
            type="button"
            onClick={handleAgree}
            disabled={!canAgree || isSubmitting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#141414] text-white rounded-lg hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '1.221',
              minWidth: '102px'
            }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('dashboard.writer.submitText.termsModal.buttons.submitting')}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('dashboard.writer.submitText.termsModal.buttons.agree')}</span>
              </>
            )}
          </button>
        </div>

        {!canAgree && !isSubmitting && (agreedToTerms || confirmedOriginalWork) && (
          <p className="text-sm text-[#DC2626] text-center -mt-2">
            {t('dashboard.writer.submitText.termsModal.error')}
          </p>
        )}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          width: 11px;
        }
        div::-webkit-scrollbar-track {
          background: #F2F2F7;
          border-radius: 100px;
        }
        div::-webkit-scrollbar-thumb {
          background: #8E8E93;
          border-radius: 100px;
        }
      `}</style>
    </Modal>
  );
}
