'use client';

import { X, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface AIAnnotation {
  suggestionIndex: number;
  highlightedText: string;
  startOffset: number;
  endOffset: number;
  suggestionType: string;
  color: string;
}

interface AISuggestionPopoverProps {
  annotation: AIAnnotation;
  suggestion: string;
  reviewType: string;
  onClose: () => void;
  onAccept?: () => void;
}

const REVIEW_TYPE_COLORS: Record<string, string> = {
  GRAMMAR: '#fbbf24',
  STRUCTURE: '#38bdf8',
  WRITING_HELP: '#a78bfa'
};

export default function AISuggestionPopover({
  annotation,
  suggestion,
  reviewType,
  onClose,
  onAccept
}: AISuggestionPopoverProps) {
  const { t } = useTranslation();

  const badgeColor = REVIEW_TYPE_COLORS[reviewType] || '#fbbf24';

  const getReviewTypeLabel = (type: string): string => {
    switch (type) {
      case 'GRAMMAR':
        return t('dashboard.writer.submitText.aiSuggestion.reviewType.grammar');
      case 'STRUCTURE':
        return t('dashboard.writer.submitText.aiSuggestion.reviewType.structure');
      case 'WRITING_HELP':
        return t('dashboard.writer.submitText.aiSuggestion.reviewType.writingHelp');
      default:
        return type;
    }
  };

  const label = getReviewTypeLabel(reviewType);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-10 z-40"
        onClick={onClose}
      />

      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl border border-[#E5E5EA] z-50 max-w-md w-full mx-4"
        style={{ maxHeight: '80vh' }}
      >
        <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: badgeColor }} />
            <span
              className="px-2 py-1 rounded text-white text-sm font-medium"
              style={{ backgroundColor: badgeColor }}
            >
              {label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8E8E93] hover:text-[#141414] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          <div className="mb-4">
            <p
              className="text-[#8E8E93] mb-2"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              {t('dashboard.writer.submitText.aiSuggestion.selectedText')}
            </p>
            <p
              className="bg-[#F9FAFB] p-3 rounded border border-[#E5E5EA]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#141414'
              }}
            >
              &quot;{annotation.highlightedText}&quot;
            </p>
          </div>

          <div>
            <p
              className="text-[#8E8E93] mb-2"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              {t('dashboard.writer.submitText.aiSuggestion.title')}
            </p>
            <p
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#141414'
              }}
            >
              {suggestion}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[#E5E5EA] flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#141414] hover:bg-[#F9FAFB] rounded transition-colors"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {t('common.buttons.dismiss')}
          </button>
          {onAccept && (
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-4 py-2 bg-[#141414] text-white hover:bg-[#1f1f1f] rounded transition-colors"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {t('common.buttons.accept')}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
