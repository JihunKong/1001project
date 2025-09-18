import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

// Initialize OpenAI client for Upstage
const upstage = new OpenAI({
  apiKey: process.env.UPSTAGE_API_KEY || 'up_kcU1IMWm9wcC1rqplsIFMsEeqlUXN',
  baseURL: 'https://api.upstage.ai/v1',
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BookContext {
  title?: string;
  text?: string;
  userAge?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, bookContext, chatHistory }: {
      message: string;
      bookContext?: BookContext;
      chatHistory?: ChatMessage[];
    } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Prepare system prompt based on user age and book context
    const userAge = bookContext?.userAge || 18;
    const systemPrompt = createSystemPrompt(userAge, bookContext);

    // Prepare conversation history
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add chat history if available
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call Upstage Solar-Pro2 model
    const completion = await upstage.chat.completions.create({
      model: 'solar-pro2',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from AI model');
    }

    return NextResponse.json({ 
      response,
      usage: completion.usage
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'AI service authentication failed' }, 
          { status: 503 }
        );
      }
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'AI service rate limit exceeded. Please try again later.' }, 
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process AI request' }, 
      { status: 500 }
    );
  }
}

function createSystemPrompt(userAge: number, bookContext?: BookContext): string {
  const basePrompt = `You are an ESL (English as Second Language) learning assistant helping students learn English through storytelling. Your role is to:

1. ADJUST COMPLEXITY: Adapt your language complexity based on the user's age (${userAge} years old)
2. REPLACE DIFFICULT CONTENT: If the story contains mature or difficult content, suggest age-appropriate alternatives
3. PROVIDE COACHING: Ask higher-order thinking questions that develop critical thinking skills
4. FOCUS ON CURRENT READING: Base your responses on the current book content when available
5. BE ENCOURAGING: Maintain a supportive and encouraging tone to build confidence

Language Guidelines:
- For users under 12: Use simple vocabulary, short sentences, and concrete concepts
- For users 12-16: Use moderate vocabulary, introduce idioms, discuss themes
- For users 17+: Use advanced vocabulary, complex concepts, cultural nuances

Always:
- Encourage questions and curiosity
- Provide vocabulary explanations when needed
- Relate content to real-life experiences
- Ask follow-up questions to check understanding
- Offer multiple ways to express the same idea`;

  if (bookContext?.title) {
    return `${basePrompt}

CURRENT BOOK CONTEXT:
Title: "${bookContext.title}"
${bookContext.text ? `Text excerpt: "${bookContext.text.substring(0, 500)}..."` : ''}

Focus your responses on helping the user understand and engage with this specific book content.`;
  }

  return basePrompt;
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}