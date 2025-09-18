'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  Image, 
  Info, 
  AlertCircle,
  Check,
  X,
  Loader2
} from 'lucide-react';

interface FormData {
  title: string;
  authorName: string;
  authorAge: string;
  authorLocation: string;
  summary: string;
  language: string;
  ageRange: string;
  readingLevel: string;
  categories: string[];
  tags: string[];
  format: string;
  filePath: string;
  coverImagePath: string;
  submissionId: string;
}

export default function NewBookSubmissionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    authorName: '',
    authorAge: '',
    authorLocation: '',
    summary: '',
    language: 'en',
    ageRange: '',
    readingLevel: '',
    categories: [],
    tags: [],
    format: '',
    filePath: '',
    coverImagePath: '',
    submissionId: ''
  });

  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  const [uploadedCover, setUploadedCover] = useState<{
    name: string;
    size: number;
    preview: string;
  } | null>(null);

  const handleFileUpload = async (file: File, type: 'content' | 'cover') => {
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/book-submissions/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      
      if (type === 'content') {
        setFormData(prev => ({
          ...prev,
          format: data.fileType,
          filePath: data.filePath,
          submissionId: data.submissionId,
          wordCount: data.wordCount
        }));
        setUploadedFile({
          name: data.fileName,
          size: data.size,
          type: data.fileType
        });
      } else {
        setFormData(prev => ({
          ...prev,
          coverImagePath: data.filePath
        }));
        
        // Create preview URL for cover image
        const preview = URL.createObjectURL(file);
        setUploadedCover({
          name: data.fileName,
          size: data.size,
          preview
        });
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (submitForReview: boolean) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/book-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          authorAge: formData.authorAge ? parseInt(formData.authorAge) : null,
          submitForReview
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Submission failed');
      }

      router.push('/admin/book-submissions');
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      setLoading(false);
    }
  };

  const categories = [
    'Fiction', 'Non-Fiction', 'Poetry', 'Drama', 
    'Folktale', 'Adventure', 'Mystery', 'Science', 
    'History', 'Biography'
  ];

  const readingLevels = [
    'Beginner (A1)', 'Elementary (A2)', 'Pre-Intermediate (B1)', 
    'Intermediate (B2)', 'Upper-Intermediate (C1)', 'Advanced (C2)'
  ];

  const ageRanges = [
    '3-5', '6-8', '9-12', '13-15', '16-18', '18+'
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit New Book</h1>
        <p className="text-gray-600">Upload and submit a new book for review and publication</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'
          }`}>
            {step > 1 ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <span className="ml-2 font-medium">Upload Files</span>
        </div>
        <div className="flex-1 h-1 bg-gray-300 mx-4">
          <div className={`h-full bg-blue-600 transition-all ${
            step >= 2 ? 'w-full' : 'w-0'
          }`} />
        </div>
        <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'
          }`}>
            {step > 2 ? <Check className="w-5 h-5" /> : '2'}
          </div>
          <span className="ml-2 font-medium">Book Details</span>
        </div>
        <div className="flex-1 h-1 bg-gray-300 mx-4">
          <div className={`h-full bg-blue-600 transition-all ${
            step >= 3 ? 'w-full' : 'w-0'
          }`} />
        </div>
        <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'
          }`}>
            3
          </div>
          <span className="ml-2 font-medium">Review & Submit</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Step 1: Upload Files */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Book Files</h2>
          
          {/* Content File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Book Content File *
            </label>
            <div className={`border-2 border-dashed rounded-lg p-6 ${
              uploadedFile ? 'border-green-500 bg-green-50' : 'border-gray-300'
            }`}>
              {uploadedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setFormData(prev => ({ ...prev, filePath: '', format: '' }));
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.md,.html,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'content');
                    }}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="text-center">
                    {uploading ? (
                      <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    )}
                    <p className="text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PDF, MD, HTML, or TXT (Max 50MB)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image (Optional)
            </label>
            <div className={`border-2 border-dashed rounded-lg p-6 ${
              uploadedCover ? 'border-green-500 bg-green-50' : 'border-gray-300'
            }`}>
              {uploadedCover ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src={uploadedCover.preview} 
                      alt="Cover" 
                      className="w-16 h-20 object-cover rounded mr-3"
                    />
                    <div>
                      <p className="font-medium">{uploadedCover.name}</p>
                      <p className="text-sm text-gray-600">
                        {(uploadedCover.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedCover(null);
                      setFormData(prev => ({ ...prev, coverImagePath: '' }));
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'cover');
                    }}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="text-center">
                    {uploading ? (
                      <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-spin" />
                    ) : (
                      <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    )}
                    <p className="text-gray-600">
                      Click to upload cover image
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, PNG, or WebP (Max 5MB)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!uploadedFile}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Book Details
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Book Details */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Book Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter book title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author Name *
              </label>
              <input
                type="text"
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter author name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author Age (Optional)
              </label>
              <input
                type="number"
                value={formData.authorAge}
                onChange={(e) => setFormData({ ...formData, authorAge: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author Location (Optional)
              </label>
              <input
                type="text"
                value={formData.authorLocation}
                onChange={(e) => setFormData({ ...formData, authorLocation: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Seoul, South Korea"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="ko">Korean</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age Range
              </label>
              <select
                value={formData.ageRange}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select age range</option>
                {ageRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reading Level
              </label>
              <select
                value={formData.readingLevel}
                onChange={(e) => setFormData({ ...formData, readingLevel: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select reading level</option>
                {readingLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Summary / Description
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Brief description of the book..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        categories: prev.categories.includes(category)
                          ? prev.categories.filter(c => c !== category)
                          : [...prev.categories, category]
                      }));
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      formData.categories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., adventure, friendship, school life"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.title || !formData.authorName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Submission Process:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Your submission will be saved as a draft</li>
                  <li>You can submit it for review immediately or later</li>
                  <li>A volunteer will review the content</li>
                  <li>Coordinator approval will be required</li>
                  <li>Final admin approval will publish the book</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Title:</span>
                <p className="font-medium">{formData.title}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Author:</span>
                <p className="font-medium">{formData.authorName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Format:</span>
                <p className="font-medium">{formData.format?.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Language:</span>
                <p className="font-medium">{formData.language.toUpperCase()}</p>
              </div>
              {formData.readingLevel && (
                <div>
                  <span className="text-sm text-gray-600">Reading Level:</span>
                  <p className="font-medium">{formData.readingLevel}</p>
                </div>
              )}
              {formData.ageRange && (
                <div>
                  <span className="text-sm text-gray-600">Age Range:</span>
                  <p className="font-medium">{formData.ageRange}</p>
                </div>
              )}
            </div>
            
            {formData.categories.length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Categories:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.categories.map(cat => (
                    <span key={cat} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {formData.summary && (
              <div>
                <span className="text-sm text-gray-600">Summary:</span>
                <p className="mt-1">{formData.summary}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <div className="space-x-3">
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save as Draft'
                )}
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit for Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}