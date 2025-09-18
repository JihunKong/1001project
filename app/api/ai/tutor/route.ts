import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const UPSTAGE_API_KEY = process.env.UPSTAGE_API_KEY;
const UPSTAGE_BASE_URL = process.env.UPSTAGE_BASE_URL || 'https://api.upstage.ai/v1';
const UPSTAGE_MODEL = process.env.UPSTAGE_MODEL || 'solar-pro';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, subject, userLevel, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create system prompt based on subject
    const systemPrompt = getSystemPrompt(subject, userLevel);

    // Build conversation context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call Upstage AI API
    const response = await fetch(`${UPSTAGE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: UPSTAGE_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    });

    if (!response.ok) {
      console.error('Upstage API error:', await response.text());
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Log the interaction for analytics
    await logTutorInteraction(session.user?.id, subject, message, aiResponse);

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Tutor error:', error);
    
    // Fallback response if AI fails
    const fallbackResponse = getFallbackResponse(request.nextUrl.searchParams.get('subject') || 'general');
    return NextResponse.json({ response: fallbackResponse });
  }
}

function getSystemPrompt(subject: string, userLevel: string): string {
  const basePrompt = `You are a friendly and encouraging AI tutor helping students learn English. 
  You should:
  - Use simple, clear language appropriate for English learners
  - Provide examples when explaining concepts
  - Be patient and supportive
  - Encourage students when they make progress
  - Break down complex topics into simpler parts
  - Use analogies and real-world examples
  - Ask follow-up questions to check understanding
  - Suggest practice exercises when appropriate
  
  Student level: ${userLevel}`;

  const subjectPrompts: Record<string, string> = {
    reading: `Focus on reading comprehension skills, vocabulary in context, main ideas, and supporting details.`,
    vocabulary: `Help with word meanings, usage, synonyms, antonyms, and word families. Provide example sentences.`,
    grammar: `Explain grammar rules clearly with examples. Focus on common mistakes and practical usage.`,
    writing: `Guide on essay structure, paragraph development, transitions, and clear expression of ideas.`,
    pronunciation: `Provide phonetic guidance, explain sound formation, and suggest practice techniques.`,
    general: `Help with any English learning topic, adapting to the student's needs.`
  };

  return `${basePrompt}\n\nSpecialization: ${subjectPrompts[subject] || subjectPrompts.general}`;
}

function getFallbackResponse(subject: string): string {
  const fallbackResponses: Record<string, string> = {
    reading: "I can help you improve your reading skills! Try breaking down the text into smaller sections and identifying the main idea of each paragraph. What specific part of the reading are you finding challenging?",
    vocabulary: "Learning new vocabulary is exciting! Try to understand words in context and create your own sentences with new words. What word would you like to explore today?",
    grammar: "Grammar can be tricky, but with practice it becomes easier! Let's focus on one rule at a time. What grammar topic would you like to work on?",
    writing: "Good writing takes practice! Start with a clear main idea and support it with examples. What are you trying to write about?",
    pronunciation: "Pronunciation improves with practice! Pay attention to how native speakers form sounds. Which sounds are you finding difficult?",
    general: "I'm here to help with your English learning journey! What would you like to learn or practice today?"
  };

  return fallbackResponses[subject] || fallbackResponses.general;
}

async function logTutorInteraction(userId: string | undefined, subject: string, question: string, response: string) {
  // This would log to database for analytics
  // For now, just console log
  console.log('Tutor interaction:', {
    userId,
    subject,
    questionLength: question.length,
    responseLength: response.length,
    timestamp: new Date().toISOString()
  });
}