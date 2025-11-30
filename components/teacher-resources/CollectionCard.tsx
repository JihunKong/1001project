'use client';

import { ResourceCollection } from './types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Folder, MoreVertical, Lock, Globe } from 'lucide-react';
import { useState } from 'react';

interface CollectionCardProps {
  collection: ResourceCollection;
  onClick?: (collection: ResourceCollection) => void;
  onEdit?: (collection: ResourceCollection) => void;
  onDelete?: (collectionId: string) => void;
}

export default function CollectionCard({
  collection,
  onClick,
  onEdit,
  onDelete
}: CollectionCardProps) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="group rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md shadow-apple overflow-hidden hover:shadow-apple-lg transition-all duration-apple ease-apple cursor-pointer"
      onClick={() => onClick?.(collection)}
    >
      <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
        {collection.previewResources.length > 0 ? (
          <div className="grid grid-cols-2 gap-0.5 w-full h-full">
            {collection.previewResources.slice(0, 4).map((resource, index) => (
              <div
                key={resource.id}
                className="bg-gray-200 dark:bg-gray-600 overflow-hidden"
              >
                {resource.thumbnailUrl ? (
                  <img
                    src={resource.thumbnailUrl}
                    alt={resource.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            {collection.previewResources.length < 4 &&
              Array.from({ length: 4 - collection.previewResources.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="bg-gray-200 dark:bg-gray-600"
                />
              ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Folder className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {collection.isPublic ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs">
              <Globe className="w-3 h-3" />
              {t('teacherResources.collections.public')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-full text-xs">
              <Lock className="w-3 h-3" />
              {t('teacherResources.collections.private')}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 flex-1">
            {collection.name}
          </h3>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--glass-bg)] backdrop-blur-md rounded-lg shadow-apple-lg border border-[var(--glass-border)] py-1 z-10">
                <button
                  onClick={() => {
                    onEdit?.(collection);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('teacherResources.actions.edit')}
                </button>
                <button
                  onClick={() => {
                    onDelete?.(collection.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('teacherResources.actions.delete')}
                </button>
              </div>
            )}
          </div>
        </div>

        {collection.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {collection.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            {t('teacherResources.collections.itemCount', { count: collection.itemCount })}
          </span>
          <span>
            {new Date(collection.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
