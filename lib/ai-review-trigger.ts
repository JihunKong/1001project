import { prisma } from '@/lib/prisma';
import { AIReviewType, AIReviewStatus } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { getPrompts } from '@/lib/ai/prompts';
import { SupportedLanguage } from '@/lib/i18n/language-cookie';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

function findTextPosition(htmlContent: string, searchText: string): { start: number; end: number } | null {
  try {
    if (!htmlContent || !searchText) {
      logger.warn('[AI Review] Empty htmlContent or searchText');
      return null;
    }

    const { text: plainText, mapping } = convertHTMLToPlainText(htmlContent);

    if (!plainText || plainText.length === 0) {
      logger.error('[AI Review] Failed to extract plain text from HTML');
      return null;
    }

    // Strategy 1: Try multiple normalization forms (NFC and NFD)
    const normalizationStrategies = [
      { plain: plainText.normalize('NFC'), search: searchText.normalize('NFC'), name: 'NFC' },
      { plain: plainText.normalize('NFD'), search: searchText.normalize('NFD'), name: 'NFD' },
      { plain: plainText, search: searchText, name: 'unnormalized' }
    ];

    for (const strategy of normalizationStrategies) {
      // Use toLocaleLowerCase() for better non-English support (handles Turkish İ/i, etc.)
      const indexInPlain = strategy.plain.toLocaleLowerCase().indexOf(strategy.search.toLocaleLowerCase());

      if (indexInPlain !== -1) {
        logger.debug(`[AI Review] Found text match using ${strategy.name} normalization`);

        const startPlainIndex = indexInPlain;
        const endPlainIndex = indexInPlain + searchText.length;

        const start = mapping[startPlainIndex] || 0;
        const end = endPlainIndex < mapping.length
          ? mapping[endPlainIndex]
          : htmlContent.length;

        return { start, end };
      }
    }

    // Strategy 2: Try whitespace normalization with each normalization form
    for (const strategy of normalizationStrategies) {
      const cleanSearch = strategy.search.trim().replace(/\s+/g, ' ');
      const cleanPlain = strategy.plain.replace(/\s+/g, ' ');

      const cleanIndex = cleanPlain.toLocaleLowerCase().indexOf(cleanSearch.toLocaleLowerCase());

      if (cleanIndex !== -1) {
        logger.debug(`[AI Review] Found text match using ${strategy.name} with whitespace normalization`);

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
          : htmlContent.length;

        return { start, end };
      }
    }

    // Strategy 3: Try partial/fuzzy matching as last resort
    const searchWords = searchText.trim().toLowerCase().split(/\s+/);
    if (searchWords.length >= 3) {
      // Try matching first 3 words for partial match
      const partialSearch = searchWords.slice(0, 3).join(' ');
      const partialIndex = plainText.toLocaleLowerCase().indexOf(partialSearch);

      if (partialIndex !== -1) {
        logger.warn(`[AI Review] Using partial match (first 3 words) for: "${searchText.substring(0, 50)}..."`);

        const startPlainIndex = partialIndex;
        const endPlainIndex = partialIndex + searchText.length;

        const start = mapping[startPlainIndex] || 0;
        const end = endPlainIndex < mapping.length
          ? mapping[endPlainIndex]
          : htmlContent.length;

        return { start, end };
      }
    }

    // All strategies failed - log detailed debugging info
    logger.warn('[AI Review] Text match failed for all strategies', {
      searchTextLength: searchText.length,
      searchTextPreview: searchText.substring(0, 100),
      plainTextLength: plainText.length,
      plainTextPreview: plainText.substring(0, 100),
      triedStrategies: ['NFC', 'NFD', 'unnormalized', 'whitespace-normalized', 'partial-match']
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

  improvements.forEach((improvement, improvementIndex) => {
    // Strategy 1: Handle object with both text and suggestion (ideal format)
    if (typeof improvement === 'object' && improvement !== null && improvement.text && improvement.suggestion) {
      const position = findTextPosition(htmlContent, improvement.text);

      if (position) {
        annotations.push({
          suggestionIndex: annotationIndex,
          highlightedText: improvement.text,
          startOffset: position.start,
          endOffset: position.end,
          suggestionType: reviewType,
          color: SUGGESTION_COLORS[reviewType] || '#fbbf24'
        });
        annotationIndex++;
        successCount++;
        logger.debug(`[AI Review] Created annotation #${annotationIndex} for improvement #${improvementIndex}`);
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

      const position = findTextPosition(htmlContent, improvement.text);

      if (position) {
        annotations.push({
          suggestionIndex: annotationIndex,
          highlightedText: improvement.text,
          startOffset: position.start,
          endOffset: position.end,
          suggestionType: reviewType,
          color: SUGGESTION_COLORS[reviewType] || '#fbbf24'
        });
        annotationIndex++;
        successCount++;
        logger.debug(`[AI Review] Created annotation #${annotationIndex} with fallback suggestion`);
      } else {
        failCount++;
      }
      return;
    }

    // Strategy 3: Handle plain string (try to use as text, generate generic suggestion)
    if (typeof improvement === 'string' && improvement.trim().length > 10) {
      const position = findTextPosition(htmlContent, improvement);

      if (position) {
        annotations.push({
          suggestionIndex: annotationIndex,
          highlightedText: improvement,
          startOffset: position.start,
          endOffset: position.end,
          suggestionType: reviewType,
          color: SUGGESTION_COLORS[reviewType] || '#fbbf24'
        });
        annotationIndex++;
        successCount++;
        logger.debug(`[AI Review] Created annotation #${annotationIndex} from plain string`);
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
