'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  StoryCard,
  NewStoryCard,
  BookCard,
  AchievementsSection,
  ProfileSidebar
} from '@/components/mypage';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Story {
  id: string;
  title: string;
  content: string;
  summary?: string;
  status: string;
  generatedImages?: string[];
  updatedAt: string;
}

interface Book {
  id: string;
  title: string;
  authorName: string;
  coverUrl?: string;
  progress?: number;
}

interface UserProfile {
  name: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  tags?: { id: string; name: string; color: string }[];
}

const defaultBadges = [
  { id: '1', name: 'First Story', icon: 'pen' as const, color: 'pink', earned: true },
  { id: '2', name: '7-Day Streak', icon: 'streak' as const, color: 'yellow', earned: true },
  { id: '3', name: 'Global Reader', icon: 'globe' as const, color: 'blue', earned: true },
  { id: '4', name: 'Story Lover', icon: 'heart' as const, color: 'red', earned: true },
  { id: '5', name: 'Published Author', icon: 'thumbs' as const, color: 'green', earned: true },
  { id: '6', name: 'Coming Soon', icon: 'lock' as const, color: 'gray', earned: false }
];

const defaultMilestones = [
  { id: '1', name: 'Write 5 Stories', current: 3, target: 5, message: 'Almost there! 2 more to go.' },
  { id: '2', name: 'Write 5,000 Words', current: 2847, target: 5000, message: "You're doing Great! Keep writing." }
];

export default function MyPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'stories' | 'library'>('stories');
  const [storyFilter, setStoryFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [libraryFilter, setLibraryFilter] = useState<'purchased' | 'favorites'>('purchased');

  const [stories, setStories] = useState<Story[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [storiesRes, booksRes, profileRes] = await Promise.all([
        fetch('/api/text-submissions?author=me'),
        fetch('/api/user/library'),
        fetch('/api/profile')
      ]);

      if (storiesRes.ok) {
        const storiesData = await storiesRes.json();
        setStories(storiesData.submissions || []);
      }

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooks(booksData.books || []);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile({
          name: profileData.name || session?.user?.name || 'User',
          avatarUrl: profileData.profile?.avatarUrl || session?.user?.image,
          bio: profileData.profile?.bio,
          role: profileData.role || 'WRITER',
          tags: profileData.profile?.tags?.map((t: string, i: number) => ({
            id: String(i),
            name: t,
            color: ['blue', 'green', 'orange'][i % 3]
          })) || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter((story) => {
    if (storyFilter === 'draft') return story.status === 'DRAFT' || story.status === 'NEEDS_REVISION';
    if (storyFilter === 'published') return story.status === 'PUBLISHED';
    return true;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-[#141414] animate-spin" />
          <p className="text-[#8E8E93]">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const userName = userProfile?.name || session?.user?.name || 'User';

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 px-8 lg:px-[100px] py-10 max-w-[960px]">
        <h1
          className="text-[#141414] font-medium mb-8"
          style={{ fontSize: '40px', lineHeight: 1.2 }}
        >
          {t('myPage.greeting', { name: userName.split(' ')[0] })}
        </h1>

        <div className="space-y-8">
          <div className="border-b border-[#E5E5EA]">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('stories')}
                className={`pb-3 px-4 font-medium transition-colors relative ${
                  activeTab === 'stories'
                    ? 'text-[#141414]'
                    : 'text-[#8E8E93] hover:text-[#141414]'
                }`}
                style={{ fontSize: '17px' }}
              >
                {t('myPage.tabs.myStories')}
                {activeTab === 'stories' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`pb-3 px-4 font-medium transition-colors relative ${
                  activeTab === 'library'
                    ? 'text-[#141414]'
                    : 'text-[#8E8E93] hover:text-[#141414]'
                }`}
                style={{ fontSize: '17px' }}
              >
                {t('myPage.tabs.myLibrary')}
                {activeTab === 'library' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]" />
                )}
              </button>
            </div>
          </div>

          {activeTab === 'stories' && (
            <div className="space-y-5">
              <div className="flex gap-2">
                <button
                  onClick={() => setStoryFilter('draft')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    storyFilter === 'draft'
                      ? 'bg-[#141414] text-white'
                      : 'bg-[#F5F5F7] text-[#141414] hover:bg-[#E5E5EA]'
                  }`}
                >
                  {t('myPage.stories.filters.draft')}
                </button>
                <button
                  onClick={() => setStoryFilter('published')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    storyFilter === 'published'
                      ? 'bg-[#141414] text-white'
                      : 'bg-[#F5F5F7] text-[#141414] hover:bg-[#E5E5EA]'
                  }`}
                >
                  {t('myPage.stories.filters.published')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    id={story.id}
                    title={story.title || t('myPage.stories.untitled')}
                    description={story.summary || story.content?.replace(/<[^>]*>/g, '').substring(0, 100) + '...'}
                    status={story.status}
                    thumbnailUrl={story.generatedImages?.[0]}
                    editedAt={story.updatedAt}
                  />
                ))}
                <NewStoryCard />
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-5">
              <div className="flex gap-2">
                <button
                  onClick={() => setLibraryFilter('purchased')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    libraryFilter === 'purchased'
                      ? 'bg-[#141414] text-white'
                      : 'bg-[#F5F5F7] text-[#141414] hover:bg-[#E5E5EA]'
                  }`}
                >
                  {t('myPage.library.filters.purchased')}
                </button>
                <button
                  onClick={() => setLibraryFilter('favorites')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    libraryFilter === 'favorites'
                      ? 'bg-[#141414] text-white'
                      : 'bg-[#F5F5F7] text-[#141414] hover:bg-[#E5E5EA]'
                  }`}
                >
                  {t('myPage.library.filters.favorites')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    id={book.id}
                    title={book.title}
                    author={book.authorName}
                    coverUrl={book.coverUrl}
                    progress={book.progress || 0}
                  />
                ))}
                {books.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-[#8E8E93]">
                    {t('myPage.library.empty')}
                  </div>
                )}
              </div>
            </div>
          )}

          <AchievementsSection
            badges={defaultBadges}
            milestones={defaultMilestones}
          />
        </div>
      </div>

      <div className="hidden lg:block w-[320px] flex-shrink-0">
        {userProfile && (
          <ProfileSidebar
            user={{
              name: userProfile.name,
              avatarUrl: userProfile.avatarUrl,
              bio: userProfile.bio,
              role: userProfile.role
            }}
            tags={userProfile.tags || []}
          />
        )}
      </div>
    </div>
  );
}
