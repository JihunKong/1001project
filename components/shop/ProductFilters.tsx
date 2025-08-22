'use client';

import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

interface ProductFiltersProps {
  selectedCategory: string;
  selectedSort: string;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
}

export default function ProductFilters({
  selectedCategory,
  selectedSort,
  onCategoryChange,
  onSortChange,
}: ProductFiltersProps) {
  const { t } = useTranslation('common');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categories = [
    { value: 'all', label: t('shop.categories.all'), icon: '🌟' },
    { value: 'books', label: t('shop.categories.books'), icon: '📚' },
    { value: 'goods', label: t('shop.categories.goods'), icon: '🎨' },
  ];

  const sortOptions = [
    { value: 'newest', label: t('shop.filters.sortOptions.newest') },
    { value: 'priceLow', label: t('shop.filters.sortOptions.priceLow') },
    { value: 'priceHigh', label: t('shop.filters.sortOptions.priceHigh') },
    { value: 'popular', label: t('shop.filters.sortOptions.popular') },
  ];

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4" />
        {t('shop.filters.category')}
      </button>

      {/* Filter Panel */}
      <div className={`
        ${isFilterOpen ? 'block' : 'hidden'} md:block
        fixed md:relative top-0 left-0 right-0 bottom-0 md:top-auto md:left-auto md:right-auto md:bottom-auto
        bg-white md:bg-transparent z-40 md:z-auto
        p-6 md:p-0
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsFilterOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="space-y-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              {t('shop.filters.category')}
            </h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => onCategoryChange(category.value)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${selectedCategory === category.value
                      ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              {t('shop.filters.sort')}
            </h3>
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range (Optional - can be implemented later) */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              {t('shop.filters.price')}
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Under $25</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">$25 - $50</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">$50 - $100</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Over $100</span>
              </label>
            </div>
          </div>
        </div>

        {/* Mobile Apply Button */}
        <button
          onClick={() => setIsFilterOpen(false)}
          className="md:hidden w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>

      {/* Mobile Overlay */}
      {isFilterOpen && (
        <div
          onClick={() => setIsFilterOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
}