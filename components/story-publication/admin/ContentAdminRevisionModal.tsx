'use client';

import { useState } from 'react';
import Modal from '@/components/figma/ui/Modal';
import { AlertCircle, Calendar, Flag, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ContentAdminRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContentAdminRevisionData) => void;
  isSubmitting?: boolean;
  submissionTitle: string;
}

export interface ContentAdminRevisionData {
  notes: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  revisionTypes: string[];
  targetRole: 'BOOK_MANAGER' | 'STORY_MANAGER' | 'WRITER';
}

const REVISION_TYPES = [
  { id: 'policy', label: 'Content Policy', description: 'Content needs adjustment for policy compliance' },
  { id: 'format', label: 'Format Changes', description: 'Publication format needs reconsideration' },
  { id: 'quality', label: 'Quality Standards', description: 'Does not meet publication quality standards' },
  { id: 'legal', label: 'Legal Review', description: 'Requires legal or copyright review' },
  { id: 'appropriateness', label: 'Age Appropriateness', description: 'Age rating or content appropriateness concerns' },
  { id: 'metadata', label: 'Metadata Issues', description: 'Categories, tags, or description need updates' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low Priority', color: 'text-gray-600', bg: 'bg-gray-100' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'HIGH', label: 'High Priority', color: 'text-orange-600', bg: 'bg-orange-100' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
];

const TARGET_OPTIONS = [
  { value: 'BOOK_MANAGER', label: 'Send to Book Manager', description: 'Return for format reconsideration' },
  { value: 'STORY_MANAGER', label: 'Send to Story Manager', description: 'Return for story re-review' },
  { value: 'WRITER', label: 'Send to Writer', description: 'Return to author for content revisions' },
];

export default function ContentAdminRevisionModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  submissionTitle
}: ContentAdminRevisionModalProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [revisionTypes, setRevisionTypes] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<'BOOK_MANAGER' | 'STORY_MANAGER' | 'WRITER'>('BOOK_MANAGER');
  const [showValidation, setShowValidation] = useState(false);

  const handleRevisionTypeToggle = (typeId: string) => {
    setRevisionTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSubmit = () => {
    setShowValidation(true);

    if (notes.trim().length < 20) {
      return;
    }

    onSubmit({
      notes: notes.trim(),
      priority,
      dueDate: dueDate || undefined,
      revisionTypes,
      targetRole
    });

    handleReset();
  };

  const handleReset = () => {
    setNotes('');
    setPriority('MEDIUM');
    setDueDate('');
    setRevisionTypes([]);
    setTargetRole('BOOK_MANAGER');
    setShowValidation(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      handleReset();
      onClose();
    }
  };

  const isValid = notes.trim().length >= 20;
  const charCount = notes.trim().length;

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('dashboard.contentAdmin.revisionModal.title')}
      size="lg"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="space-y-6">
        <div className="bg-[#F9FAFB] border border-[#E5E5EA] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[#141414] mb-1">{t('dashboard.contentAdmin.revisionModal.story')}</h3>
          <p className="text-[#141414] font-medium">{submissionTitle}</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#141414] mb-2">
            <ArrowLeft className="h-4 w-4" />
            {t('dashboard.contentAdmin.revisionModal.sendTo')}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {TARGET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTargetRole(option.value as 'BOOK_MANAGER' | 'STORY_MANAGER' | 'WRITER')}
                disabled={isSubmitting}
                className={`flex flex-col items-start px-4 py-3 border-2 rounded-lg text-sm transition-all ${
                  targetRole === option.value
                    ? 'bg-soe-green-50 border-soe-green-500 text-soe-green-700'
                    : 'border-[#E5E5EA] text-[#8E8E93] hover:border-[#D1D1D6]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs mt-1">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#141414] mb-2">
            <Flag className="h-4 w-4" />
            {t('dashboard.contentAdmin.revisionModal.priority')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRIORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value as any)}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  priority === option.value
                    ? `${option.bg} border-current ${option.color}`
                    : 'border-[#E5E5EA] text-[#8E8E93] hover:border-[#D1D1D6]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    priority === option.value ? option.bg.replace('bg-', 'bg-opacity-100 bg-') : 'bg-gray-300'
                  }`}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#141414] mb-2">
            <Calendar className="h-4 w-4" />
            {t('dashboard.contentAdmin.revisionModal.dueDate')}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={getMinDate()}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-soe-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-[#8E8E93] mt-1">
            {t('dashboard.contentAdmin.revisionModal.dueDateHint')}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-[#141414] mb-2 block">
            {t('dashboard.contentAdmin.revisionModal.revisionTypes')}
          </label>
          <div className="space-y-2">
            {REVISION_TYPES.map((type) => (
              <label
                key={type.id}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  revisionTypes.includes(type.id)
                    ? 'border-soe-green-500 bg-soe-green-50'
                    : 'border-[#E5E5EA] hover:border-[#D1D1D6]'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={revisionTypes.includes(type.id)}
                  onChange={() => handleRevisionTypeToggle(type.id)}
                  disabled={isSubmitting}
                  className="mt-0.5 w-4 h-4 rounded border-[#E5E5EA] text-soe-green-500 focus:ring-soe-green-500 focus:ring-offset-0 disabled:cursor-not-allowed"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#141414]">{type.label}</div>
                  <div className="text-xs text-[#8E8E93] mt-0.5">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-[#141414] mb-2 block">
            {t('dashboard.contentAdmin.revisionModal.notes')} <span className="text-red-600">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('dashboard.contentAdmin.revisionModal.notesPlaceholder')}
            rows={6}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 border rounded-lg text-[#141414] focus:outline-none focus:ring-2 focus:ring-soe-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              showValidation && !isValid
                ? 'border-red-500'
                : 'border-[#E5E5EA]'
            }`}
          />
          <div className="flex items-center justify-between mt-2">
            <p className={`text-xs ${
              showValidation && !isValid
                ? 'text-red-600'
                : charCount >= 20
                ? 'text-green-600'
                : 'text-[#8E8E93]'
            }`}>
              {charCount < 20
                ? t('dashboard.contentAdmin.revisionModal.charsNeeded', { count: 20 - charCount })
                : t('dashboard.contentAdmin.revisionModal.charCount', { count: charCount })}
            </p>
            {showValidation && !isValid && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t('dashboard.contentAdmin.revisionModal.minChars')}
              </p>
            )}
          </div>
        </div>

        <div className="bg-soe-green-50 border border-soe-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-soe-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-soe-green-700">
              <p className="font-medium mb-1">{t('dashboard.contentAdmin.revisionModal.guidelinesTitle')}</p>
              <ul className="space-y-1 text-xs">
                <li>• {t('dashboard.contentAdmin.revisionModal.guideline1')}</li>
                <li>• {t('dashboard.contentAdmin.revisionModal.guideline2')}</li>
                <li>• {t('dashboard.contentAdmin.revisionModal.guideline3')}</li>
                <li>• {t('dashboard.contentAdmin.revisionModal.guideline4')}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-[#E5E5EA] rounded-lg text-[#141414] font-medium hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('dashboard.contentAdmin.revisionModal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="flex-1 px-4 py-3 bg-[#FF9500] text-white rounded-lg font-medium hover:bg-[#FF8C00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? t('dashboard.contentAdmin.revisionModal.submitting') : t('dashboard.contentAdmin.revisionModal.submit')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
