'use client';

import { BookContentType } from '@prisma/client';

interface BookTypeSelectorProps {
  value: BookContentType;
  onChange: (type: BookContentType) => void;
  disabled?: boolean;
}

export function BookTypeSelector({ value, onChange, disabled }: BookTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Book Type <span className="text-red-500">*</span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onChange('TEXT')}
          disabled={disabled}
          className={`
            p-6 rounded-lg border-2 transition-all duration-200
            ${
              value === 'TEXT'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex flex-col items-center space-y-2">
            <svg
              className={`w-12 h-12 ${value === 'TEXT' ? 'text-blue-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="text-center">
              <div className={`font-semibold ${value === 'TEXT' ? 'text-blue-700' : 'text-gray-700'}`}>
                Text Content
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Write or paste text directly
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange('PDF')}
          disabled={disabled}
          className={`
            p-6 rounded-lg border-2 transition-all duration-200
            ${
              value === 'PDF'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex flex-col items-center space-y-2">
            <svg
              className={`w-12 h-12 ${value === 'PDF' ? 'text-blue-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <div className="text-center">
              <div className={`font-semibold ${value === 'PDF' ? 'text-blue-700' : 'text-gray-700'}`}>
                PDF File
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Upload existing PDF document
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
