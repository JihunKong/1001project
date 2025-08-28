'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Tag,
  Globe,
  Star,
  Trash2,
  Download,
  ShoppingCart,
  Settings,
  Users,
  ChevronDown,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface BulkActionPayload {
  action: 'categorize' | 'language' | 'premium' | 'publish' | 'delete' | 'export' | 'convert';
  storyIds: string[];
  payload?: {
    categories?: string[];
    language?: string;
    isPremium?: boolean;
    isPublished?: boolean;
    productType?: 'PHYSICAL_BOOK' | 'DIGITAL_BOOK';
  };
}

interface BulkActionMenuProps {
  selectedStories: string[];
  onClearSelection: () => void;
  onBulkAction: (action: BulkActionPayload) => Promise<void>;
  loading?: boolean;
}

interface BulkActionForm {
  type: string | null;
  categories: string[];
  language: string;
  isPremium: boolean | null;
  isPublished: boolean | null;
  productType: 'PHYSICAL_BOOK' | 'DIGITAL_BOOK';
}

const defaultForm: BulkActionForm = {
  type: null,
  categories: [],
  language: '',
  isPremium: null,
  isPublished: null,
  productType: 'PHYSICAL_BOOK',
};

const availableCategories = [
  'Adventure',
  'Family',
  'Friendship',
  'Education',
  'Fantasy',
  'Real Life',
  'Animals',
  'Nature',
  'Culture',
  'History',
];

const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
];

export default function BulkActionMenu({
  selectedStories,
  onClearSelection,
  onBulkAction,
  loading = false,
}: BulkActionMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [form, setForm] = useState<BulkActionForm>(defaultForm);
  const [processing, setProcessing] = useState(false);

  const handleActionSelect = (action: string) => {
    setActiveAction(action);
    setForm(defaultForm);
  };

  const handleCategoryToggle = (category: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const executeBulkAction = async () => {
    if (!activeAction || selectedStories.length === 0) return;

    const confirmation = confirm(
      `Are you sure you want to apply ${activeAction} to ${selectedStories.length} selected stories?`
    );
    if (!confirmation) return;

    try {
      setProcessing(true);
      
      let payload: BulkActionPayload['payload'] = {};

      switch (activeAction) {
        case 'categorize':
          if (form.categories.length === 0) {
            alert('Please select at least one category');
            return;
          }
          payload = { categories: form.categories };
          break;
        case 'language':
          if (!form.language) {
            alert('Please select a language');
            return;
          }
          payload = { language: form.language };
          break;
        case 'premium':
          payload = { isPremium: form.isPremium ?? undefined };
          break;
        case 'publish':
          payload = { isPublished: form.isPublished ?? undefined };
          break;
        case 'convert':
          payload = { productType: form.productType };
          break;
      }

      await onBulkAction({
        action: activeAction as any,
        storyIds: selectedStories,
        payload,
      });

      // Reset form and close menu
      setActiveAction(null);
      setShowMenu(false);
      setForm(defaultForm);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (selectedStories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {selectedStories.length} {selectedStories.length === 1 ? 'story' : 'stories'} selected
            </span>
          </div>
          <button
            onClick={onClearSelection}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Bulk Actions
          <ChevronDown className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 pt-4"
          >
            {/* Action Selection */}
            {!activeAction && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => handleActionSelect('categorize')}
                  className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Tag className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Categorize</span>
                </button>
                
                <button
                  onClick={() => handleActionSelect('language')}
                  className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Globe className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Set Language</span>
                </button>
                
                <button
                  onClick={() => handleActionSelect('premium')}
                  className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium">Premium Status</span>
                </button>
                
                <button
                  onClick={() => handleActionSelect('convert')}
                  className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Convert to Product</span>
                </button>

                <button
                  onClick={() => handleActionSelect('export')}
                  className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium">Export Selected</span>
                </button>
                
                <button
                  onClick={() => handleActionSelect('delete')}
                  className="flex flex-col items-center gap-2 p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Delete</span>
                </button>
              </div>
            )}

            {/* Action Forms */}
            {activeAction && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Back Button */}
                <button
                  onClick={() => setActiveAction(null)}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Back to actions
                </button>

                {/* Categorize Form */}
                {activeAction === 'categorize' && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Select Categories</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableCategories.map(category => (
                        <label
                          key={category}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            form.categories.includes(category)
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.categories.includes(category)}
                            onChange={() => handleCategoryToggle(category)}
                            className="rounded text-blue-600"
                          />
                          <span className="text-sm">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Language Form */}
                {activeAction === 'language' && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Select Language</h3>
                    <select
                      value={form.language}
                      onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose language...</option>
                      {availableLanguages.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Premium Status Form */}
                {activeAction === 'premium' && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Premium Status</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="premium"
                          checked={form.isPremium === true}
                          onChange={() => setForm(prev => ({ ...prev, isPremium: true }))}
                          className="text-blue-600"
                        />
                        <span>Make Premium (paid content)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="premium"
                          checked={form.isPremium === false}
                          onChange={() => setForm(prev => ({ ...prev, isPremium: false }))}
                          className="text-blue-600"
                        />
                        <span>Make Free (public content)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Convert to Product Form */}
                {activeAction === 'convert' && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Convert to Product</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Type
                        </label>
                        <select
                          value={form.productType}
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            productType: e.target.value as 'PHYSICAL_BOOK' | 'DIGITAL_BOOK'
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PHYSICAL_BOOK">Physical Book</option>
                          <option value="DIGITAL_BOOK">Digital Book</option>
                        </select>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Conversion Process</p>
                            <p className="text-sm text-yellow-700 mt-1">
                              Selected stories will be converted to products. You'll need to set pricing and additional details after conversion.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {activeAction === 'delete' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-800">Delete Stories</h3>
                        <p className="text-sm text-red-700 mt-1">
                          This will permanently delete {selectedStories.length} selected stories. 
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Info */}
                {activeAction === 'export' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-800">Export Stories</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Export {selectedStories.length} selected stories to CSV format. 
                          The file will include all story metadata and content.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setActiveAction(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={executeBulkAction}
                    disabled={processing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeAction === 'delete'
                        ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                    }`}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {processing ? 'Processing...' : `Apply to ${selectedStories.length} stories`}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}