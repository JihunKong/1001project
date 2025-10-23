'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { TextSubmissionForm, SubmissionDetailsCard, AIReviewCard } from '@/components/story-publication/writer';
import WritingTipsCard from '@/components/WritingTipsCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SubmitTextPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [loading, setLoading] = useState(!!editId);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    status: 'DRAFT',
    ageRange: null as string | null,
    wordCount: 0,
    submittedAt: null as Date | null
  });

  useEffect(() => {
    if (editId) {
      setLoading(true);
      setError(null);
      fetch(`/api/text-submissions/${editId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to load submission');
          }
          return res.json();
        })
        .then(data => {
          if (data.submission) {
            setFormData({
              title: data.submission.title || '',
              summary: data.submission.summary || '',
              content: data.submission.content || '',
              status: data.submission.status || 'DRAFT',
              ageRange: data.submission.ageRange,
              wordCount: data.submission.wordCount || 0,
              submittedAt: data.submission.submittedAt
            });
          } else {
            throw new Error('Submission not found');
          }
        })
        .catch(err => {
          console.error('Error loading submission:', err);
          setError(err instanceof Error ? err.message : 'Failed to load submission');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [editId]);

  const handleFormChange = useCallback((data: any) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const isEditing = Boolean(editId);

  return (
    <>
      <div className="pb-20 lg:pb-4">
        <div id="main-content" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-16 lg:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#8E8E93]">
          <Link href="/dashboard" className="hover:text-[#141414] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soe-green-300">
            Dashboard
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/dashboard/writer" className="hover:text-[#141414] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soe-green-300">
            Writer
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#141414]">
            {isEditing ? 'Edit story' : 'Submit story'}
          </span>
        </nav>
        <Link
          href="/dashboard/writer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-soe-green-600 transition-colors hover:text-soe-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soe-green-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to writer dashboard
        </Link>
      </div>

      <header className="mt-6 max-w-3xl space-y-3">
        <h1 className="text-4xl font-medium leading-tight text-[#141414] sm:text-5xl">
          {isEditing ? 'Edit your story' : 'Upload a story'}
        </h1>
        <p className="text-base leading-relaxed text-[#8E8E93] sm:text-lg">
          Share your story with children around the world. Our editorial team will review it for publication.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="min-w-0">
          {loading ? (
            <div className="bg-white border border-[#E5E5EA] rounded-lg p-10 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#141414]" />
                <p className="mt-4 text-[#8E8E93]" style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400
                }}>
                  Loading your story...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white border border-[#E5E5EA] rounded-lg p-10">
              <div className="text-center space-y-4">
                <p className="text-red-600" style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400
                }}>{error}</p>
                <Link
                  href="/dashboard/writer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#141414] text-white rounded-lg hover:bg-[#1f1f1f] transition-colors"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <ErrorBoundary>
              <TextSubmissionForm
                mode={isEditing ? 'edit' : 'create'}
                submissionId={editId || undefined}
                initialData={formData}
                onFormChange={handleFormChange}
              />
            </ErrorBoundary>
          )}
        </section>
        <aside className="flex flex-col gap-6 lg:pl-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            <SubmissionDetailsCard
              status={formData.status}
              submittedAt={formData.submittedAt}
              wordCount={formData.wordCount}
            />

            <WritingTipsCard />

            {isEditing && editId ? (
              <AIReviewCard submissionId={editId} />
            ) : (
              <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-lg p-4">
                <p className="text-sm text-[#5951E7] text-center">
                  💡 Save as draft first to enable AI review
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
        </div>
      </div>
    </>
  );
}

export default function SubmitTextPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#141414]" />
            <p className="mt-4 text-[#8E8E93]">Loading submission form...</p>
          </div>
        </div>
      }
    >
      <SubmitTextPage />
    </Suspense>
  );
}