'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Search,
  Grid,
  List,
  Eye,
  Trash2,
  Download,
  Copy,
  File,
  X,
} from 'lucide-react';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  description?: string;
  tags: string[];
  folder: string;
  width?: number;
  height?: number;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
}

interface MediaResponse {
  mediaFiles: MediaFile[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const ITEMS_PER_PAGE = 20;

export default function MediaManagement() {
  const { data: session, status } = useSession();
  
  // All hooks must be called at the top level, before any early returns
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('/');
  const [selectedType, setSelectedType] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const fetchMediaFiles = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        folder: selectedFolder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedType && { type: selectedType }),
      });

      const response = await fetch(`/api/admin/media/upload?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media files');

      const data: MediaResponse = await response.json();
      setMediaFiles(data.mediaFiles);
      setPagination({
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
        totalCount: data.pagination.totalCount,
      });
    } catch (error) {
      console.error('Error fetching media files:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, selectedType, searchTerm]);

  const uploadFiles = useCallback(async (files: File[]) => {
    setUploading(true);
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', selectedFolder);
      formData.append('tags', JSON.stringify([]));

      try {
        const response = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return null;
      }
    });

    try {
      await Promise.all(uploadPromises);
      fetchMediaFiles(); // Refresh the list
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  }, [selectedFolder, fetchMediaFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    uploadFiles(acceptedFiles);
  }, [uploadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  useEffect(() => {
    if (session && session.user.role === UserRole.ADMIN) {
      fetchMediaFiles();
    }
  }, [selectedFolder, selectedType, searchTerm, fetchMediaFiles, session]);

  // Early returns after all hooks are defined
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete file');

      fetchMediaFiles(); // Refresh the list
      setSelectedFile(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) return;

    try {
      const deletePromises = selectedFiles.map(id =>
        fetch(`/api/admin/media/${id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      setSelectedFiles([]);
      fetchMediaFiles(); // Refresh the list
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Failed to delete files');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  const toggleFileSelection = (id: string) => {
    setSelectedFiles(prev =>
      prev.includes(id)
        ? prev.filter(fileId => fileId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and organize your media files
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedFiles.length})
                </button>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="application">Documents</option>
              <option value="text">Text Files</option>
            </select>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="/">Root Folder</option>
              <option value="/stories">Stories</option>
              <option value="/stories/covers">Story Covers</option>
              <option value="/illustrations">Illustrations</option>
              <option value="/documents">Documents</option>
            </select>
          </div>
        </div>

        {/* File Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {mediaFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all ${
                      selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="relative group">
                      <div
                        className="aspect-square flex items-center justify-center bg-gray-100"
                        onClick={() => setSelectedFile(file)}
                      >
                        {isImage(file.mimeType) ? (
                          <img
                            src={file.thumbnailUrl || file.url}
                            alt={file.altText || file.originalName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4">
                            <File className="w-12 h-12 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 text-center truncate w-full">
                              {file.originalName}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="w-4 h-4 text-blue-600 bg-white rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(file.url);
                          }}
                          className="p-1 bg-white/90 rounded text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-900 truncate" title={file.originalName}>
                        {file.originalName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            mediaFiles.length > 0 &&
                            mediaFiles.every(file => selectedFiles.includes(file.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFiles(mediaFiles.map(file => file.id));
                            } else {
                              setSelectedFiles([]);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mediaFiles.map((file) => (
                      <motion.tr
                        key={file.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`hover:bg-gray-50 ${
                          selectedFiles.includes(file.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => toggleFileSelection(file.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10">
                              {isImage(file.mimeType) ? (
                                <img
                                  src={file.thumbnailUrl || file.url}
                                  alt={file.altText || file.originalName}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                  <File className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.originalName}
                              </p>
                              <p className="text-sm text-gray-500">{file.mimeType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>
                            <p>{new Date(file.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs">by {file.uploadedBy.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedFile(file)}
                              className="p-1 text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => copyToClipboard(file.url)}
                              className="p-1 text-gray-600 hover:text-gray-900"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1 text-gray-600 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                  {Math.min(pagination.page * ITEMS_PER_PAGE, pagination.totalCount)} of{' '}
                  {pagination.totalCount} files
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchMediaFiles(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchMediaFiles(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Upload Files</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600 font-medium">Drop the files here...</p>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">
                      Drag and drop files here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Images, PDFs, text files up to 10MB each
                    </p>
                  </>
                )}
              </div>
              {uploading && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Uploading files...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">File Details</h2>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {isImage(selectedFile.mimeType) ? (
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.altText || selectedFile.originalName}
                      className="w-full rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-12 text-center">
                      <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">{selectedFile.originalName}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Name
                    </label>
                    <p className="text-sm text-gray-900">{selectedFile.originalName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Size
                    </label>
                    <p className="text-sm text-gray-900">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <p className="text-sm text-gray-900">{selectedFile.mimeType}</p>
                  </div>
                  {selectedFile.width && selectedFile.height && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dimensions
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedFile.width} × {selectedFile.height}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={selectedFile.url}
                        readOnly
                        className="flex-1 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded px-3 py-2"
                      />
                      <button
                        onClick={() => copyToClipboard(selectedFile.url)}
                        className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Uploaded
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedFile.createdAt).toLocaleString()} by {selectedFile.uploadedBy.name}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <a
                      href={selectedFile.url}
                      download={selectedFile.originalName}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                    <button
                      onClick={() => handleDeleteFile(selectedFile.id)}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}