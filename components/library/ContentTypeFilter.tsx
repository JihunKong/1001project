'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { FileText, FileImage } from 'lucide-react';

export type ContentType = 'TEXT' | 'PDF';

interface ContentTypeFilterProps {
  selected: ContentType[];
  onChange: (types: ContentType[]) => void;
}

export function ContentTypeFilter({ selected, onChange }: ContentTypeFilterProps) {
  const { t } = useTranslation();

  const contentTypes: { id: ContentType; label: string; icon: React.ElementType }[] = [
    {
      id: 'PDF',
      label: t('library.contentType.pdf'),
      icon: FileImage,
    },
    {
      id: 'TEXT',
      label: t('library.contentType.text'),
      icon: FileText,
    },
  ];

  const handleToggle = (type: ContentType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {t('library.contentType.title')}
      </h3>
      <div className="space-y-2">
        {contentTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selected.includes(type.id);

          return (
            <label
              key={type.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(type.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <Icon
                className={`h-4 w-4 ${
                  isSelected
                    ? 'text-blue-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              <span
                className={`text-sm ${
                  isSelected
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {type.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
