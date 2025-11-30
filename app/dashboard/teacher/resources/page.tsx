'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  ResourceTabs,
  ResourceFilters,
  ResourceCard,
  ResourceListItem,
  CollectionCard,
  ResourcePagination,
  CreateCollectionModal,
  TeacherResource,
  ResourceCollection,
  PaginationInfo,
  TabType,
  ViewType,
  SortType,
  FilterState,
} from '@/components/teacher-resources';
import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherResourcesPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('resources');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [sortBy, setSortBy] = useState<SortType>('createdAt');
  const [filters, setFilters] = useState<FilterState>({
    type: '',
    subject: '',
    grade: '',
    search: '',
  });
  const [page, setPage] = useState(1);

  const [resources, setResources] = useState<TeacherResource[]>([]);
  const [collections, setCollections] = useState<ResourceCollection[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [counts, setCounts] = useState({
    resources: 0,
    collections: 0,
    favorites: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        sortOrder: 'desc',
        ...(filters.type && { type: filters.type }),
        ...(filters.subject && { subject: filters.subject }),
        ...(filters.grade && { grade: filters.grade }),
        ...(filters.search && { search: filters.search }),
      });

      const endpoint = activeTab === 'favorites'
        ? `/api/teacher-resources/favorites?${params}`
        : `/api/teacher-resources?${params}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch resources');

      const data = await response.json();
      setResources(data.resources);
      setPagination(data.pagination);

      if (activeTab === 'resources') {
        setCounts(prev => ({ ...prev, resources: data.pagination.total }));
      } else if (activeTab === 'favorites') {
        setCounts(prev => ({ ...prev, favorites: data.pagination.total }));
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error(t('teacherResources.errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, sortBy, filters, t]);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });

      const response = await fetch(`/api/teacher-resources/collections?${params}`);
      if (!response.ok) throw new Error('Failed to fetch collections');

      const data = await response.json();
      setCollections(data.collections);
      setPagination(data.pagination);
      setCounts(prev => ({ ...prev, collections: data.pagination.total }));
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error(t('teacherResources.errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      if (activeTab === 'collections') {
        fetchCollections();
      } else {
        fetchResources();
      }
    }
  }, [status, activeTab, fetchResources, fetchCollections, router]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, filters, sortBy]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleFavoriteToggle = async (resourceId: string, shouldFavorite: boolean) => {
    try {
      const method = shouldFavorite ? 'POST' : 'DELETE';
      const response = await fetch(`/api/teacher-resources/favorites/${resourceId}`, {
        method,
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      setResources(prev =>
        prev.map(r =>
          r.id === resourceId ? { ...r, isFavorited: shouldFavorite } : r
        )
      );

      toast.success(
        shouldFavorite
          ? t('teacherResources.success.addedToFavorites')
          : t('teacherResources.success.removedFromFavorites')
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('teacherResources.errors.favoriteFailed'));
    }
  };

  const handleDownload = (resource: TeacherResource) => {
    window.open(resource.fileUrl, '_blank');
  };

  const handleView = (resource: TeacherResource) => {
    window.open(resource.fileUrl, '_blank');
  };

  const handleCollectionClick = (collection: ResourceCollection) => {
    router.push(`/dashboard/teacher/resources/collections/${collection.id}`);
  };

  const handleCreateCollection = async (data: { name: string; description: string; isPublic: boolean }) => {
    setIsCreatingCollection(true);
    try {
      const response = await fetch('/api/teacher-resources/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create collection');

      const newCollection = await response.json();
      setCollections(prev => [newCollection, ...prev]);
      setCounts(prev => ({ ...prev, collections: prev.collections + 1 }));
      setIsCreateModalOpen(false);
      toast.success(t('teacherResources.success.collectionCreated'));
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error(t('teacherResources.errors.createCollectionFailed'));
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm(t('teacherResources.confirm.deleteCollection'))) return;

    try {
      const response = await fetch(`/api/teacher-resources/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete collection');

      setCollections(prev => prev.filter(c => c.id !== collectionId));
      setCounts(prev => ({ ...prev, collections: prev.collections - 1 }));
      toast.success(t('teacherResources.success.collectionDeleted'));
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error(t('teacherResources.errors.deleteCollectionFailed'));
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('teacherResources.title')}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('teacherResources.subtitle')}
            </p>
          </div>

          {activeTab === 'collections' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('teacherResources.collections.create')}
            </button>
          )}
        </div>

        <ResourceTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={counts}
        />

        <div className="mt-6">
          {activeTab !== 'collections' && (
            <ResourceFilters
              filters={filters}
              onFilterChange={setFilters}
              viewType={viewType}
              onViewTypeChange={setViewType}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          )}
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : activeTab === 'collections' ? (
            collections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map(collection => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onClick={handleCollectionClick}
                    onDelete={handleDeleteCollection}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('teacherResources.empty.collections')}
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-5 h-5" />
                  {t('teacherResources.collections.createFirst')}
                </button>
              </div>
            )
          ) : resources.length > 0 ? (
            viewType === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {resources.map(resource => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onFavoriteToggle={handleFavoriteToggle}
                    onDownload={handleDownload}
                    onView={handleView}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map(resource => (
                  <ResourceListItem
                    key={resource.id}
                    resource={resource}
                    onFavoriteToggle={handleFavoriteToggle}
                    onDownload={handleDownload}
                    onView={handleView}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === 'favorites'
                  ? t('teacherResources.empty.favorites')
                  : t('teacherResources.empty.resources')
                }
              </p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <ResourcePagination
              pagination={pagination}
              onPageChange={setPage}
            />
          )}
        </div>

        <CreateCollectionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCollection}
          isLoading={isCreatingCollection}
        />
      </div>
    </div>
  );
}
