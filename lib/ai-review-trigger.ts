import { prisma } from '@/lib/prisma';
import { AIReviewType, AIReviewStatus } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { getPrompts } from '@/lib/ai/prompts';
import { SupportedLanguage } from '@/lib/i18n/language-cookie';

interface AIFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  details?: any;
}

export interface AIAnnotation {
  suggestionIndex: number;
  highlightedText: string;
  startOffset: number;
  endOffset: number;
  suggestionType: string;
  color: string;
}

const SUGGESTION_COLORS = {
  GRAMMAR: '#fbbf24',
  STRUCTURE: '#60a5fa',
  WRITING_HELP: '#a78bfa'
};

function convertHTMLToPlainText(html: string): { text: string; mapping: number[] } {
  const mapping: number[] = [];
  let plainText = '';
  let insideTag = false;

  for (let i = 0; i < html.length; i++) {
    const char = html[i];

    if (char === '<') {
      insideTag = true;
      continue;
    }

    if (char === '>') {
      insideTag = false;
      continue;
    }

    if (!insideTag) {
      plainText += char;
      mapping.push(i);
    }
  }

  return { text: plainText, mapping };
}

function findTextPosition(
  htmlContent: string,
  searchText: string,
  startAfterPosition: number = 0,
  normalization: 'NFC' | 'NFD' | 'none' = 'NFC'
): { start: number; end: number } | null {
  try {
    if (!htmlContent || !searchText) {
      logger.warn('[AI Review] Empty htmlContent or searchText');
      return null;
    }

    // CRITICAL FIX: Normalize HTML content BEFORE creating mapping
    // This ensures mapping indices match the normalized text length
    let normalizedHTML = htmlContent;
    let normalizedSearch = searchText;

    if (normalization === 'NFC') {
      normalizedHTML = htmlContent.normalize('NFC');
      normalizedSearch = searchText.normalize('NFC');
      logger.debug('[AI Review] Using NFC normalization');
    } else if (normalization === 'NFD') {
      normalizedHTML = htmlContent.normalize('NFD');
      normalizedSearch = searchText.normalize('NFD');
      logger.debug('[AI Review] Using NFD normalization');
    } else {
      logger.debug('[AI Review] Using no normalization');
    }

    // NOW create mapping from normalized HTML - mapping indices will match!
    const { text: plainText, mapping } = convertHTMLToPlainText(normalizedHTML);

    if (!plainText || plainText.length === 0) {
      logger.error('[AI Review] Failed to extract plain text from HTML');
      return null;
    }

    // Find the plain text index corresponding to startAfterPosition in HTML
    let plainTextStartIndex = 0;
    for (let i = 0; i < mapping.length; i++) {
      if (mapping[i] >= startAfterPosition) {
        plainTextStartIndex = i;
        break;
      }
    }

    // Search in the plain text (already normalized via normalizedHTML)
    // Use toLocaleLowerCase() for better non-English support (handles Turkish İ/i, etc.)
    const indexInPlain = plainText.toLocaleLowerCase().indexOf(
      normalizedSearch.toLocaleLowerCase(),
      plainTextStartIndex
    );

    if (indexInPlain !== -1) {
      logger.debug(`[AI Review] Found text match at position ${indexInPlain} using ${normalization} normalization`);

      const startPlainIndex = indexInPlain;
      const endPlainIndex = indexInPlain + normalizedSearch.length;

      const start = mapping[startPlainIndex] || 0;
      const end = endPlainIndex < mapping.length
        ? mapping[endPlainIndex]
        : normalizedHTML.length;

      return { start, end };
    }

    // If exact match failed, try whitespace normalization as fallback
    const cleanSearch = normalizedSearch.trim().replace(/\s+/g, ' ');
    const cleanPlain = plainText.replace(/\s+/g, ' ');

    // Calculate corresponding clean text start index
    const cleanStartIndex = plainText.substring(0, plainTextStartIndex).replace(/\s+/g, ' ').length;

    const cleanIndex = cleanPlain.toLocaleLowerCase().indexOf(
      cleanSearch.toLocaleLowerCase(),
      cleanStartIndex
    );

    if (cleanIndex !== -1) {
      logger.debug(`[AI Review] Found text match using ${normalization} with whitespace normalization`);

      // Map clean position back to plain position
      const cleanToPlainMap: number[] = [];
      let plainPos = 0;
      let cleanPos = 0;

      while (plainPos < plainText.length) {
        cleanToPlainMap[cleanPos] = plainPos;

        if (plainText[plainPos].match(/\s/)) {
          while (plainPos < plainText.length && plainText[plainPos].match(/\s/)) {
            plainPos++;
          }
          cleanPos++;
        } else {
          plainPos++;
          cleanPos++;
        }
      }
      cleanToPlainMap[cleanPos] = plainPos;

      const startPlainIndex = cleanToPlainMap[cleanIndex] || 0;
      const endPlainIndex = cleanToPlainMap[cleanIndex + cleanSearch.length] || plainText.length;

      const start = mapping[startPlainIndex] || 0;
      const end = endPlainIndex < mapping.length
        ? mapping[endPlainIndex]
        : normalizedHTML.length;

      return { start, end };
    }

    // No match found
    logger.warn(`[AI Review] Text match failed for ${normalization} normalization`, {
      searchTextLength: normalizedSearch.length,
      searchTextPreview: normalizedSearch.substring(0, 100),
      plainTextLength: plainText.length,
      plainTextPreview: plainText.substring(0, 100)
    });

    return null;
  } catch (error) {
    logger.error('[AI Review] Error in findTextPosition', error);
    return null;
  }
}

