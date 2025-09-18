'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, X, Check } from 'lucide-react';
import { useState } from 'react';

interface TermsDisclosuresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (acceptances: { personalInfoAck: boolean; respectfulLangAck: boolean }) => void;
  isLoading?: boolean;
}

export default function TermsDisclosuresModal({
  isOpen,
  onClose,
  onAccept,
  isLoading = false
}: TermsDisclosuresModalProps) {
  const [personalInfoAck, setPersonalInfoAck] = useState(false);
  const [respectfulLangAck, setRespectfulLangAck] = useState(false);

  const canProceed = personalInfoAck && respectfulLangAck;

  const handleAccept = () => {
    if (canProceed) {
      onAccept({ personalInfoAck, respectfulLangAck });
    }
  };

  const handleClose = () => {
    setPersonalInfoAck(false);
    setRespectfulLangAck(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Terms & Disclosures
                  </h2>
                  <p className="text-sm text-gray-600">
                    Please review and accept before writing your story
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Guidelines Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">Story Guidelines</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                  <p className="mb-2">
                    Your story will be reviewed by our editorial team and may be published to help 
                    other learners around the world. Please ensure your story:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Is appropriate for all ages</li>
                    <li>Promotes positive values and learning</li>
                    <li>Does not contain harmful or offensive content</li>
                    <li>Respects cultural diversity and inclusion</li>
                  </ul>
                </div>
              </div>

              {/* Checkbox 1: Personal Information */}
              <div className="mb-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={personalInfoAck}
                      onChange={(e) => setPersonalInfoAck(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      personalInfoAck 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                      {personalInfoAck && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Personal Information Policy
                    </p>
                    <p className="text-sm text-gray-600">
                      I understand that I should not include personal information (full names, addresses, 
                      phone numbers, school names, etc.) in my story to protect privacy and safety.
                    </p>
                  </div>
                </label>
              </div>

              {/* Checkbox 2: Respectful Language */}
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={respectfulLangAck}
                      onChange={(e) => setRespectfulLangAck(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      respectfulLangAck 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                      {respectfulLangAck && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Respectful Language Agreement
                    </p>
                    <p className="text-sm text-gray-600">
                      I agree to use respectful, inclusive language in my story and to avoid content 
                      that could be harmful, discriminatory, or inappropriate for educational purposes.
                    </p>
                  </div>
                </label>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Safe & Supportive Environment
                    </p>
                    <p className="text-sm text-blue-700">
                      Your story will be reviewed by our team before publication to ensure it meets 
                      our community standards and provides a positive learning experience for all readers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={!canProceed || isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    'Continue to Write Story'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}