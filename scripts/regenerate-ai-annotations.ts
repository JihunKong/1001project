import { prisma } from '@/lib/prisma';
import { triggerAutoAIReviews } from '@/lib/ai-review-trigger';

async function regenerateAIAnnotations() {
  console.log('Starting AI annotation regeneration...');

  try {
    const deleteResult = await prisma.aIReview.deleteMany({
      where: {
        createdAt: {
          lt: new Date('2025-10-30T10:00:00Z')
        }
      }
    });

    console.log(`Deleted ${deleteResult.count} AI reviews with potentially incorrect annotations`);

    const submissionsNeedingReview = await prisma.textSubmission.findMany({
      where: {
        status: 'APPROVED',
        aiReviews: {
          none: {}
        }
      },
      select: {
        id: true,
        title: true
      }
    });

    console.log(`Found ${submissionsNeedingReview.length} submissions that need AI review regeneration`);

    for (const submission of submissionsNeedingReview) {
      try {
        console.log(`Regenerating AI reviews for submission: ${submission.title || submission.id}`);
        await triggerAutoAIReviews(submission.id);
        console.log(`✓ Successfully regenerated reviews for: ${submission.title || submission.id}`);
      } catch (error) {
        console.error(`✗ Failed to regenerate reviews for ${submission.id}:`, error);
      }
    }

    console.log('AI annotation regeneration complete!');
  } catch (error) {
    console.error('Error during annotation regeneration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

regenerateAIAnnotations()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
