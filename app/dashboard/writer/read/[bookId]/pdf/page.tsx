import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PDFReaderClient from '@/app/dashboard/learner/read/[bookId]/pdf/PDFReaderClient';

export const metadata: Metadata = {
  title: 'PDF Reader - 1001 Stories',
  description: 'Read the original PDF book',
};

interface PageProps {
  params: Promise<{
    bookId: string;
  }>;
}

export default async function WriterPDFReaderPage({ params }: PageProps) {
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
      authorName: true,
      coverImage: true,
      contentType: true,
      pdfKey: true,
      samplePdf: true,
    }
  });

  if (!book) {
    redirect('/dashboard/writer');
  }

  if (book.contentType !== 'PDF') {
    redirect(`/dashboard/writer/read/${bookId}`);
  }

  const hasFullAccess = true;
  const canDownload = false;

  const readingProgress = await prisma.readingProgress.findFirst({
    where: {
      userId: session.user.id,
      bookId: bookId
    },
    select: {
      currentPage: true,
    }
  });

  return (
    <PDFReaderClient
      bookId={book.id}
      bookTitle={book.title}
      bookAuthor={book.authorName || 'Unknown Author'}
      coverImage={book.coverImage || undefined}
      hasFullAccess={hasFullAccess}
      canDownload={canDownload}
      initialPage={readingProgress?.currentPage || 1}
      userId={session.user.id}
    />
  );
}
