'use client';

import { TeacherResource } from './types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  BookOpen, FileText, Image, Video, Music, File,
  Star, Download, Heart, Eye, MoreVertical
} from 'lucide-react';
import { useState } from 'react';

interface ResourceListItemProps {
  resource: TeacherResource;
  onFavoriteToggle?: (resourceId: string, isFavorited: boolean) => void;
  onDownload?: (resource: TeacherResource) => void;
  onView?: (resource: TeacherResource) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  TEXTBOOK: BookOpen,
  WORKSHEET: FileText,
  IMAGE: Image,
  VIDEO: Video,
  AUDIO: Music,
  DOCUMENT: File,
};

const TYPE_COLORS: Record<string, string> = {
  TEXTBOOK: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  WORKSHEET: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  IMAGE: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  VIDEO: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  AUDIO: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  DOCUMENT: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

export default function ResourceListItem({
  resource,
  onFavoriteToggle,
  onDownload,
  onView
}: ResourceListItemProps) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const TypeIcon = TYPE_ICONS[resource.type] || File;
  const typeColor = TYPE_COLORS[resource.type] || TYPE_COLORS.DOCUMENT;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md shadow-apple hover:shadow-apple-lg transition-all duration-apple ease-apple">
      <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 mb-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
            <TypeIcon className="w-3 h-3" />
            {t(`teacherResources.types.${resource.type.toLowerCase()}`)}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
            {t(`teacherResources.subjects.${resource.subject}`)}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
            {t(`teacherResources.grades.${resource.grade}`)}
          </span>
        </div>

        <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
          {resource.title}
        </h3>

        {resource.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
            {resource.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {resource.rating !== null && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {resource.rating.toFixed(1)}
              <span className="text-gray-400">({resource.ratingCount})</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {resource.downloadCount}
          </span>
          {resource.fileSize && (
            <span>{formatFileSize(resource.fileSize)}</span>
          )}
          {resource.duration && (
            <span>{formatDuration(resource.duration)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onView?.(resource)}
          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          aria-label={t('teacherResources.actions.view')}
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDownload?.(resource)}
          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          aria-label={t('teacherResources.actions.download')}
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={() => onFavoriteToggle?.(resource.id, !resource.isFavorited)}
          className={`p-2 rounded-lg transition-colors ${
            resource.isFavorited
              ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
              : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
          aria-label={resource.isFavorited ? t('teacherResources.actions.removeFavorite') : t('teacherResources.actions.addFavorite')}
        >
          <Heart className={`w-5 h-5 ${resource.isFavorited ? 'fill-current' : ''}`} />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--glass-bg)] backdrop-blur-md rounded-lg shadow-apple-lg border border-[var(--glass-border)] py-1 z-10">
              <button
                onClick={() => {
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('teacherResources.actions.addToCollection')}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('teacherResources.actions.share')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
