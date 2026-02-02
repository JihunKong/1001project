import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import StudentReadingInterface from '@/components/student/StudentReadingInterface';

export const metadata: Metadata = {
  title: 'Reading - 1001 Stories',
  description: 'Read and learn with AI assistance',
};

interface PageProps {
  params: Promise<{
    bookId: string;
  }>;
}

export default async function WriterReadingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'WRITER') {
    redirect('/login');
  }

  const { bookId } = await params;

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      subtitle: true,
      authorName: true,
      coverImage: true,
      summary: true,
      content: true,
      contentType: true,
      language: true,
      ageRange: true,
      category: true,
      tags: true,
    }
  });

  if (!book) {
    redirect('/dashboard/writer');
  }

  if (book.contentType === 'PDF') {
    redirect(`/dashboard/writer/read/${bookId}/pdf`);
  }

  if (book.contentType !== 'TEXT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Content Type Not Supported
          </h1>
          <p className="text-gray-600 mb-4">
            This content type is not currently supported.
          </p>
          <a
            href="/dashboard/writer"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Get or create reading progress
  let readingProgress = await prisma.readingProgress.findFirst({
    where: {
      userId: session.user.id,
      bookId: bookId
    }
  });

  if (!readingProgress) {
    readingProgress = await prisma.readingProgress.create({
      data: {
        userId: session.user.id,
        bookId: bookId,
        currentChapter: 1,
        percentComplete: 0,
        totalReadingTime: 0,
      }
    });
  }

  return (
    <StudentReadingInterface
      book={book}
      userId={session.user.id}
      initialProgress={readingProgress}
    />
  );
}
