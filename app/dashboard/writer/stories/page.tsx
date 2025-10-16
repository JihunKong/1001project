'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, MoreHorizontal } from 'lucide-react';
import DashboardLoadingState from '@/components/dashboard/DashboardLoadingState';
import DashboardErrorState from '@/components/dashboard/DashboardErrorState';

interface TextSubmission {
  id: string;
  title: string;
  summary: string;
  status: string;
  wordCount?: number | null;
  updatedAt: string;
  createdAt: string;
}

type TabStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'PUBLISHED' | 'FEEDBACK';

const statusTabs = [
  { label: 'Draft', value: 'DRAFT' as TabStatus },
  { label: 'Submitted', value: 'SUBMITTED' as TabStatus },
  { label: 'Under Review', value: 'UNDER_REVIEW' as TabStatus },
  { label: 'Published', value: 'PUBLISHED' as TabStatus },
  { label: 'Feedback', value: 'FEEDBACK' as TabStatus },
];

export default function StoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<TextSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>('DRAFT');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'WRITER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/text-submissions?limit=100');
      if (!response.ok) throw new Error('Failed to fetch submissions');

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'WRITER') {
      fetchData();
    }
  }, [session]);

  const getStatusCount = (status: TabStatus) => {
    return submissions.filter(s => s.status === status).length;
  };

  const filteredSubmissions = submissions.filter(s => s.status === activeTab);

  if (status === 'loading' || loading) {
    return <DashboardLoadingState message="Loading your stories..." role="volunteer" />;
  }

  if (error) {
    return <DashboardErrorState error={error} role="volunteer" />;
  }

  return (
    <div className="max-w-[1240px] mx-auto px-8 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#141414]">Stories</h1>

        <Link
          href="/dashboard/writer/submit-text"
          className="flex items-center gap-2 px-4 py-3 bg-[#141414] rounded-[100px] transition-all hover:bg-[#2a2a2a]"
        >
          <Edit className="w-5 h-5 text-white" />
          <span className="font-medium text-[20px] leading-6 text-white">
            Submit for Review
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        <div className="flex items-start gap-6 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-6">
            {statusTabs.slice(0, 4).map((tab) => {
              const isActive = activeTab === tab.value;
              const count = getStatusCount(tab.value);

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center pb-4 gap-2 ${isActive ? 'border-b-2 border-[#141414]' : ''} transition-all`}
                >
                  <span className={`text-base ${isActive ? 'font-medium text-[#141414]' : 'text-[#8E8E93]'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-base ${isActive ? 'font-medium text-[#141414]' : 'text-[#8E8E93]'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-px h-6 bg-[#E5E5EA]" />

          <div className="flex items-center gap-6">
            {statusTabs.slice(4).map((tab) => {
              const isActive = activeTab === tab.value;
              const count = getStatusCount(tab.value);

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center pb-4 gap-2 ${isActive ? 'border-b-2 border-[#141414]' : ''} transition-all`}
                >
                  <span className={`text-base ${isActive ? 'font-medium text-[#141414]' : 'text-[#8E8E93]'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-base ${isActive ? 'font-medium text-[#141414]' : 'text-[#8E8E93]'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-5">
            <div className="flex-1">
              <span className="text-base text-[#8E8E93]">
                Latest
              </span>
            </div>

            <div className="flex items-center gap-10">
              <div className="w-[170px] px-2">
                <span className="text-base text-[#8E8E93]">
                  Last Edited
                </span>
              </div>

              <div className="w-[138px] px-2">
                <span className="text-base text-[#8E8E93]">
                  Word Count
                </span>
              </div>

              <div className="w-6" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {filteredSubmissions.length === 0 ? (
              <div className="w-full py-20 text-center">
                <p className="text-lg text-[#8E8E93]">
                  No stories in this category yet
                </p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between pb-6 gap-5 border-b border-[#E5E5EA]"
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-[120px] h-[72px] bg-gray-200 rounded flex-shrink-0" />

                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <h3 className="font-medium text-lg text-[#141414] truncate">
                        {submission.title}
                      </h3>
                      <p className="text-sm text-[#8E8E93] truncate">
                        {submission.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="w-[170px] px-2">
                        <span className="text-base text-[#141414]">
                          {new Date(submission.updatedAt).toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="w-[138px] px-2">
                        <span className="text-base text-[#141414]">
                          {submission.wordCount ? `${submission.wordCount} words` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/writer/submit-text?id=${submission.id}`)}
                    className="flex items-center justify-center w-6 h-6 text-[#8E8E93] hover:text-[#141414] transition-colors"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
