'use client';

import { BookRegistrationInput } from '@/lib/validation/book-registration.schema';

interface MetadataFormProps {
  data: Partial<BookRegistrationInput>;
  onChange: (field: keyof BookRegistrationInput, value: any) => void;
  disabled?: boolean;
}

const CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Poetry',
  'Biography',
  'Fantasy',
  'Adventure',
  'Mystery',
  'Science Fiction',
  'Historical',
  'Educational',
];

const AGE_RANGES = [
  '3-5',
  '5-7',
  '7-9',
  '9-12',
  '12-14',
  '14-18',
  '18+',
];

export function MetadataForm({ data, onChange, disabled }: MetadataFormProps) {
  const handleCategoryToggle = (category: string) => {
    const currentCategories = data.category || [];
    if (currentCategories.includes(category)) {
      onChange('category', currentCategories.filter(c => c !== category));
    } else {
      onChange('category', [...currentCategories, category]);
    }
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(t => t.trim()).filter(Boolean);
    onChange('tags', tags);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Language
        </label>
        <select
          value={data.language || 'en'}
          onChange={(e) => onChange('language', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        >
          <option value="en">English</option>
          <option value="ko">Korean (한국어)</option>
          <option value="es">Spanish (Español)</option>
          <option value="fr">French (Français)</option>
          <option value="de">German (Deutsch)</option>
          <option value="ja">Japanese (日本語)</option>
          <option value="zh">Chinese (中文)</option>
          <option value="ar">Arabic (العربية)</option>
          <option value="hi">Hindi (हिन्दी)</option>
          <option value="pt">Portuguese (Português)</option>
          <option value="ru">Russian (Русский)</option>
          <option value="it">Italian (Italiano)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Age Range
        </label>
        <select
          value={data.ageRange || ''}
          onChange={(e) => onChange('ageRange', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        >
          <option value="">Select age range</option>
          {AGE_RANGES.map(range => (
            <option key={range} value={range}>{range} years</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryToggle(category)}
              disabled={disabled}
              className={`
                px-3 py-2 rounded-lg border text-sm transition-colors
                ${(data.category || []).includes(category)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {category}
            </button>
          ))}
        </div>
        {data.category && data.category.length === 0 && (
          <p className="text-sm text-red-600 mt-1">At least one category is required</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={(data.tags || []).join(', ')}
          onChange={(e) => handleTagsChange(e.target.value)}
          disabled={disabled}
          placeholder="adventure, friendship, courage"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
        <p className="text-xs text-gray-500 mt-1">
          Separate tags with commas
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Visibility
        </label>
        <select
          value={data.visibility || 'PUBLIC'}
          onChange={(e) => onChange('visibility', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        >
          <option value="PUBLIC">Public - Anyone can read</option>
          <option value="RESTRICTED">Restricted - Requires permission</option>
          <option value="CLASSROOM">Classroom Only - Teachers assign to students</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPremium"
          checked={data.isPremium || false}
          onChange={(e) => onChange('isPremium', e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isPremium" className="text-sm font-medium text-gray-700">
          Premium Book (requires payment)
        </label>
      </div>

      {data.isPremium && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (USD) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.price || ''}
            onChange={(e) => onChange('price', parseFloat(e.target.value))}
            disabled={disabled}
            min="0"
            step="0.01"
            placeholder="9.99"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      )}
    </div>
  );
}
