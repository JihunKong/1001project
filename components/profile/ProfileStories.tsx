'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Story {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  wordCount?: number;
}

interface ProfileStoriesProps {
  userId: string;
  role: string;
}

export function ProfileStories({ userId, role }: ProfileStoriesProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStories() {
      try {
        const response = await fetch('/api/profile/stories');
        if (response.ok) {
          const data = await response.json();
          setStories(data.stories || []);
        }
      } catch (error) {
        console.error('Failed to fetch stories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#E5E5EA] border-t-[#141414] rounded-full animate-spin" />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8E8E93] mb-4" style={{ fontSize: '18px' }}>
          No stories yet
        </p>
        {role === 'WRITER' && (
          <Link
            href="/dashboard/writer/submit"
            className="inline-block px-6 py-3 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803d] transition-colors"
            style={{ fontSize: '16px' }}
          >
            Write Your First Story
          </Link>
        )}
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    STORY_REVIEW: 'bg-blue-100 text-blue-800',
    NEEDS_REVISION: 'bg-orange-100 text-orange-800',
    STORY_APPROVED: 'bg-green-100 text-green-800',
    PUBLISHED: 'bg-green-600 text-white'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#141414] font-medium" style={{ fontSize: '24px' }}>
          Your Stories
        </h2>
        {role === 'WRITER' && (
          <Link
            href="/dashboard/writer/submit"
            className="px-4 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803d] transition-colors"
            style={{ fontSize: '14px' }}
          >
            + New Story
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {stories.map((story) => (
          <Link
            key={story.id}
            href={`/dashboard/writer/story/${story.id}`}
            className="block border border-[#E5E5EA] rounded-lg p-4 hover:border-[#141414] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-[#141414] font-medium mb-1" style={{ fontSize: '18px' }}>
                  {story.title}
                </h3>
                <div className="flex items-center gap-3 text-[#8E8E93]" style={{ fontSize: '14px' }}>
                  <span>
                    {new Date(story.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  {story.wordCount && (
                    <>
                      <span>•</span>
                      <span>{story.wordCount.toLocaleString()} words</span>
                    </>
                  )}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusColors[story.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {story.status.replace(/_/g, ' ')}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
