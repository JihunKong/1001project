'use client';

import { useState } from 'react';
import Modal from '@/components/figma/ui/Modal';
import { AlertCircle, Calendar, Flag } from 'lucide-react';

interface RevisionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RevisionRequestData) => void;
  isSubmitting?: boolean;
  submissionTitle: string;
}

export interface RevisionRequestData {
  notes: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  revisionTypes: string[];
}

const REVISION_TYPES = [
  { id: 'grammar', label: 'Grammar & Spelling', description: 'Correct grammatical errors and typos' },
  { id: 'structure', label: 'Story Structure', description: 'Improve narrative flow and pacing' },
  { id: 'content', label: 'Content Issues', description: 'Address content appropriateness or accuracy' },
  { id: 'formatting', label: 'Formatting', description: 'Fix formatting and layout issues' },
  { id: 'style', label: 'Writing Style', description: 'Enhance clarity and readability' },
  { id: 'character', label: 'Character Development', description: 'Strengthen character depth' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low Priority', color: 'text-gray-600', bg: 'bg-gray-100' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'HIGH', label: 'High Priority', color: 'text-orange-600', bg: 'bg-orange-100' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
];

export default function RevisionRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  submissionTitle
}: RevisionRequestModalProps) {
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [revisionTypes, setRevisionTypes] = useState<string[]>([]);
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
      revisionTypes
    });

    handleReset();
  };

  const handleReset = () => {
    setNotes('');
    setPriority('MEDIUM');
    setDueDate('');
    setRevisionTypes([]);
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
      title="Request Story Revision"
      size="lg"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="space-y-6">
        {/* Submission Info */}
        <div className="bg-[#F9FAFB] border border-[#E5E5EA] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[#141414] mb-1">Story</h3>
          <p className="text-[#141414] font-medium">{submissionTitle}</p>
        </div>

        {/* Priority Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#141414] mb-2">
            <Flag className="h-4 w-4" />
            Priority Level
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

        {/* Due Date (Optional) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#141414] mb-2">
            <Calendar className="h-4 w-4" />
            Due Date (Optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={getMinDate()}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5951E7] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-[#8E8E93] mt-1">
            Set a target completion date for this revision
          </p>
        </div>

        {/* Revision Types Checklist */}
        <div>
          <label className="text-sm font-medium text-[#141414] mb-2 block">
            Revision Types (Select all that apply)
          </label>
          <div className="space-y-2">
            {REVISION_TYPES.map((type) => (
              <label
                key={type.id}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  revisionTypes.includes(type.id)
                    ? 'border-[#5951E7] bg-[#EEF2FF]'
                    : 'border-[#E5E5EA] hover:border-[#D1D1D6]'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={revisionTypes.includes(type.id)}
                  onChange={() => handleRevisionTypeToggle(type.id)}
                  disabled={isSubmitting}
                  className="mt-0.5 w-4 h-4 rounded border-[#E5E5EA] text-[#5951E7] focus:ring-[#5951E7] focus:ring-offset-0 disabled:cursor-not-allowed"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#141414]">{type.label}</div>
                  <div className="text-xs text-[#8E8E93] mt-0.5">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Revision Notes */}
        <div>
          <label className="text-sm font-medium text-[#141414] mb-2 block">
            Detailed Revision Notes <span className="text-red-600">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explain what needs to be revised and provide specific guidance for the author..."
            rows={6}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 border rounded-lg text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#5951E7] disabled:opacity-50 disabled:cursor-not-allowed ${
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
                ? `${20 - charCount} more characters required`
                : `${charCount} characters`}
            </p>
            {showValidation && !isValid && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Minimum 20 characters required
              </p>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-[#5951E7] flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-[#5951E7]">
              <p className="font-medium mb-1">Revision Request Guidelines</p>
              <ul className="space-y-1 text-xs">
                <li>• Be specific about what needs improvement</li>
                <li>• Provide actionable feedback the author can follow</li>
                <li>• Use inline comments for detailed line-by-line feedback</li>
                <li>• Consider the author&apos;s skill level and experience</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-[#E5E5EA] rounded-lg text-[#141414] font-medium hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="flex-1 px-4 py-3 bg-[#FF9500] text-white rounded-lg font-medium hover:bg-[#FF8C00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Requesting Revision...' : 'Request Revision'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
