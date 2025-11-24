'use client';

import { useState } from 'react';

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
      {toggles.map((toggle) => {
        const isEnabled = enabledTypes.has(toggle.type);
        return (
          <button
            key={toggle.type}
            onClick={() => toggleType(toggle.type)}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: isEnabled ? 500 : 400,
              color: isEnabled ? toggle.color : '#8E8E93',
              backgroundColor: isEnabled ? `${toggle.color}15` : 'transparent',
              border: isEnabled ? `2px solid ${toggle.color}` : '1px solid #E5E5EA',
            }}
          >
            {toggle.label}
          </button>
        );
      })}
    </div>
  );
}
