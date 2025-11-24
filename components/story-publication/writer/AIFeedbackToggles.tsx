'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface AIFeedbackTogglesProps {
  onToggle: (enabledTypes: Set<string>) => void;
}

export default function AIFeedbackToggles({ onToggle }: AIFeedbackTogglesProps) {
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(
    new Set(['GRAMMAR', 'STRUCTURE', 'WRITING_HELP'])
  );

  const toggleType = (type: string) => {
    const newEnabled = new Set(enabledTypes);
    if (newEnabled.has(type)) {
      newEnabled.delete(type);
    } else {
      newEnabled.add(type);
    }
    setEnabledTypes(newEnabled);
    onToggle(newEnabled);
  };

  const toggles = [
    {
      type: 'GRAMMAR',
      label: '문법 검사',
      color: '#FBBF24',
    },
    {
      type: 'STRUCTURE',
      label: '구조 분석',
      color: '#38BDF8',
    },
    {
      type: 'WRITING_HELP',
      label: '작문 도움말',
      color: '#A78BFA',
    },
  ];

  return (
    <div className="flex gap-3 mb-4">
      {toggles.map((toggle) => (
        <button
          key={toggle.type}
          onClick={() => toggleType(toggle.type)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E5EA] bg-white hover:bg-[#F9FAFB] transition-colors"
        >
          <CheckCircle2
            className={`h-5 w-5 transition-all ${
              enabledTypes.has(toggle.type) ? 'opacity-100' : 'opacity-30'
            }`}
            style={{ color: toggle.color }}
          />
          <span
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              color: toggle.color,
            }}
          >
            {toggle.label}
          </span>
        </button>
      ))}
    </div>
  );
}
