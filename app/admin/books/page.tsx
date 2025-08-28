'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function BooksRedirectPage() {
  useEffect(() => {
    // Client-side redirect with immediate effect
    window.location.replace('/admin/stories');
  }, []);

  // Server-side redirect for SEO
  redirect('/admin/stories');

  // Fallback content (should not render due to redirect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Digital Library...</p>
      </div>
    </div>
  );
}