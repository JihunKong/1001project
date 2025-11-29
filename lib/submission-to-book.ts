import { prisma } from '@/lib/prisma';
import { TextSubmission, Book, BookVisibility, BookContentType } from '@prisma/client';

interface CreateBookFromSubmissionOptions {
  submission: TextSubmission;
  visibility?: BookVisibility;
  publisherId: string;
}

export async function createBookFromSubmission({
  submission,
  visibility = 'RESTRICTED',
  publisherId
}: CreateBookFromSubmissionOptions): Promise<Book> {
  const book = await prisma.book.create({
    data: {
      title: submission.title,
      content: submission.content,
      authorName: submission.authorAlias || 'Author',
      authorId: submission.authorId,
      language: submission.language,
      category: submission.category || [],
      tags: submission.tags || [],
      ageRange: submission.ageRange,
      readingLevel: submission.readingLevel,
      summary: submission.summary,
      isPublished: true,
      visibility: visibility,
      publishedDate: new Date(),
      publishedAt: new Date(),
      contentType: BookContentType.TEXT,
      coverImage: submission.generatedImages?.[0] || submission.coverImageUrl || null,
      audioFile: submission.audioUrl,
    }
  });

  await prisma.textSubmission.update({
    where: { id: submission.id },
    data: { publishedBookId: book.id }
  });

  return book;
}
