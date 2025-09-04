'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import PDFUploadForm from '@/components/volunteer/PDFUploadForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VolunteerSubmitPage() {
  const { data: session, status } = useSession();

  // Redirect if not logged in or not a volunteer
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.VOLUNTEER) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/volunteer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Submit New Story</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Upload a PDF story to share with children worldwide
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PDFUploadForm 
          onSuccess={(submissionId) => {
            // Redirect to history tab after successful submission
            window.location.href = '/dashboard/volunteer?tab=history';
          }}
          onCancel={() => {
            window.location.href = '/dashboard/volunteer';
          }}
        />
      </div>
    </div>
  );
}