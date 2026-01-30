'use client';

import Link from 'next/link';
import LibraryGridCard from './LibraryGridCard';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Book {
  id: string;
  title: string;
  authorName: string;
  coverImage?: string;
  isFavorited?: boolean;
}

interface CategorySectionProps {
  title: string;
  books: Book[];
  viewAllHref?: string;
  showViewAll?: boolean;
  maxBooks?: number;
  getBookHref?: (bookId: string) => string;
  onFavoriteToggle?: (bookId: string, isFavorited: boolean) => void;
  onViewAll?: (category: string) => void;
}

export default function CategorySection({
  title,
  books,
  viewAllHref,
  showViewAll = true,
  maxBooks = 4,
  getBookHref,
  onFavoriteToggle,
  onViewAll
}: CategorySectionProps) {
  const { t } = useTranslation();

  if (books.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-6">
        <h2
          className="text-black"
          style={{
            fontFamily: 'Metropolis, "Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '36px',
            fontWeight: 500,
            lineHeight: '1em'
          }}
        >
          {title}
        </h2>
        {showViewAll && (onViewAll || viewAllHref) && (
          onViewAll ? (
            <button
              onClick={() => onViewAll(title)}
              className="text-[#141414] hover:text-[#141414]/70 transition-colors"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '20px',
                fontWeight: 400,
                lineHeight: '1.193em'
              }}
            >
              {t('library.viewAll') || 'View all'}
            </button>
          ) : viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-[#141414] hover:text-[#141414]/70 transition-colors"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '20px',
                fontWeight: 400,
                lineHeight: '1.193em'
              }}
            >
              {t('library.viewAll') || 'View all'}
            </Link>
          ) : null
        )}
      </div>

      {/* Books Grid - 4 columns with 12px gap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {books.slice(0, maxBooks).map((book) => (
          <LibraryGridCard
            key={book.id}
            id={book.id}
            title={book.title}
            authorName={book.authorName}
            coverImage={book.coverImage}
            href={getBookHref ? getBookHref(book.id) : undefined}
            isFavorited={book.isFavorited}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>
    </div>
  );
}
