import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import type { ApiResponse } from '@/types/learning';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Common English words that don't need highlighting
const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
  'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
  'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
  'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
  'were', 'said', 'did', 'been', 'have', 'him', 'how', 'man', 'old', 'see',
  'way', 'she', 'people', 'part', 'child', 'enter', 'come', 'made', 'may',
  'after', 'back', 'little', 'only', 'round', 'year', 'came', 'show', 'every',
  'good', 'under', 'name', 'very', 'through', 'just', 'form', 'much', 'great',
]);

// Word difficulty by CEFR level
const CEFR_LEVELS = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

// POST /api/learn/vocabulary/analyze - Analyze text for difficult words
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { text, level = 'B1' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    // Extract unique words from text
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word: string) => 
        word.length > 3 && 
        !COMMON_WORDS.has(word) &&
        !/^\d+$/.test(word)
      );

    const uniqueWords = [...new Set(words)];

    // If text is short, use simple heuristics
    if (uniqueWords.length < 20) {
      const difficultWords = uniqueWords.filter(word => {
        // Consider words difficult based on length and complexity
        if (level === 'A1' || level === 'A2') {
          return word.length > 7;
        } else if (level === 'B1' || level === 'B2') {
          return word.length > 10;
        } else {
          return word.length > 12;
        }
      });

      return NextResponse.json({
        success: true,
        data: { 
          difficultWords,
          definitions: {} 
        },
      });
    }

    // For longer texts, use AI to identify difficult words
    try {
      const prompt = `Analyze the following text and identify vocabulary words that would be difficult for a ${level} CEFR level English learner. 

Text: "${text.substring(0, 500)}"

Return a JSON object with:
1. "difficultWords": array of difficult words (lowercase)
2. "definitions": object mapping each word to a simple definition

Focus on:
- Academic vocabulary
- Idioms and phrasal verbs
- Technical terms
- Words above ${level} level
- Context-specific meanings

Limit to 15 most important words.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an ESL teacher analyzing text difficulty. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = completion.choices[0]?.message?.content;
      if (result) {
        try {
          const parsed = JSON.parse(result);
          return NextResponse.json({
            success: true,
            data: parsed,
          });
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
        }
      }
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
    }

    // Fallback to heuristic approach if AI fails
    const difficultWords = uniqueWords
      .filter(word => {
        const targetLevel = CEFR_LEVELS[level as keyof typeof CEFR_LEVELS] || 3;
        
        // Estimate word difficulty based on various factors
        let difficulty = 0;
        
        // Length factor
        if (word.length > 8) difficulty++;
        if (word.length > 12) difficulty++;
        
        // Suffix complexity
        if (word.endsWith('tion') || word.endsWith('sion')) difficulty++;
        if (word.endsWith('ity') || word.endsWith('ness')) difficulty++;
        if (word.endsWith('ment') || word.endsWith('ance')) difficulty++;
        
        // Prefix complexity
        if (word.startsWith('un') || word.startsWith('dis')) difficulty++;
        if (word.startsWith('pre') || word.startsWith('post')) difficulty++;
        
        return difficulty >= targetLevel - 1;
      })
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: { 
        difficultWords,
        definitions: {} 
      },
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze text' },
      { status: 500 }
    );
  }
}