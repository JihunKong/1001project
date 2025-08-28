'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Book,
  ShoppingCart,
  DollarSign,
  Package,
  Image as ImageIcon,
  Settings,
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  Copy,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Story {
  id: string;
  title: string;
  content: string;
  summary?: string;
  language: string;
  category: string[];
  authorName: string;
  coverImage?: string;
  tags: string[];
  isPremium: boolean;
  fullPdf?: string;
}

interface ProductVariant {
  id?: string;
  title: string;
  price: number;
  sku: string;
  attributes: {
    format?: string;
    size?: string;
    quality?: string;
  };
}

interface ConversionData {
  productType: 'PHYSICAL_BOOK' | 'DIGITAL_BOOK';
  title: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  variants: ProductVariant[];
  preserveStory: boolean;
  coverImageUrl?: string;
  category: string;
  tags: string[];
}

interface StoryToProductModalProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (data: ConversionData) => Promise<void>;
  loading?: boolean;
}

const defaultConversionData: ConversionData = {
  productType: 'PHYSICAL_BOOK',
  title: '',
  description: '',
  price: 0,
  currency: 'USD',
  sku: '',
  variants: [],
  preserveStory: true,
  category: '',
  tags: [],
};

const physicalBookVariants = [
  { format: 'Paperback', sizes: ['A4', 'A5', 'Letter'], qualities: ['Standard', 'Premium'] },
  { format: 'Hardcover', sizes: ['A4', 'A5'], qualities: ['Standard', 'Premium', 'Deluxe'] },
];

const digitalBookVariants = [
  { format: 'PDF', qualities: ['Standard', 'High-Resolution'] },
  { format: 'EPUB', qualities: ['Standard'] },
  { format: 'Audio', qualities: ['MP3', 'WAV'] },
];

