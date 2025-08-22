'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  BookOpen,
  FileImage,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

interface BookFormData {
  title: string;
  authorName: string;
  authorEmail: string;
  language: string;
  category: string;
  ageGroup: string;
  summary: string;
  tags: string;
  isbn: string;
  publicationDate: string;
  price: string;
  thumbnailPage: number;
  previewPageLimit: number;
}

interface UploadFiles {
  mainPdf: File | null;
  frontCover: File | null;
  backCover: File | null;
}

export default function NewStoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    authorName: '',
    authorEmail: '',
    language: 'en',
    category: '',
    ageGroup: '',
    summary: '',
    tags: '',
    isbn: '',
    publicationDate: '',
    price: '',
    thumbnailPage: 1,
    previewPageLimit: 5,
  });

  const [files, setFiles] = useState<UploadFiles>({
    mainPdf: null,
    frontCover: null,
    backCover: null,
  });

  const [dragActive, setDragActive] = useState<{
    mainPdf: boolean;
    frontCover: boolean;
    backCover: boolean;
  }>({
    mainPdf: false,
    frontCover: false,
    backCover: false,
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Authentication check
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const handleInputChange = (field: keyof BookFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileUpload = (type: keyof UploadFiles, file: File | null) => {
    if (file && file.type !== 'application/pdf') {
      setError('Please select only PDF files');
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));
    setError(null);
  };

  const handleDrag = (e: React.DragEvent, type: keyof UploadFiles, isActive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: isActive }));
  };

  const handleDrop = (e: React.DragEvent, type: keyof UploadFiles) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(type, droppedFile);
    }
  };

  const showAdvancedOptions = files.mainPdf && !files.frontCover;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.mainPdf) {
      setError('Main PDF file is required');
      return;
    }

    if (!formData.title || !formData.authorName || !formData.summary) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const submitFormData = new FormData();
      
      // Add files
      submitFormData.append('mainPdf', files.mainPdf);
      if (files.frontCover) {
        submitFormData.append('frontCover', files.frontCover);
      }
      if (files.backCover) {
        submitFormData.append('backCover', files.backCover);
      }

      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value.toString());
      });

      const response = await fetch('/api/admin/books/upload', {
        method: 'POST',
        body: submitFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload book');
      }

      setSuccess('Book uploaded successfully!');
      
      // Reset form
      setFormData({
        title: '',
        authorName: '',
        authorEmail: '',
        language: 'en',
        category: '',
        ageGroup: '',
        summary: '',
        tags: '',
        isbn: '',
        publicationDate: '',
        price: '',
        thumbnailPage: 1,
        previewPageLimit: 5,
      });
      setFiles({ mainPdf: null, frontCover: null, backCover: null });

      // Redirect to stories list after 2 seconds
      setTimeout(() => {
        router.push('/admin/stories');
      }, 2000);

    } catch (error) {
      console.error('Error uploading book:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload book');
    } finally {
      setUploading(false);
    }
  };

  const FileUploadZone = ({ 
    type, 
    title, 
    description, 
    icon: Icon, 
    required = false 
  }: {
    type: keyof UploadFiles;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    required?: boolean;
  }) => (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dragActive[type]
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${files[type] ? 'border-green-500 bg-green-50' : ''}`}
      onDragEnter={(e) => handleDrag(e, type, true)}
      onDragLeave={(e) => handleDrag(e, type, false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, type)}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          handleFileUpload(type, file || null);
        };
        input.click();
      }}
    >
      <Icon className={`mx-auto h-12 w-12 mb-4 ${
        files[type] ? 'text-green-500' : 'text-gray-400'
      }`} />
      
      <div className="flex items-center justify-center gap-2 mb-2">
        <h3 className="font-medium text-gray-900">{title}</h3>
        {required && <span className="text-red-500">*</span>}
        {files[type] && <CheckCircle className="w-5 h-5 text-green-500" />}
      </div>
      
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      
      {files[type] ? (
        <div className="mt-2">
          <p className="text-sm font-medium text-green-700">{files[type]!.name}</p>
          <p className="text-xs text-gray-500">
            {(files[type]!.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFileUpload(type, null);
            }}
            className="mt-2 text-red-600 hover:text-red-700 text-sm"
          >
            Remove file
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Click or drag PDF file here</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/admin/stories')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload New Book</h1>
            <p className="text-sm text-gray-600 mt-1">
              Upload main PDF and optional cover files with book metadata
            </p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">PDF Files</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FileUploadZone
                type="mainPdf"
                title="Main Book"
                description="Complete book content PDF file"
                icon={BookOpen}
                required={true}
              />
              
              <FileUploadZone
                type="frontCover"
                title="Front Cover"
                description="Optional front cover PDF file"
                icon={FileImage}
              />
              
              <FileUploadZone
                type="backCover"
                title="Back Cover"
                description="Optional back cover PDF file"
                icon={FileText}
              />
            </div>

            {showAdvancedOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-3">
                      Additional Options (No Cover Files Uploaded)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Thumbnail Page
                        </label>
                        <select
                          value={formData.thumbnailPage}
                          onChange={(e) => handleInputChange('thumbnailPage', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map(page => (
                            <option key={page} value={page}>Page {page}</option>
                          ))}
                        </select>
                        <p className="text-xs text-blue-700 mt-1">
                          Which page of main PDF to use as thumbnail
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Preview Page Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={formData.previewPageLimit}
                          onChange={(e) => handleInputChange('previewPageLimit', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-blue-700 mt-1">
                          How many pages users can preview
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Book Metadata Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Book Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter book title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => handleInputChange('authorName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter author name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author Email
                </label>
                <input
                  type="email"
                  value={formData.authorEmail}
                  onChange={(e) => handleInputChange('authorEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="author@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ko">Korean</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Education">Education</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Group
                </label>
                <select
                  value={formData.ageGroup}
                  onChange={(e) => handleInputChange('ageGroup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select age group</option>
                  <option value="0-3">0-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-8">6-8 years</option>
                  <option value="9-12">9-12 years</option>
                  <option value="13-16">13-16 years</option>
                  <option value="17+">17+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => handleInputChange('isbn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="978-0-123456-78-9"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="9.99"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a brief summary of the book..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="adventure, friendship, magic (comma-separated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate tags with commas
              </p>
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Ready to Upload?</h3>
                <p className="text-sm text-gray-600">
                  Review all information before submitting
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/stories')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={uploading || !files.mainPdf}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Book
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}