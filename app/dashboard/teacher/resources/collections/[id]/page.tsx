'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  ArrowLeft,
  FolderOpen,
  Download,
  ExternalLink,
  Heart,
  Trash2,
  Edit2,
  Save,
  X,
  Lock,
  Globe,
  FileText,
  Video,
  Headphones,
  Image,
  File,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  subject: string;
  gradeLevel: string;
  fileUrl: string;
  fileSize: number | null;
  thumbnailUrl: string | null;
  downloadCount: number;
  isFavorited: boolean;
  addedToCollectionAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  createdAt: string;
}

interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  itemCount: number;
  resources: Resource[];
  isOwner: boolean;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'DOCUMENT':
    case 'WORKSHEET':
    case 'LESSON_PLAN':
      return FileText;
    case 'VIDEO':
      return Video;
    case 'AUDIO':
      return Headphones;
    case 'IMAGE':
    case 'PRESENTATION':
      return Image;
    default:
      return File;
  }
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function CollectionDetailPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '', isPublic: false });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchCollection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teacher-resources/collections/${collectionId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Collection not found');
        } else if (response.status === 403) {
          setError('You do not have permission to view this collection');
        } else {
          throw new Error('Failed to fetch collection');
        }
        return;
      }

      const data = await response.json();
      setCollection(data);
      setEditData({
        name: data.name,
        description: data.description || '',
        isPublic: data.isPublic,
      });
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError('Failed to load collection');
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && collectionId) {
      fetchCollection();
    }
  }, [status, collectionId, fetchCollection, router]);

  const handleFavoriteToggle = async (resourceId: string, shouldFavorite: boolean) => {
    try {
      const method = shouldFavorite ? 'POST' : 'DELETE';
      const response = await fetch(`/api/teacher-resources/favorites/${resourceId}`, {
        method,
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      setCollection(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          resources: prev.resources.map(r =>
            r.id === resourceId ? { ...r, isFavorited: shouldFavorite } : r
          ),
        };
      });

      toast.success(
        shouldFavorite
          ? t('teacherResources.success.addedToFavorites')
          : t('teacherResources.success.removedFromFavorites')
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error(t('teacherResources.errors.favoriteFailed'));
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/teacher-resources/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) throw new Error('Failed to update collection');

      const updated = await response.json();
      setCollection(prev => prev ? { ...prev, ...updated } : prev);
      setIsEditing(false);
      toast.success('Collection updated successfully');
    } catch (err) {
      console.error('Error updating collection:', err);
      toast.error('Failed to update collection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/teacher-resources/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete collection');

      toast.success('Collection deleted successfully');
      router.push('/dashboard/teacher/resources');
    } catch (err) {
      console.error('Error deleting collection:', err);
      toast.error('Failed to delete collection');
    }
    setShowDeleteConfirm(false);
  };

  const handleRemoveFromCollection = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/teacher-resources/collections/${collectionId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId }),
      });

      if (!response.ok) throw new Error('Failed to remove resource');

      setCollection(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          resources: prev.resources.filter(r => r.id !== resourceId),
          itemCount: prev.itemCount - 1,
        };
      });

      toast.success('Resource removed from collection');
    } catch (err) {
      console.error('Error removing resource:', err);
      toast.error('Failed to remove resource');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-soe-green-500 mx-auto" />
          <p className="mt-4 text-gray-600">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/teacher/resources')}
            className="bg-soe-green-500 hover:bg-soe-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Resources
          </button>
        </div>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push('/dashboard/teacher/resources')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="text-2xl font-bold w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    placeholder="Add a description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.isPublic}
                      onChange={(e) => setEditData({ ...editData, isPublic: e.target.checked })}
                      className="rounded border-gray-300 text-soe-green-500 focus:ring-soe-green-500"
                    />
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Make this collection public</span>
                  </label>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{collection.name}</h1>
                    {collection.isPublic ? (
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        <Globe className="h-3 w-3" /> Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        <Lock className="h-3 w-3" /> Private
                      </span>
                    )}
                  </div>
                  {collection.description && (
                    <p className="text-gray-600 mt-2">{collection.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>{collection.itemCount} resources</span>
                    <span>Created by {collection.user.name || 'Unknown'}</span>
                    <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>
            {collection.isOwner && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-soe-green-500 hover:bg-soe-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit collection"
                    >
                      <Edit2 className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete collection"
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {collection.resources.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
            <p className="text-gray-500 mb-6">
              This collection is empty. Add resources from the library to get started.
            </p>
            <button
              onClick={() => router.push('/dashboard/teacher/resources')}
              className="bg-soe-green-500 hover:bg-soe-green-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Browse Resources
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.resources.map((resource) => {
              const Icon = getResourceIcon(resource.type);
              return (
                <div
                  key={resource.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-soe-green-100 to-soe-green-200 rounded-lg">
                        <Icon className="h-6 w-6 text-soe-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {resource.type.replace('_', ' ')} • {formatFileSize(resource.fileSize)}
                        </p>
                      </div>
                    </div>

                    {resource.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{resource.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                        {resource.subject}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {resource.gradeLevel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFavoriteToggle(resource.id, !resource.isFavorited)}
                          className={`p-2 rounded-lg transition-colors ${
                            resource.isFavorited
                              ? 'bg-red-100 text-red-500'
                              : 'hover:bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${resource.isFavorited ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => window.open(resource.fileUrl, '_blank')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                          title="View"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.open(resource.fileUrl, '_blank')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                      {collection.isOwner && (
                        <button
                          onClick={() => handleRemoveFromCollection(resource.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400"
                          title="Remove from collection"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Collection?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{collection.name}&quot;? This action cannot be undone.
              The resources will remain in the library.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
