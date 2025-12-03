import { logger } from './logger';

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
  const apiKey = process.env.UPSTAGE_API_KEY;

  if (!apiKey) {
    logger.error('[SOLAR-SUMMARY] UPSTAGE_API_KEY environment variable is not set');
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

    logger.info('[SOLAR-SUMMARY] Generating summary', {
      title,
      contentLength: content.length,
      truncated: content.length > maxLength
    });

    const response = await fetch('https://api.upstage.ai/v1/solar/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'solar-pro2',
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[SOLAR-SUMMARY] API request failed', {
        status: response.status,
        error: errorText
      });
      return {
        success: false,
        error: `API request failed: ${response.status}`
      };
    }

    const result = await response.json();

    if (!result.choices || !result.choices[0]?.message?.content) {
      logger.error('[SOLAR-SUMMARY] Invalid API response', { result });
      return {
        success: false,
        error: 'Invalid response from API'
      };
    }

    const summary = result.choices[0].message.content.trim();

    logger.info('[SOLAR-SUMMARY] Summary generated successfully', {
      title,
      summaryLength: summary.length
    });

    return {
      success: true,
      summary
    };

  } catch (error) {
    logger.error('[SOLAR-SUMMARY] Error generating summary', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
