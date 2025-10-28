import { prisma } from '@/lib/prisma';
import { AIReviewType, AIReviewStatus } from '@prisma/client';
import OpenAI from 'openai';

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
  GRAMMAR: `Analyze the following story for grammar, spelling, and punctuation errors. Provide:
1. A brief summary of the overall grammar quality
2. Specific strengths in the writing
3. List of improvements - FOR EACH, include the EXACT text snippet (3-8 words) from the story
4. A quality score from 0-100

Respond in JSON format with this exact structure:
{
  "summary": "string",
  "strengths": ["string", "string"],
  "improvements": [{"text": "exact text from story", "suggestion": "how to fix"}],
  "score": number (0-100)
}

CRITICAL: "text" must be EXACT words from the story for highlighting.`,

  STRUCTURE: `Analyze the following story's structure and organization. Evaluate:
1. Story flow and pacing
2. Character development (if applicable)
3. Plot structure and coherence
4. Beginning, middle, and end effectiveness
5. Overall structure quality score from 0-100

Respond in JSON format with this exact structure:
{
  "summary": "string",
  "strengths": ["string", "string"],
  "improvements": [{"text": "exact text from story (5-12 words)", "suggestion": "how to improve"}],
  "score": number (0-100)
}

CRITICAL: "text" must be EXACT words from the story for highlighting.`,

  WRITING_HELP: `Provide constructive feedback on this story to help improve the writing. Focus on:
1. Writing style and voice
2. Word choice and vocabulary
3. Engagement and readability
4. Areas for development
5. Specific actionable suggestions

Respond in JSON format with this exact structure:
{
  "summary": "string",
  "strengths": ["string", "string"],
  "improvements": [{"text": "exact text from story (3-10 words)", "suggestion": "specific improvement"}]
}

CRITICAL: "text" must be EXACT words from the story for highlighting.`
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

function findTextPosition(content: string, searchText: string): { start: number; end: number } | null {
  const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanSearch = searchText.trim();

  const index = cleanContent.toLowerCase().indexOf(cleanSearch.toLowerCase());

  if (index === -1) {
    return null;
  }

  return {
    start: index,
    end: index + cleanSearch.length
  };
}

function createAnnotations(
  improvements: any[],
  content: string,
  reviewType: AIReviewType
): AIAnnotation[] {
  const annotations: AIAnnotation[] = [];

  improvements.forEach((improvement, index) => {
    if (typeof improvement === 'object' && improvement.text) {
      const position = findTextPosition(content, improvement.text);

      if (position) {
        annotations.push({
          suggestionIndex: index,
          highlightedText: improvement.text,
          startOffset: position.start,
          endOffset: position.end,
          suggestionType: reviewType,
          color: SUGGESTION_COLORS[reviewType] || '#fbbf24'
        });
      }
    }
  });

  return annotations;
}

async function generateAIReview(
  content: string,
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
        { role: 'user', content: `${prompt}\n\nStory:\n${content}` }
      ],
      temperature: 0.7,
    });

    let responseContent = response.choices[0]?.message?.content || '{}';
    responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const feedback = JSON.parse(responseContent) as AIFeedback;
    const score = (feedback as any).score || null;

    const improvements = feedback.improvements || [];
    const suggestions = improvements
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          if (item.text && item.suggestion) return item.suggestion;
          if (item.issue && item.example) return `${item.issue}: ${item.example}`;
          if (item.suggestion) return item.suggestion;
          return JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean)
      .slice(0, 5);

    const annotations = createAnnotations(improvements, content, reviewType);

    return {
      feedback,
      score,
      suggestions,
      annotations,
      tokensUsed: response.usage?.total_tokens || 0
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI review');
  }
}

export async function triggerAutoAIReviews(submissionId: string): Promise<void> {
  const submission = await prisma.textSubmission.findUnique({
    where: { id: submissionId }
  });

  if (!submission) {
    console.error(`Submission ${submissionId} not found for auto AI review`);
    return;
  }

  const plainTextContent = submission.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  if (plainTextContent.length < 50) {
    console.log(`Submission ${submissionId} too short for AI review (${plainTextContent.length} chars)`);
    return;
  }

  const reviewTypes: AIReviewType[] = ['GRAMMAR', 'STRUCTURE', 'WRITING_HELP'];

  for (const reviewType of reviewTypes) {
    try {
      const startTime = Date.now();

      const { feedback, score, suggestions, annotations, tokensUsed } = await generateAIReview(
        plainTextContent,
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

      console.log(`Auto AI review (${reviewType}) created for submission ${submissionId} with ${annotations.length} annotations`);
    } catch (error) {
      console.error(`Failed to create auto AI review (${reviewType}) for submission ${submissionId}:`, error);

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
