'use client';

import { TeacherResource } from './types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  BookOpen, FileText, Image, Video, Music, File,
  Star, Download, Heart, MoreVertical, Play, Eye
} from 'lucide-react';
import { useState } from 'react';

interface ResourceCardProps {
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

export default function ResourceCard({
  resource,
  onFavoriteToggle,
  onDownload,
  onView
}: ResourceCardProps) {
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
    <div className="group rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md shadow-apple overflow-hidden hover:shadow-apple-lg transition-all duration-apple ease-apple">
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeColor}`}>
            <TypeIcon className="w-3.5 h-3.5" />
            {t(`teacherResources.types.${resource.type.toLowerCase()}`)}
          </span>
        </div>

        {(resource.type === 'VIDEO' || resource.type === 'AUDIO') && resource.duration && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {formatDuration(resource.duration)}
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={() => onView?.(resource)}
            className="p-3 bg-white/90 rounded-full text-gray-800 hover:bg-white transition-colors"
            aria-label={t('teacherResources.actions.view')}
          >
            {resource.type === 'VIDEO' ? <Play className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onDownload?.(resource)}
            className="p-3 bg-white/90 rounded-full text-gray-800 hover:bg-white transition-colors"
            aria-label={t('teacherResources.actions.download')}
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 flex-1">
            {resource.title}
          </h3>
          <div className="relative">
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
                    onFavoriteToggle?.(resource.id, !resource.isFavorited);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {resource.isFavorited
                    ? t('teacherResources.actions.removeFavorite')
                    : t('teacherResources.actions.addFavorite')
                  }
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('teacherResources.actions.addToCollection')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
            {t(`teacherResources.subjects.${resource.subject}`)}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
            {t(`teacherResources.grades.${resource.grade}`)}
          </span>
          {resource.fileSize && (
            <span>{formatFileSize(resource.fileSize)}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            {resource.rating !== null && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {resource.rating.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {resource.downloadCount}
            </span>
          </div>
          <button
            onClick={() => onFavoriteToggle?.(resource.id, !resource.isFavorited)}
            className={`p-1.5 rounded-full transition-colors ${
              resource.isFavorited
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
            aria-label={resource.isFavorited ? t('teacherResources.actions.removeFavorite') : t('teacherResources.actions.addFavorite')}
          >
            <Heart className={`w-4 h-4 ${resource.isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
