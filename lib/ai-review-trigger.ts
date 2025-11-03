import { prisma } from '@/lib/prisma';
import { AIReviewType, AIReviewStatus } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  details?: any;
}

const REVIEW_PROMPTS = {
  GRAMMAR: `Analyze the following story for grammar, spelling, and punctuation errors.

IMPORTANT: You MUST respond with valid JSON only. Do not include any markdown formatting or code blocks.

Provide:
1. A brief summary of the overall grammar quality
2. Specific strengths in the writing
3. List of improvements - FOR EACH improvement, you MUST include:
   - "text": The EXACT text snippet from the story (3-8 words, copied character-by-character)
   - "suggestion": How to fix the issue

Example format:
{
  "summary": "The story has good grammar with a few minor errors.",
  "strengths": ["Clear sentence structure", "Proper punctuation"],
  "improvements": [
    {"text": "The boy run", "suggestion": "Change 'run' to 'runs' for subject-verb agreement"},
    {"text": "alot of fun", "suggestion": "Write as two words: 'a lot of fun'"}
  ],
  "score": 85
}

CRITICAL RULES:
1. The "text" field MUST contain EXACT words from the story (copy-paste, no modifications)
2. Each improvement MUST have both "text" and "suggestion" fields
3. Choose text snippets that are 3-8 words long
4. Include a score from 0-100`,

  STRUCTURE: `Analyze the following story's structure and organization.

IMPORTANT: You MUST respond with valid JSON only. Do not include any markdown formatting or code blocks.

Evaluate:
1. Story flow and pacing
2. Character development (if applicable)
3. Plot structure and coherence
4. Beginning, middle, and end effectiveness

Example format:
{
  "summary": "The story has a clear structure with good pacing.",
  "strengths": ["Strong opening", "Clear progression"],
  "improvements": [
    {"text": "Once upon a time there lived", "suggestion": "Consider a more engaging opening hook"},
    {"text": "The end was very sudden", "suggestion": "Add more resolution and closure"}
  ],
  "score": 75
}

CRITICAL RULES:
1. The "text" field MUST contain EXACT words from the story (5-12 words)
2. Each improvement MUST have both "text" and "suggestion" fields
3. Focus on structural issues (pacing, organization, flow)
4. Include a score from 0-100`,

  WRITING_HELP: `Provide constructive feedback on this story to help improve the writing.

IMPORTANT: You MUST respond with valid JSON only. Do not include any markdown formatting or code blocks.

Focus on:
1. Writing style and voice
2. Word choice and vocabulary
3. Engagement and readability
4. Specific actionable suggestions

Example format:
{
  "summary": "The writing is clear but could be more engaging.",
  "strengths": ["Simple language", "Easy to follow"],
  "improvements": [
    {"text": "He was happy", "suggestion": "Use more descriptive words: 'He beamed with joy'"},
    {"text": "It was nice", "suggestion": "Replace vague words: 'It was delightful'"}
  ]
}

CRITICAL RULES:
1. The "text" field MUST contain EXACT words from the story (3-10 words)
2. Each improvement MUST have both "text" and "suggestion" fields
3. Focus on style, word choice, and engagement
4. No score needed for this review type`
};

interface AIAnnotation {
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

    const normalizedPlainText = plainText.normalize('NFC');
    const normalizedSearchText = searchText.normalize('NFC');

    const indexInPlain = normalizedPlainText.toLowerCase().indexOf(normalizedSearchText.toLowerCase());

    if (indexInPlain === -1) {
      const cleanSearch = normalizedSearchText.trim().replace(/\s+/g, ' ');
      const cleanPlain = normalizedPlainText.replace(/\s+/g, ' ');

      const cleanIndex = cleanPlain.toLowerCase().indexOf(cleanSearch.toLowerCase());

      if (cleanIndex === -1) {
        return null;
      }

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

    const startPlainIndex = indexInPlain;
    const endPlainIndex = indexInPlain + searchText.length;

    const start = mapping[startPlainIndex] || 0;
    const end = endPlainIndex < mapping.length
      ? mapping[endPlainIndex]
      : htmlContent.length;

    return { start, end };
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
  let annotationIndex = 0;

  improvements.forEach((improvement, improvementIndex) => {
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
      } else {
        failCount++;
      }
    } else {
      logger.warn(`[AI Review] Skipping invalid improvement #${improvementIndex}`, { improvement: typeof improvement === 'object' ? JSON.stringify(improvement) : improvement });
    }
  });

  return annotations;
}

async function generateAIReview(
  plainTextContent: string,
  htmlContent: string,
  reviewType: AIReviewType
): Promise<{ feedback: AIFeedback; score: number | null; suggestions: string[]; annotations: AIAnnotation[]; tokensUsed: number }> {
  const startTime = Date.now();

  try {
    const prompt = REVIEW_PROMPTS[reviewType];
    const systemMessage = 'You are a helpful writing coach for children\'s stories. Provide constructive, encouraging feedback that helps authors improve their work.';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
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

export async function triggerAutoAIReviews(submissionId: string): Promise<void> {
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
        reviewType
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
