'use client';

import { Lightbulb } from 'lucide-react';

export default function WritingTipsCard() {
  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-[#141414]" />
          <h3
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '20px',
              fontWeight: 500,
              lineHeight: '1.221',
              color: '#141414'
            }}
          >
            Writing Tips
          </h3>
        </div>

        <p
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '1.193',
            color: '#8E8E93'
          }}
        >
          Get instant feedback on grammar, structure, and style to improve your story&apos;s quality.
        </p>

        <button
          className="w-full bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-md py-3 transition-colors"
          onClick={() => {
            window.open('/help', '_blank');
          }}
        >
          <span
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '1.221',
              color: '#141414'
            }}
          >
            Learn more
          </span>
        </button>
      </div>
    </div>
  );
}
