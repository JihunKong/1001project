import { prisma } from '@/lib/prisma';
import { generateCuteCartoonImage } from '@/lib/google-genai-image';
import { logger } from '@/lib/logger';
import { generateContentHash } from '@/lib/content-hash';
import * as path from 'node:path';

interface GenerateImagesResult {
  success: boolean;
  imageUrls: string[];
  errors: string[];
}

export async function generateImagesForSubmission(
  submissionId: string,
  maxImages: number = 3
): Promise<GenerateImagesResult> {
  const result: GenerateImagesResult = {
    success: false,
    imageUrls: [],
    errors: []
  };

  try {
    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true
      }
    });

    if (!submission) {
      result.errors.push('Submission not found');
      return result;
    }

    if (!submission.title && !submission.summary) {
      result.errors.push('Submission has no title or summary to generate images from');
      logger.warn('Skipping image generation for submission without title/summary', {
        submissionId
      });
      return result;
    }

    logger.info('Starting image generation for submission', {
      submissionId,
      title: submission.title,
      maxImages
    });

    const prompts = generateImagePrompts(submission, maxImages);
    const generatedUrls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const outputPath = path.join(
        process.cwd(),
        'public',
        'generated-images',
        `${submissionId}-${i + 1}.png`
      );

      try {
        logger.info(`Generating image ${i + 1}/${prompts.length}`, {
          submissionId,
          prompt: prompt.substring(0, 100)
        });

        const imageResult = await generateCuteCartoonImage(prompt, outputPath);

        if (imageResult.success && imageResult.filePath) {
          const publicUrl = `/generated-images/${submissionId}-${i + 1}.png`;
          generatedUrls.push(publicUrl);
          logger.info(`Image ${i + 1} generated successfully`, {
            submissionId,
            url: publicUrl
          });
        } else {
          errors.push(`Failed to generate image ${i + 1}: ${imageResult.error || 'Unknown error'}`);
          logger.error(`Image ${i + 1} generation failed`, {
            submissionId,
            error: imageResult.error
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error generating image ${i + 1}: ${errorMsg}`);
        logger.error(`Exception during image ${i + 1} generation`, error, {
          submissionId
        });
      }
    }

    if (generatedUrls.length > 0) {
      const contentHash = submission.content ? generateContentHash(submission.content) : null;
      await prisma.textSubmission.update({
        where: { id: submissionId },
        data: {
          generatedImages: generatedUrls,
          thumbnailUrl: generatedUrls[0],
          contentHash
        }
      });

      result.success = true;
      result.imageUrls = generatedUrls;
      logger.info('Image generation completed successfully', {
        submissionId,
        imageCount: generatedUrls.length
      });
    } else {
      result.errors = errors;
      logger.warn('No images were generated successfully', {
        submissionId,
        errors
      });
    }

    result.errors = errors;
    return result;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Image generation process failed: ${errorMsg}`);
    logger.error('Image generation process failed', error, {
      submissionId
    });
    return result;
  }
}

function generateImagePrompts(
  submission: { title: string; summary?: string | null; content: string },
  maxImages: number
): string[] {
  const basePrompt = `Children's story illustration for "${submission.title}"`;
  const context = submission.summary || extractTextFromHTML(submission.content).substring(0, 200);

  const prompts: string[] = [];

  if (maxImages >= 1) {
    prompts.push(`${basePrompt}. ${context}. Main scene showing the central theme.`);
  }

  if (maxImages >= 2) {
    prompts.push(`${basePrompt}. Character portrait or key moment from the story.`);
  }

  if (maxImages >= 3) {
    prompts.push(`${basePrompt}. Background or setting of the story, magical atmosphere.`);
  }

  return prompts.slice(0, maxImages);
}

function extractTextFromHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export async function triggerImageGeneration(submissionId: string): Promise<void> {
  logger.info('triggerImageGeneration called', { submissionId });

  generateImagesForSubmission(submissionId, 3).catch((error) => {
    logger.error('Background image generation failed', error, {
      submissionId
    });
  });
}