function createAnnotations(
  improvements: any[],
  htmlContent: string,
  reviewType: AIReviewType
): AIAnnotation[] {
  if (!htmlContent || htmlContent.trim().length === 0) {
    logger.warn('[AI Review] Empty HTML content, skipping annotations');
    return [];
  }

  const annotations: AIAnnotation[] = [];
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let annotationIndex = 0;
  let lastEndPosition = 0; // Track the end position of the last successful annotation

  improvements.forEach((improvement, improvementIndex) => {
    // Strategy 1: Handle object with both text and suggestion (ideal format)
    if (typeof improvement === 'object' && improvement !== null && improvement.text && improvement.suggestion) {
      // Try multiple normalization forms: NFC (best for Korean) → NFD → none
      let position: { start: number; end: number } | null = null;
      const normalizations: Array<'NFC' | 'NFD' | 'none'> = ['NFC', 'NFD', 'none'];

      for (const norm of normalizations) {
        position = findTextPosition(htmlContent, improvement.text, lastEndPosition, norm);
        if (position) {
          logger.debug(`[AI Review] Found improvement #${improvementIndex} using ${norm} normalization`);
          break;
        }
      }

      if (position) {
        annotations.push({
          suggestionIndex: annotationIndex,
          highlightedText: improvement.text,
          startOffset: position.start,
          endOffset: position.end,
          suggestionType: reviewType,
          color: SUGGESTION_COLORS[reviewType] || '#fbbf24'
        });
        lastEndPosition = position.end; // Update last position for next search
        annotationIndex++;
        successCount++;
        logger.debug(`[AI Review] Created annotation #${annotationIndex} at position ${position.start}-${position.end}`);
      } else {
        failCount++;
        logger.warn(`[AI Review] Failed to find text position for improvement #${improvementIndex}`, {
          text: improvement.text?.substring(0, 100)
        });
      }
      return;
    }

    // Strategy 2: Handle object with only text field (try to extract suggestion)
    if (typeof improvement === 'object' && improvement !== null && improvement.text) {
      const suggestion = improvement.suggestion || improvement.advice || improvement.recommendation || 'Improvement suggested';

      // Try multiple normalization forms
      let position: { start: number; end: number } | null = null;
      const normalizations: Array<'NFC' | 'NFD' | 'none'> = ['NFC', 'NFD', 'none'];

      for (const norm of normalizations) {
        position = findTextPosition(htmlContent, improvement.text, lastEndPosition, norm);
        if (position) {
          logger.debug(`[AI Review] Found improvement #${improvementIndex} using ${norm} normalization (fallback)`);
          break;
        }
      }

      if (position) {
        annotations.push({
          suggestionIndex: annotationIndex,
          highlightedText: improvement.text,
          startOffset: position.start,
          endOffset: position.end,
          suggestionType: reviewType,
          color: SUGGESTION_COLORS[reviewType] || '#fbbf24'
        });
        lastEndPosition = position.end; // Update last position for next search
        annotationIndex++;
        successCount++;
        logger.debug(`[AI Review] Created annotation #${annotationIndex} at position ${position.start}-${position.end} with fallback suggestion`);
      } else {
        failCount++;
      }
      return;
    }

    // Strategy 3: Handle plain string (try to use as text, generate generic suggestion)
    if (typeof improvement === 'string' && improvement.trim().length > 10) {
      // Try multiple normalization forms
      let position: { start: number; end: number } | null = null;
      const normalizations: Array<'NFC' | 'NFD' | 'none'> = ['NFC', 'NFD', 'none'];

      for (const norm of normalizations) {
        position = findTextPosition(htmlContent, improvement, lastEndPosition, norm);
        if (position) {
          logger.debug(`[AI Review] Found improvement #${improvementIndex} using ${norm} normalization (string)`);
          break;
        }
      }

      if (position) {
        annotations.push({
          suggestionIndex: annotationIndex,
          highlightedText: improvement,
          startOffset: position.start,
          endOffset: position.end,
          suggestionType: reviewType,
          color: SUGGESTION_COLORS[reviewType] || '#fbbf24'
        });
        lastEndPosition = position.end; // Update last position for next search
        annotationIndex++;
        successCount++;
        logger.debug(`[AI Review] Created annotation #${annotationIndex} at position ${position.start}-${position.end} from plain string`);
      } else {
        failCount++;
        logger.warn(`[AI Review] Failed to find position for string improvement #${improvementIndex}`, {
          stringPreview: improvement.substring(0, 100)
        });
      }
      return;
    }

    // All strategies failed - log and skip
    skippedCount++;
    logger.warn(`[AI Review] Skipped invalid improvement #${improvementIndex}`, {
      improvementType: typeof improvement,
      hasText: improvement?.text !== undefined,
      hasSuggestion: improvement?.suggestion !== undefined,
      improvementPreview: typeof improvement === 'object' ? JSON.stringify(improvement).substring(0, 200) : improvement
    });
  });

  logger.info(`[AI Review] Annotation creation complete`, {
    total: improvements.length,
    successful: successCount,
    failed: failCount,
    skipped: skippedCount,
    reviewType
  });

  return annotations;
}

