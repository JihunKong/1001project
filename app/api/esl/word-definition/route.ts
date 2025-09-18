import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { word, language } = await request.json();

    if (!word) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    // Try to get definition from free dictionary API first
    let definition = await fetchFromFreeDictionary(word);
    
    // If that fails, try with Upstage AI for more comprehensive explanation
    if (!definition) {
      definition = await fetchFromUpstageAI(word, language);
    }

    return NextResponse.json({ definition });

  } catch (error) {
    console.error('Error fetching word definition:', error);
    return NextResponse.json({ error: 'Failed to fetch definition' }, { status: 500 });
  }
}

async function fetchFromFreeDictionary(word: string) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const entry = data[0];

    if (!entry) return null;

    // Extract phonetic information
    const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || '';
    
    // Extract definitions with part of speech
    const definitions = entry.meanings?.map((meaning: any) => ({
      partOfSpeech: meaning.partOfSpeech || 'unknown',
      definition: meaning.definitions?.[0]?.definition || '',
      example: meaning.definitions?.[0]?.example || '',
      synonyms: meaning.synonyms?.slice(0, 5) || []
    })) || [];

    // Determine difficulty based on word characteristics
    const difficulty = determineDifficulty(word, definitions[0]?.definition || '');
    
    // Determine frequency (simplified heuristic)
    const frequency = determineFrequency(word);

    return {
      word: word.toLowerCase(),
      phonetic,
      definitions,
      difficulty,
      frequency
    };

  } catch (error) {
    console.error('Free dictionary API error:', error);
    return null;
  }
}

async function fetchFromUpstageAI(word: string, language: string) {
  try {
    const apiKey = process.env.UPSTAGE_API_KEY;
    if (!apiKey) {
      throw new Error('Upstage API key not configured');
    }

    const prompt = `Provide a comprehensive definition for the English word "${word}" suitable for ESL learners. Include:
1. Simple definition
2. Part of speech
3. Example sentence
4. Pronunciation guide (if possible)
5. 2-3 synonyms
6. Difficulty level (easy/medium/hard)

Format the response as JSON with this structure:
{
  "word": "${word}",
  "phonetic": "pronunciation guide",
  "definitions": [{
    "partOfSpeech": "noun/verb/adjective/etc",
    "definition": "simple, clear definition",
    "example": "example sentence using the word",
    "synonyms": ["synonym1", "synonym2"]
  }],
  "difficulty": "easy/medium/hard",
  "frequency": "common/uncommon/rare"
}`;

    const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'solar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are an ESL dictionary assistant. Provide clear, simple definitions suitable for English language learners. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Upstage API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in Upstage response');
    }

    // Try to parse JSON response
    const parsedDefinition = JSON.parse(content);
    return parsedDefinition;

  } catch (error) {
    console.error('Upstage AI error:', error);
    
    // Fallback: create a basic definition
    return {
      word: word.toLowerCase(),
      phonetic: '',
      definitions: [{
        partOfSpeech: 'unknown',
        definition: `A word that means "${word}". Please check an external dictionary for a complete definition.`,
        example: '',
        synonyms: []
      }],
      difficulty: determineDifficulty(word, ''),
      frequency: determineFrequency(word)
    };
  }
}

function determineDifficulty(word: string, definition: string): 'easy' | 'medium' | 'hard' {
  const commonWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from'];
  
  // Check if it's a very common word
  if (commonWords.includes(word.toLowerCase())) {
    return 'easy';
  }
  
  // Check word length
  if (word.length <= 4) {
    return 'easy';
  } else if (word.length <= 8) {
    return 'medium';
  } else {
    return 'hard';
  }
}

function determineFrequency(word: string): 'common' | 'uncommon' | 'rare' {
  // This is a simplified heuristic - in a real app you'd use frequency data
  const commonWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their'];
  
  if (commonWords.includes(word.toLowerCase())) {
    return 'common';
  }
  
  // Check for common prefixes/suffixes
  const commonAffixes = ['un', 're', 'pre', 'dis', 'ed', 'ing', 'ly', 'er', 'est', 'tion', 'ness'];
  const hasCommonAffix = commonAffixes.some(affix => 
    word.toLowerCase().startsWith(affix) || word.toLowerCase().endsWith(affix)
  );
  
  if (hasCommonAffix && word.length <= 8) {
    return 'common';
  } else if (word.length > 10 || /[^a-zA-Z]/.test(word)) {
    return 'rare';
  } else {
    return 'uncommon';
  }
}