import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { upstageService } from '@/lib/upstage-service';
import { prisma } from '@/lib/prisma';

interface ChatRequest {
  message: string;
  bookId?: string;
  bookContext?: {
    title: string;
    content?: string;
    pageNumber?: number;
  };
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  studentProfile?: {
    age?: number;
    readingLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    preferredLanguage?: string;
    learningGoals?: string[];
  };
}

interface ChatResponse {
  response: string;
  bookContext?: {
    title: string;
    id?: string;
  };
  suggestions?: string[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required to use learning chat' }, 
        { status: 401 }
      );
    }

    const body: ChatRequest = await request.json();
    const { 
      message, 
      bookId, 
      bookContext, 
      chatHistory = [],
      studentProfile
    } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' }, 
        { status: 400 }
      );
    }

    let enrichedBookContext = bookContext;
    let userProfile = studentProfile;

    if (bookId && !bookContext) {
      try {
        const book = await prisma.book.findUnique({
          where: { id: bookId },
          select: {
            title: true,
            summary: true,
            readingLevel: true
          }
        });

        if (book) {
          enrichedBookContext = {
            title: book.title,
            content: book.summary || undefined
          };
        }
      } catch (dbError) {
        console.warn('Could not fetch book details:', dbError);
      }
    }

    if (!userProfile) {
      try {
        const userStats = await prisma.userStats.findUnique({
          where: { userId: session.user.id },
          select: {
            level: true,
            xp: true
          }
        });

        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true }
        });

        const age: number | undefined = undefined;

        userProfile = {
          age,
          readingLevel: 'INTERMEDIATE' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
          preferredLanguage: 'English',
          learningGoals: [] as string[]
        };
      } catch (dbError) {
        console.warn('Could not fetch user profile:', dbError);
        userProfile = {
          readingLevel: 'INTERMEDIATE',
          preferredLanguage: 'English',
          learningGoals: []
        };
      }
    }

    const chatOptions = {
      bookContext: enrichedBookContext,
      studentProfile: {
        ...userProfile,
        readingLevel: userProfile?.readingLevel || 'INTERMEDIATE' as const
      },
      chatHistory,
      maxTokens: 1200,
      temperature: 0.8
    };

    const aiResponse = await upstageService.chatAboutBook(message, chatOptions);

    const suggestions = generateFollowUpSuggestions(message, enrichedBookContext);

    const response: ChatResponse = {
      response: aiResponse,
      bookContext: enrichedBookContext ? {
        title: enrichedBookContext.title,
        id: bookId
      } : undefined,
      suggestions
    };

    try {
      await recordChatInteraction(session.user.id, message, aiResponse, bookId);
    } catch (recordError) {
      console.warn('Could not record chat interaction:', recordError);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Learning chat API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'AI service authentication failed. Please try again later.' },
          { status: 503 }
        );
      }
      
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timed out. Please try again with a shorter message.' },
          { status: 408 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Unable to process your learning request at this time. Please try again.' },
      { status: 500 }
    );
  }
}

async function recordChatInteraction(
  userId: string, 
  userMessage: string, 
  aiResponse: string, 
  bookId?: string
): Promise<void> {
  try {
    await prisma.learningSession.create({
      data: {
        userId,
        bookId
      }
    });

    await prisma.userStats.update({
      where: { userId },
      data: {
        lastActiveDate: new Date()
      }
    });
  } catch (error) {
    console.warn('Could not record learning interaction:', error);
  }
}

function generateFollowUpSuggestions(
  userMessage: string, 
  bookContext?: { title: string; content?: string }
): string[] {
  const suggestions: string[] = [];
  const message = userMessage.toLowerCase();
  
  if (bookContext?.title) {
    if (message.includes('what') || message.includes('who') || message.includes('where')) {
      suggestions.push(`Tell me more about the characters in "${bookContext.title}"`);
      suggestions.push(`What is the main theme of this story?`);
    }
    
    if (message.includes('understand') || message.includes('confusing')) {
      suggestions.push(`Can you explain this part in simpler words?`);
      suggestions.push(`What does this word mean?`);
    }
    
    if (message.includes('like') || message.includes('favorite') || message.includes('interesting')) {
      suggestions.push(`How does this connect to my life?`);
      suggestions.push(`What should I read next if I enjoyed this?`);
    }
  }
  
  const generalSuggestions = [
    'Can you ask me a question about what I just read?',
    'Help me understand the difficult words in this chapter',
    'What is the most important lesson from this story?',
    'How can I remember what I read better?'
  ];
  
  while (suggestions.length < 3) {
    const randomSuggestion = generalSuggestions[Math.floor(Math.random() * generalSuggestions.length)];
    if (!suggestions.includes(randomSuggestion)) {
      suggestions.push(randomSuggestion);
    }
  }
  
  return suggestions.slice(0, 3);
}

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