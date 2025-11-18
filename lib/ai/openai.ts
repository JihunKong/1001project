import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { getPrompts } from './prompts';
import { SupportedLanguage } from '@/lib/i18n/language-cookie';

export interface GrammarCheckResult {
  grammarIssues: Array<{
    line: number;
    issue: string;
    suggestion: string;
  }>;
  grammarScore: number;
  suggestions: string[];
}

export interface StructureAnalysisResult {
  structureScore: number;
  hasIntro: boolean;
  hasBody: boolean;
  hasConclusion: boolean;
  suggestions: string[];
}

export async function checkGrammar(
  content: string,
  language?: SupportedLanguage
): Promise<GrammarCheckResult> {
  try {
    // Initialize OpenAI client at runtime (not at module level)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    const prompts = getPrompts(language);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompts.grammar.system
        },
        {
          role: 'user',
          content: prompts.grammar.user(content)
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      grammarIssues: result.grammarIssues || [],
      grammarScore: result.grammarScore || 0,
      suggestions: result.suggestions || []
    };
  } catch (error) {
    logger.error('Grammar check error', error);
    const prompts = getPrompts(language);
    return {
      grammarIssues: [],
      grammarScore: 0,
      suggestions: [prompts.grammar.errorFallback]
    };
  }
}

export async function analyzeStructure(
  content: string,
  language?: SupportedLanguage
): Promise<StructureAnalysisResult> {
  try {
    // Initialize OpenAI client at runtime (not at module level)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    const prompts = getPrompts(language);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompts.structure.system
        },
        {
          role: 'user',
          content: prompts.structure.user(content)
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      structureScore: result.structureScore || 0,
      hasIntro: result.hasIntro || false,
      hasBody: result.hasBody || false,
      hasConclusion: result.hasConclusion || false,
      suggestions: result.suggestions || []
    };
  } catch (error) {
    logger.error('Structure analysis error', error);
    const prompts = getPrompts(language);
    return {
      structureScore: 0,
      hasIntro: false,
      hasBody: false,
      hasConclusion: false,
      suggestions: [prompts.structure.errorFallback]
    };
  }
}

export async function getWritingHelp(
  content: string,
  question: string,
  language?: SupportedLanguage
): Promise<string> {
  try {
    // Initialize OpenAI client at runtime (not at module level)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    const prompts = getPrompts(language);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompts.writingHelp.system
        },
        {
          role: 'user',
          content: prompts.writingHelp.user(content, question)
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || prompts.writingHelp.errorFallback;
  } catch (error) {
    logger.error('Writing help error', error);
    const prompts = getPrompts(language);
    return prompts.writingHelp.errorFallback;
  }
}
