import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simplification rules for different reading levels
const levelGuidelines = {
  A1: {
    maxWordLength: 6,
    maxSentenceWords: 10,
    vocabulary: 'basic everyday words only',
    grammar: 'simple present, simple past, basic sentence structures',
    complexity: 'very simple'
  },
  A2: {
    maxWordLength: 8,
    maxSentenceWords: 15,
    vocabulary: 'common everyday words',
    grammar: 'simple tenses, basic connectors (and, but, because)',
    complexity: 'simple'
  },
  B1: {
    maxWordLength: 10,
    maxSentenceWords: 20,
    vocabulary: 'familiar topics and common expressions',
    grammar: 'most tenses, simple clauses',
    complexity: 'intermediate'
  },
  B2: {
    maxWordLength: 12,
    maxSentenceWords: 25,
    vocabulary: 'wide range including some abstract concepts',
    grammar: 'complex sentences, various clause types',
    complexity: 'upper-intermediate'
  },
  C1: {
    maxWordLength: 15,
    maxSentenceWords: 30,
    vocabulary: 'sophisticated vocabulary, idioms',
    grammar: 'complex structures, nuanced expressions',
    complexity: 'advanced'
  },
  C2: {
    maxWordLength: 20,
    maxSentenceWords: 40,
    vocabulary: 'no restrictions',
    grammar: 'no restrictions',
    complexity: 'native-like'
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { text, targetLevel = 'B1', preserveStructure = true } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    const guidelines = levelGuidelines[targetLevel as keyof typeof levelGuidelines] || levelGuidelines.B1;
    
    // AI-based simplification using OpenAI API
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an expert ESL teacher who specializes in adapting texts for ${targetLevel} level learners. 
              
              Guidelines for ${targetLevel} level:
              - Maximum word length: ${guidelines.maxWordLength} characters
              - Maximum sentence length: ${guidelines.maxSentenceWords} words
              - Vocabulary: ${guidelines.vocabulary}
              - Grammar: ${guidelines.grammar}
              - Overall complexity: ${guidelines.complexity}
              
              ${preserveStructure ? 'Preserve the original markdown structure (headers, lists, etc.).' : 'Focus on simplifying the content.'}
              
              Important rules:
              1. Keep the same meaning and main ideas
              2. Use simpler vocabulary appropriate for the level
              3. Break long sentences into shorter ones
              4. Explain difficult concepts in simpler terms
              5. Maintain engagement and readability
              6. Preserve any markdown formatting
              7. Keep cultural references simple and universal`
            },
            {
              role: 'user',
              content: `Please simplify the following text for ${targetLevel} level learners:\n\n${text}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const simplifiedText = data.choices[0]?.message?.content || text;

      // Calculate simplification metrics
      const originalWords = text.split(/\s+/).length;
      const simplifiedWords = simplifiedText.split(/\s+/).length;
      const reductionPercentage = Math.round(((originalWords - simplifiedWords) / originalWords) * 100);

      return NextResponse.json({
        success: true,
        data: {
          originalText: text,
          simplifiedText,
          targetLevel,
          metrics: {
            originalWordCount: originalWords,
            simplifiedWordCount: simplifiedWords,
            reductionPercentage: reductionPercentage > 0 ? reductionPercentage : 0,
            readingLevel: targetLevel,
            estimatedReadingTime: Math.ceil(simplifiedWords / 200) // Average reading speed
          }
        }
      });
    } catch (aiError) {
      console.error('AI simplification error:', aiError);
      
      // Fallback to rule-based simplification
      const simplifiedText = fallbackSimplification(text, guidelines);
      
      return NextResponse.json({
        success: true,
        data: {
          originalText: text,
          simplifiedText,
          targetLevel,
          metrics: {
            originalWordCount: text.split(/\s+/).length,
            simplifiedWordCount: simplifiedText.split(/\s+/).length,
            readingLevel: targetLevel,
            estimatedReadingTime: Math.ceil(simplifiedText.split(/\s+/).length / 200)
          },
          fallback: true
        }
      });
    }
  } catch (error) {
    console.error('Text simplification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to simplify text',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Fallback rule-based simplification
function fallbackSimplification(text: string, guidelines: any): string {
  let simplified = text;
  
  // Split into sentences
  const sentences = simplified.split(/(?<=[.!?])\s+/);
  const simplifiedSentences = sentences.map(sentence => {
    // Split long sentences
    const words = sentence.split(/\s+/);
    if (words.length > guidelines.maxSentenceWords) {
      // Find natural breaking points
      const chunks = [];
      let currentChunk = [];
      
      for (const word of words) {
        currentChunk.push(word);
        
        // Break at conjunctions or punctuation
        if (currentChunk.length >= guidelines.maxSentenceWords / 2 && 
            (word.includes(',') || ['and', 'but', 'or', 'because', 'so', 'then'].includes(word.toLowerCase()))) {
          chunks.push(currentChunk.join(' ') + '.');
          currentChunk = [];
        }
      }
      
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
      }
      
      return chunks.join(' ');
    }
    
    return sentence;
  });
  
  simplified = simplifiedSentences.join(' ');
  
  // Replace complex words with simpler alternatives
  const complexToSimple: { [key: string]: string } = {
    'utilize': 'use',
    'implement': 'do',
    'accomplish': 'do',
    'demonstrate': 'show',
    'investigate': 'look at',
    'comprehension': 'understanding',
    'vocabulary': 'words',
    'pronunciation': 'how to say words',
    'perseverance': 'keep trying',
    'accomplishment': 'success',
    'magnificent': 'great',
    'tremendous': 'very big',
    'collaborate': 'work together',
    'participate': 'take part',
    'communicate': 'talk',
    'significant': 'important',
    'numerous': 'many',
    'purchase': 'buy',
    'commence': 'start',
    'terminate': 'end',
    'approximately': 'about',
    'subsequently': 'then',
    'therefore': 'so',
    'however': 'but'
  };
  
  for (const [complex, simple] of Object.entries(complexToSimple)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  }
  
  return simplified;
}