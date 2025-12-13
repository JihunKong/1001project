'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

interface LibraryGridCardProps {
  id: string;
  title: string;
  authorName: string;
  coverImage?: string;
  href?: string;
}

export default function LibraryGridCard({
  id,
  title,
  authorName,
  coverImage,
  href
}: LibraryGridCardProps) {
  const linkHref = href || `/books/${id}`;

  return (
    <Link href={linkHref} className="block group">
      <div className="flex flex-col gap-8">
        {/* Cover Image - Square format matching Figma */}
        <div className="relative w-full aspect-square bg-[#F6F6F6] rounded-lg overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <BookOpen className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex flex-col gap-2">
          <h3
            className="text-black line-clamp-2 group-hover:text-[#141414]/80 transition-colors"
            style={{
              fontFamily: 'Metropolis, "Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '18px',
              fontWeight: 500,
              lineHeight: '1em'
            }}
          >
            {title}
          </h3>
          <p
            className="text-black"
            style={{
              fontFamily: 'Metropolis, "Helvetica Neue", -apple-system, system-ui, sans-serif',
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: '1em'
            }}
          >
            {authorName}
          </p>
        </div>
      </div>
    </Link>
  );
}
