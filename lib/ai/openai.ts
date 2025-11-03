import OpenAI from 'openai';
import { logger } from '@/lib/logger';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

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

export async function checkGrammar(content: string): Promise<GrammarCheckResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 어린이 글쓰기를 도와주는 친절한 선생님입니다. 문법 오류를 찾고 쉬운 말로 설명해주세요. JSON 형식으로 결과를 반환하세요: { "grammarIssues": [{line, issue, suggestion}], "grammarScore": 0-100, "suggestions": [] }'
        },
        {
          role: 'user',
          content: `다음 글의 문법을 검토해주세요:\n\n${content}`
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
    return {
      grammarIssues: [],
      grammarScore: 0,
      suggestions: ['AI 문법 검사에 실패했습니다. 나중에 다시 시도해주세요.']
    };
  }
}

export async function analyzeStructure(content: string): Promise<StructureAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '어린이가 쓴 글의 구조를 분석해주세요. JSON 형식으로 결과를 반환하세요: { "structureScore": 0-100, "hasIntro": boolean, "hasBody": boolean, "hasConclusion": boolean, "suggestions": [] }'
        },
        {
          role: 'user',
          content: `다음 글의 구조를 분석해주세요:\n\n${content}`
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
    return {
      structureScore: 0,
      hasIntro: false,
      hasBody: false,
      hasConclusion: false,
      suggestions: ['AI 구조 분석에 실패했습니다. 나중에 다시 시도해주세요.']
    };
  }
}

export async function getWritingHelp(content: string, question: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 어린이의 글쓰기를 도와주는 친절한 AI 도우미입니다. 쉽고 명확하게 설명해주세요.'
        },
        {
          role: 'user',
          content: `내 글:\n${content}\n\n질문: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || 'AI 도우미가 응답하지 못했습니다.';
  } catch (error) {
    logger.error('Writing help error', error);
    return 'AI 도우미에 문제가 발생했습니다. 나중에 다시 시도해주세요.';
  }
}
