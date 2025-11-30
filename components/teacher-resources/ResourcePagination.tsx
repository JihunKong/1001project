'use client';

import { PaginationInfo } from './types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ResourcePaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export default function ResourcePagination({ pagination, onPageChange }: ResourcePaginationProps) {
  const { t } = useTranslation();
  const { page, totalPages, total, limit } = pagination;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('teacherResources.pagination.showing', {
          start: startItem,
          end: endItem,
          total: total
        })}
      </p>

      <nav className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('teacherResources.pagination.previous')}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {getPageNumbers().map((pageNum, index) => (
          pageNum === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-gray-500 dark:text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum as number)}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                page === pageNum
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {pageNum}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('teacherResources.pagination.next')}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
}