export default function StoryToProductModal({
  story,
  isOpen,
  onClose,
  onConvert,
  loading = false,
}: StoryToProductModalProps) {
  const [step, setStep] = useState(1);
  const [conversionData, setConversionData] = useState<ConversionData>(defaultConversionData);
  const [processing, setProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize form data when story changes
  useEffect(() => {
    if (story) {
      setConversionData({
        ...defaultConversionData,
        title: story.title,
        description: story.summary || `${story.content.substring(0, 200)}...`,
        sku: generateSKU(story.title, story.language),
        category: story.category[0] || '',
        tags: story.tags,
        coverImageUrl: story.coverImage,
      });
      setStep(1);
    }
  }, [story]);

  const generateSKU = (title: string, language: string) => {
    const titlePart = title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    const langPart = language.toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${titlePart}-${langPart}-${randomPart}`;
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      title: `${conversionData.productType === 'PHYSICAL_BOOK' ? 'Paperback' : 'PDF'} Edition`,
      price: conversionData.price || 10,
      sku: `${conversionData.sku}-VAR${conversionData.variants.length + 1}`,
      attributes: {
        format: conversionData.productType === 'PHYSICAL_BOOK' ? 'Paperback' : 'PDF',
        size: conversionData.productType === 'PHYSICAL_BOOK' ? 'A5' : undefined,
        quality: 'Standard',
      },
    };
    
    setConversionData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setConversionData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const removeVariant = (index: number) => {
    setConversionData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleConvert = async () => {
    if (!story) return;

    setProcessing(true);
    try {
      await onConvert(conversionData);
      onClose();
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getAvailableFormats = () => {
    return conversionData.productType === 'PHYSICAL_BOOK' 
      ? physicalBookVariants 
      : digitalBookVariants;
  };

  if (!isOpen || !story) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Convert Story to Product</h2>
                <p className="text-sm text-gray-600">Transform "{story.title}" into a sellable product</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= stepNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
                  </div>
                  <span className={`text-sm ${
                    step >= stepNum ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {stepNum === 1 && 'Basic Info'}
                    {stepNum === 2 && 'Product Details'}
                    {stepNum === 3 && 'Review & Convert'}
                  </span>
                  {stepNum < 3 && <div className="w-8 h-px bg-gray-300 ml-2" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex h-[calc(90vh-180px)]">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Step 1: Basic Information */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Product Information</h3>
                      
                      {/* Product Type */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Product Type</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setConversionData(prev => ({ ...prev, productType: 'PHYSICAL_BOOK' }))}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                              conversionData.productType === 'PHYSICAL_BOOK'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Book className="w-6 h-6 text-blue-600 mb-2" />
                            <div className="font-medium">Physical Book</div>
                            <div className="text-sm text-gray-600">Printed, shipped to customers</div>
                          </button>
                          
                          <button
                            onClick={() => setConversionData(prev => ({ ...prev, productType: 'DIGITAL_BOOK' }))}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                              conversionData.productType === 'DIGITAL_BOOK'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Package className="w-6 h-6 text-blue-600 mb-2" />
                            <div className="font-medium">Digital Book</div>
                            <div className="text-sm text-gray-600">Download, instant delivery</div>
                          </button>
                        </div>
                      </div>

                      {/* Title and Description */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
                          <input
                            type="text"
                            value={conversionData.title}
                            onChange={(e) => setConversionData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                          <textarea
                            value={conversionData.description}
                            onChange={(e) => setConversionData(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                              value={conversionData.category}
                              onChange={(e) => setConversionData(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select category...</option>
                              <option value="childrens-books">Children's Books</option>
                              <option value="educational">Educational</option>
                              <option value="fiction">Fiction</option>
                              <option value="non-fiction">Non-Fiction</option>
                              <option value="art-culture">Art & Culture</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                            <input
                              type="text"
                              value={story.language}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Product Details */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing & Variants</h3>
                      
                      {/* Base Pricing */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Base Price</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              step="0.01"
                              value={conversionData.price}
                              onChange={(e) => setConversionData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={conversionData.sku}
                              onChange={(e) => setConversionData(prev => ({ ...prev, sku: e.target.value }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => setConversionData(prev => ({ 
                                ...prev, 
                                sku: generateSKU(story.title, story.language) 
                              }))}
                              className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
                              title="Generate new SKU"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Variants */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">Product Variants</label>
                          <button
                            onClick={addVariant}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Variant
                          </button>
                        </div>

                        <div className="space-y-3">
                          {conversionData.variants.map((variant, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <input
                                  type="text"
                                  value={variant.title}
                                  onChange={(e) => updateVariant(index, 'title', e.target.value)}
                                  className="font-medium bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                                />
                                <button
                                  onClick={() => removeVariant(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Price</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Format</label>
                                  <select
                                    value={variant.attributes.format || ''}
                                    onChange={(e) => updateVariant(index, 'attributes', { ...variant.attributes, format: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  >
                                    {getAvailableFormats().map(formatGroup => (
                                      <option key={formatGroup.format} value={formatGroup.format}>
                                        {formatGroup.format}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {conversionData.productType === 'PHYSICAL_BOOK' && (
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Size</label>
                                    <select
                                      value={variant.attributes.size || ''}
                                      onChange={(e) => updateVariant(index, 'attributes', { ...variant.attributes, size: e.target.value })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    >
                                      <option value="A5">A5</option>
                                      <option value="A4">A4</option>
                                      <option value="Letter">Letter</option>
                                    </select>
                                  </div>
                                )}

                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Quality</label>
                                  <select
                                    value={variant.attributes.quality || ''}
                                    onChange={(e) => updateVariant(index, 'attributes', { ...variant.attributes, quality: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  >
                                    <option value="Standard">Standard</option>
                                    <option value="Premium">Premium</option>
                                    {conversionData.productType === 'PHYSICAL_BOOK' && (
                                      <option value="Deluxe">Deluxe</option>
                                    )}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {conversionData.variants.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                              <p>No variants added yet</p>
                              <p className="text-sm">Click "Add Variant" to create product options</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Convert</h3>
                      
                      {/* Conversion Summary */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Original Story</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Title:</strong> {story.title}</p>
                              <p><strong>Author:</strong> {story.authorName}</p>
                              <p><strong>Language:</strong> {story.language}</p>
                              <p><strong>Categories:</strong> {story.category.join(', ')}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">New Product</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Type:</strong> {conversionData.productType.replace('_', ' ')}</p>
                              <p><strong>Title:</strong> {conversionData.title}</p>
                              <p><strong>Base Price:</strong> ${conversionData.price}</p>
                              <p><strong>Variants:</strong> {conversionData.variants.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-4">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={conversionData.preserveStory}
                            onChange={(e) => setConversionData(prev => ({ ...prev, preserveStory: e.target.checked }))}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">
                            Keep original story active in Digital Library
                          </span>
                        </label>
                      </div>

                      {/* Warning */}
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-800">Before Converting</h4>
                            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                              <li>• Product will be created in draft status</li>
                              <li>• You can edit pricing and details later</li>
                              <li>• Inventory will need to be set up for physical books</li>
                              <li>• Digital products will link to the story's PDF file</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Preview Panel */}
            {previewMode && (
              <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Product Preview</h4>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    {story.coverImage && (
                      <div className="mb-3">
                        <img
                          src={story.coverImage}
                          alt={conversionData.title}
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    )}
                    <h5 className="font-medium text-gray-900 mb-1">{conversionData.title}</h5>
                    <p className="text-sm text-gray-600 mb-2">by {story.authorName}</p>
                    <p className="text-lg font-bold text-blue-600 mb-2">${conversionData.price}</p>
                    <p className="text-xs text-gray-500 mb-3">{conversionData.description}</p>
                    
                    {conversionData.variants.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Available Options:</p>
                        <div className="space-y-1">
                          {conversionData.variants.map((variant, index) => (
                            <div key={index} className="text-xs text-gray-600 flex justify-between">
                              <span>{variant.title}</span>
                              <span>${variant.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  {processing ? 'Converting...' : 'Convert to Product'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}