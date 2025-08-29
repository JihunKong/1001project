'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useSecureFetch } from '@/lib/csrf-context';
import {
  Upload,
  ShoppingCart,
  FileImage,
  Package,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Loader2,
  BookOpen,
  Shirt,
  Gift
} from 'lucide-react';

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string[];
  type: 'book' | 'goods' | 'digital_book';
  stock: string;
  featured: boolean;
  creatorName: string;
  creatorLocation: string;
  creatorAge: string;
  creatorStory: string;
  impactMetric: string;
  impactValue: string;
}

interface ProductUploadFormProps {
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<ProductFormData>;
  submitButtonText?: string;
  title?: string;
  description?: string;
}

export default function ProductUploadForm({
  onSuccess,
  onCancel,
  initialData = {},
  submitButtonText = 'Create Product',
  title = 'Create New Product',
  description = 'Create a new product for the shop with images and creator information'
}: ProductUploadFormProps) {
  const secureFetch = useSecureFetch();
  
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    category: [],
    type: 'goods',
    stock: '1',
    featured: false,
    creatorName: '',
    creatorLocation: '',
    creatorAge: '',
    creatorStory: '',
    impactMetric: 'Days of education for one child',
    impactValue: '1',
    ...initialData
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // Product type options
  const productTypes = [
    { value: 'book', label: 'Physical Book', icon: BookOpen },
    { value: 'goods', label: 'Handmade Goods', icon: Gift },
    { value: 'digital_book', label: 'Digital Book', icon: Package }
  ];

  // Category options
  const categoryOptions = [
    'Books', 'Handicrafts', 'Art', 'Textiles', 'Jewelry', 
    'Home Decor', 'Educational Materials', 'Toys', 'Clothing', 'Food'
  ];

  // Impact metric options
  const impactMetrics = [
    'Days of education for one child',
    'School meals provided',
    'School supplies for one student',
    'Hours of mentorship',
    'Books donated to schools'
  ];

  const onDropImages = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length + images.length > 5) {
      setErrors(prev => [...prev, 'Maximum 5 images allowed']);
      return;
    }
    
    setImages(prev => [...prev, ...imageFiles]);
    setErrors(prev => prev.filter(error => !error.includes('images allowed')));
  }, [images]);

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    onDrop: onDropImages,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(error => !error.includes(field)));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.title.trim()) newErrors.push('Product title is required');
    if (!formData.description.trim()) newErrors.push('Product description is required');
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.push('Valid price is required');
    if (formData.category.length === 0) newErrors.push('At least one category is required');
    if (!formData.creatorName.trim()) newErrors.push('Creator name is required');
    if (!formData.creatorLocation.trim()) newErrors.push('Creator location is required');
    if (!formData.impactValue || parseInt(formData.impactValue) <= 0) newErrors.push('Impact value must be positive');
    if (images.length === 0) newErrors.push('At least one product image is required');
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      const submitFormData = new FormData();
      
      // Add product data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'category') {
          submitFormData.append(key, JSON.stringify(value));
        } else {
          submitFormData.append(key, value.toString());
        }
      });
      
      // Add images
      images.forEach((image, index) => {
        submitFormData.append(`image_${index}`, image);
      });
      
      const response = await secureFetch('/api/admin/shop/products', {
        method: 'POST',
        body: submitFormData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to create product');
      }
      
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(result.productId);
        }
      }, 1500);
      
    } catch (error) {
      console.error('Product creation error:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to create product']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-sm border p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Product Created!</h3>
        <p className="text-gray-600">Your product has been successfully created and added to the shop.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h4 className="text-red-800 font-semibold">Please fix the following errors:</h4>
                <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Product Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Beautiful Handmade Scarf"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your product in detail..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="29.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Product Type and Categories */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {productTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="productType"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="sr-only"
                      />
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{type.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories *
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {categoryOptions.map((category) => (
                  <label
                    key={category}
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.category.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Featured Product</span>
              </label>
            </div>
          </div>
        </div>

        {/* Creator Information */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Creator Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creator Name *
              </label>
              <input
                type="text"
                value={formData.creatorName}
                onChange={(e) => handleInputChange('creatorName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Maria Garcia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creator Location *
              </label>
              <input
                type="text"
                value={formData.creatorLocation}
                onChange={(e) => handleInputChange('creatorLocation', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Guatemala City, Guatemala"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creator Age (optional)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.creatorAge}
                onChange={(e) => handleInputChange('creatorAge', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creator Story *
              </label>
              <textarea
                value={formData.creatorStory}
                onChange={(e) => handleInputChange('creatorStory', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell the story behind this creator..."
              />
            </div>
          </div>
        </div>

        {/* Impact Information */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impact Metric *
              </label>
              <select
                value={formData.impactMetric}
                onChange={(e) => handleInputChange('impactMetric', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {impactMetrics.map((metric) => (
                  <option key={metric} value={metric}>
                    {metric}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impact Value *
              </label>
              <input
                type="number"
                min="1"
                value={formData.impactValue}
                onChange={(e) => handleInputChange('impactValue', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="3"
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images *</h3>
          
          <div
            {...getImageRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isImageDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getImageInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isImageDragActive ? 'Drop images here...' : 'Upload Product Images'}
            </p>
            <p className="text-gray-500">
              Drag & drop images or click to browse (Max 5 images, 10MB each)
            </p>
          </div>

          {images.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Uploaded Images ({images.length}/5)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="border-t border-gray-200 pt-6 flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                {submitButtonText}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}