export async function generateAIReview(
  plainTextContent: string,
  htmlContent: string,
  reviewType: AIReviewType,
  language?: SupportedLanguage
): Promise<{ feedback: AIFeedback; score: number | null; suggestions: string[]; annotations: AIAnnotation[]; tokensUsed: number }> {
  const startTime = Date.now();

  try {
    // Initialize OpenAI client at runtime (not at module level)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompts = getPrompts(language);
    const prompt = prompts.review[reviewType];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: `${prompt}\n\nStory:\n${plainTextContent}` }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    let responseContent = response.choices[0]?.message?.content || '{}';
    responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const feedback = JSON.parse(responseContent) as AIFeedback;
    const score = (feedback as any).score || null;

    const improvements = feedback.improvements || [];

    const annotations = createAnnotations(improvements, htmlContent, reviewType);

    const suggestions = annotations.map((annotation) => {
      const improvement = improvements.find((imp: any) =>
        typeof imp === 'object' && imp !== null && imp.text === annotation.highlightedText
      ) as any;
      if (improvement && improvement.suggestion) {
        return improvement.suggestion as string;
      }
      return 'No suggestion provided';
    });

    return {
      feedback,
      score,
      suggestions,
      annotations,
      tokensUsed: response.usage?.total_tokens || 0
    };
  } catch (error) {
    logger.error('[AI Review] OpenAI API error', error);
    throw new Error(`Failed to generate AI review: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function triggerAutoAIReviews(
  submissionId: string,
  language?: SupportedLanguage
): Promise<void> {
  const submission = await prisma.textSubmission.findUnique({
    where: { id: submissionId }
  });

  if (!submission) {
    logger.error(`Submission ${submissionId} not found for auto AI review`);
    return;
  }

  const htmlContent = submission.content;
  const plainTextContent = submission.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  if (plainTextContent.length < 50) {
    return;
  }

  const reviewTypes: AIReviewType[] = ['GRAMMAR', 'STRUCTURE', 'WRITING_HELP'];

  for (const reviewType of reviewTypes) {
    try {
      const startTime = Date.now();

      const { feedback, score, suggestions, annotations, tokensUsed } = await generateAIReview(
        plainTextContent,
        htmlContent,
        reviewType,
        language
      );

      const processingTime = Date.now() - startTime;

      await prisma.aIReview.create({
        data: {
          submissionId,
          reviewType,
          feedback: feedback as any,
          score,
          suggestions,
          annotationData: annotations as any,
          status: AIReviewStatus.COMPLETED,
          modelUsed: 'gpt-4o-mini',
          tokensUsed,
          processingTime,
          isAutoGenerated: true,
          triggerEvent: 'AUTO_ON_SAVE'
        }
      });
    } catch (error) {
      logger.error(`[AI Review] Failed to create ${reviewType} review`, error);

      await prisma.aIReview.create({
        data: {
          submissionId,
          reviewType,
          feedback: {} as any,
          suggestions: [],
          status: AIReviewStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          modelUsed: 'gpt-4o-mini',
          isAutoGenerated: true,
          triggerEvent: 'AUTO_ON_SAVE'
        }
      });
    }
  }
}
