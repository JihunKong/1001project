import { logger } from './logger';
import OpenAI from 'openai';

interface SummaryGenerationOptions {
  title: string;
  content: string;
  customPrompt?: string;
  maxLength?: number;
}

interface SummaryGenerationResult {
  success: boolean;
  summary?: string;
  error?: string;
}

const DEFAULT_PROMPT_TEMPLATE = `Based on the following children's book content, write a compelling and engaging summary (3-4 sentences) suitable for the book's preface. The summary should capture the main story, themes, and appeal to young readers.

Book Title: {title}
Content: {content}

Please write the summary in the same language as the content. Make it warm, inviting, and appropriate for children.`;

export async function generateBookSummary(
  options: SummaryGenerationOptions
): Promise<SummaryGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.error('[SUMMARY-GEN] OPENAI_API_KEY environment variable is not set');
    return {
      success: false,
      error: 'API key not configured'
    };
  }

  try {
    const { title, content, customPrompt, maxLength = 2000 } = options;

    // Truncate content if too long
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;

    // Build the prompt
    const prompt = customPrompt || DEFAULT_PROMPT_TEMPLATE
      .replace('{title}', title)
      .replace('{content}', truncatedContent);

    logger.info('[SUMMARY-GEN] Generating summary with GPT-4o-mini', {
      title,
      contentLength: content.length,
      truncated: content.length > maxLength
    });

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a skilled children\'s book editor who writes warm, engaging summaries that capture the essence of stories while appealing to young readers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    if (!response.choices || !response.choices[0]?.message?.content) {
      logger.error('[SUMMARY-GEN] Invalid API response', { response });
      return {
        success: false,
        error: 'Invalid response from API'
      };
    }

    const summary = response.choices[0].message.content.trim();

    logger.info('[SUMMARY-GEN] Summary generated successfully', {
      title,
      summaryLength: summary.length,
      model: 'gpt-4o-mini'
    });

    return {
      success: true,
      summary
    };

  } catch (error) {
    logger.error('[SUMMARY-GEN] Error generating summary', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
