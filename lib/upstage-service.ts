import OpenAI from 'openai';

const UPSTAGE_MODEL = 'solar-1-mini-chat';

interface UpstageConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface BookContext {
  title: string;
  content?: string;
  id?: string;
  pageNumber?: number;
}

interface StudentProfile {
  age?: number;
  readingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  preferredLanguage?: string;
  learningGoals?: string[];
}

interface ChatOptions {
  bookContext?: BookContext;
  studentProfile: StudentProfile;
  chatHistory?: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

interface VocabularyExplanation {
  word: string;
  definition: string;
  simpleDefinition: string;
  examples: string[];
  pronunciation?: string;
  partOfSpeech: string;
  difficulty: 'easy' | 'medium' | 'hard';
  relatedWords?: string[];
}

interface ContentAnalysis {
  readingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  keyVocabulary: string[];
  mainTopics: string[];
  difficultyScore: number;
  estimatedReadingTime: number;
}

export class UpstageService {
  private client: OpenAI;
  private config: UpstageConfig;

  constructor() {
    this.config = {
      apiKey: process.env.UPSTAGE_API_KEY || '',
      baseUrl: process.env.UPSTAGE_BASE_URL || 'https://api.upstage.ai/v1',
      model: UPSTAGE_MODEL
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });
  }

  async chatAboutBook(
    question: string, 
    options: ChatOptions
  ): Promise<string> {
    const { bookContext, studentProfile, chatHistory = [], maxTokens = 1000, temperature = 0.7 } = options;
    
    const systemPrompt = this.createLearningSystemPrompt(studentProfile, bookContext);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    if (chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    messages.push({
      role: 'user',
      content: question
    });

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';
    } catch (error) {
      console.error('Upstage chat error:', error);
      throw new Error('Failed to process chat request with Upstage AI');
    }
  }

  async explainWord(
    word: string, 
    context: string, 
    studentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    studentAge?: number
  ): Promise<VocabularyExplanation> {
    const prompt = this.createVocabularyPrompt(word, context, studentLevel, studentAge);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a vocabulary tutor. Provide clear, age-appropriate explanations of words. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
        stream: false,
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      
      try {
        const parsed = JSON.parse(responseContent);
        return {
          word: word.toLowerCase(),
          definition: parsed.definition || `Definition for ${word}`,
          simpleDefinition: parsed.simpleDefinition || parsed.definition || `Simple definition for ${word}`,
          examples: parsed.examples || [`Here's an example with ${word}.`],
          pronunciation: parsed.pronunciation || undefined,
          partOfSpeech: parsed.partOfSpeech || 'word',
          difficulty: this.determineDifficulty(word, studentLevel),
          relatedWords: parsed.relatedWords || []
        };
      } catch (parseError) {
        return this.createFallbackVocabularyExplanation(word, context, studentLevel);
      }
    } catch (error) {
      console.error('Upstage vocabulary explanation error:', error);
      return this.createFallbackVocabularyExplanation(word, context, studentLevel);
    }
  }

  async parseByLevel(
    content: string, 
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): Promise<ContentAnalysis> {
    const prompt = this.createContentAnalysisPrompt(content, level);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an educational content analyzer. Analyze text for reading level and learning objectives. Respond in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.3,
        stream: false,
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      
      try {
        const parsed = JSON.parse(responseContent);
        return {
          readingLevel: level,
          keyVocabulary: parsed.keyVocabulary || [],
          mainTopics: parsed.mainTopics || [],
          difficultyScore: parsed.difficultyScore || this.calculateBasicDifficulty(content),
          estimatedReadingTime: parsed.estimatedReadingTime || this.calculateReadingTime(content, level)
        };
      } catch (parseError) {
        return this.createFallbackContentAnalysis(content, level);
      }
    } catch (error) {
      console.error('Upstage content analysis error:', error);
      return this.createFallbackContentAnalysis(content, level);
    }
  }

  private createLearningSystemPrompt(
    studentProfile: StudentProfile, 
    bookContext?: BookContext
  ): string {
    const { age = 12, readingLevel, preferredLanguage, learningGoals } = studentProfile;
    
    let prompt = `You are an intelligent learning assistant specializing in helping students understand and engage with books. Your role is to:

1. PERSONALIZE responses for a ${age}-year-old student at ${readingLevel} reading level
2. ENCOURAGE critical thinking through thoughtful questions
3. EXPLAIN concepts clearly and age-appropriately
4. CONNECT book content to real-life experiences
5. BUILD confidence and curiosity about reading

Reading Level Guidelines:
- BEGINNER: Use simple vocabulary, short sentences, concrete examples
- INTERMEDIATE: Use moderate vocabulary, explain context, introduce themes
- ADVANCED: Use rich vocabulary, explore complex themes, analyze literary elements

Communication Style:
- Be encouraging and supportive
- Ask follow-up questions to check understanding
- Provide examples and analogies
- Break down complex ideas into digestible parts`;

    if (preferredLanguage && preferredLanguage !== 'English') {
      prompt += `\n- Occasionally explain difficult English words in ${preferredLanguage} if helpful`;
    }

    if (learningGoals && learningGoals.length > 0) {
      prompt += `\n\nStudent's Learning Goals: ${learningGoals.join(', ')}`;
    }

    if (bookContext) {
      prompt += `\n\nCURRENT BOOK CONTEXT:
Title: "${bookContext.title}"`;
      
      if (bookContext.content) {
        prompt += `\nContent: "${bookContext.content.substring(0, 500)}..."`;
      }
      
      if (bookContext.pageNumber) {
        prompt += `\nPage: ${bookContext.pageNumber}`;
      }
      
      prompt += '\n\nFocus your responses on helping the student understand and engage with this specific book content.';
    }

    return prompt;
  }

  private createVocabularyPrompt(
    word: string, 
    context: string, 
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    age?: number
  ): string {
    return `Explain the word "${word}" as it appears in this context: "${context}"

For a ${level} level student${age ? ` who is ${age} years old` : ''}, provide a JSON response with:
{
  "definition": "clear, complete definition",
  "simpleDefinition": "age-appropriate simple explanation",
  "examples": ["example sentence 1", "example sentence 2", "example sentence 3"],
  "pronunciation": "phonetic pronunciation if helpful",
  "partOfSpeech": "noun/verb/adjective/etc",
  "relatedWords": ["synonym1", "synonym2", "related word"]
}

Make sure the explanation is appropriate for the student's level and age.`;
  }

  private createContentAnalysisPrompt(
    content: string, 
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): string {
    return `Analyze this text for a ${level} level student:

"${content.substring(0, 1000)}..."

Provide a JSON response with:
{
  "keyVocabulary": ["challenging words for this level"],
  "mainTopics": ["main theme 1", "main theme 2"],
  "difficultyScore": number from 1-10,
  "estimatedReadingTime": minutes to read
}`;
  }

  private createFallbackVocabularyExplanation(
    word: string, 
    context: string, 
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): VocabularyExplanation {
    return {
      word: word.toLowerCase(),
      definition: `${word} is a word that appears in your reading.`,
      simpleDefinition: level === 'BEGINNER' 
        ? `${word} means...` 
        : `${word} refers to...`,
      examples: [`Here is an example: "${context}"`],
      partOfSpeech: 'word',
      difficulty: this.determineDifficulty(word, level),
      relatedWords: []
    };
  }

  private createFallbackContentAnalysis(
    content: string, 
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): ContentAnalysis {
    return {
      readingLevel: level,
      keyVocabulary: this.extractKeyWords(content),
      mainTopics: ['Reading Comprehension'],
      difficultyScore: this.calculateBasicDifficulty(content),
      estimatedReadingTime: this.calculateReadingTime(content, level)
    };
  }

  private determineDifficulty(
    word: string, 
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): 'easy' | 'medium' | 'hard' {
    if (level === 'BEGINNER') return word.length > 6 ? 'hard' : 'easy';
    if (level === 'INTERMEDIATE') return word.length > 8 ? 'hard' : word.length > 5 ? 'medium' : 'easy';
    return word.length > 10 ? 'hard' : word.length > 7 ? 'medium' : 'easy';
  }

  private extractKeyWords(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 6)
      .filter((word, index, self) => self.indexOf(word) === index)
      .slice(0, 8);
  }

  private calculateBasicDifficulty(content: string): number {
    const avgWordLength = content.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / content.split(/\s+/).length;
    return Math.min(10, Math.max(1, Math.round(avgWordLength - 2)));
  }

  private calculateReadingTime(content: string, level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): number {
    const wordsPerMinute = {
      'BEGINNER': 100,
      'INTERMEDIATE': 150,
      'ADVANCED': 200
    };
    
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute[level]);
  }

  async generateEducationalTasks(options: {
    bookContext: BookContext;
    taskType: 'comprehension' | 'vocabulary' | 'creative' | 'discussion' | 'analysis';
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    customPrompt: string;
    systemPrompt: string;
    studentProfiles?: { readingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; name?: string }[];
  }): Promise<{ success: boolean; content?: string; error?: string }> {
    const { bookContext, taskType, difficulty, customPrompt, systemPrompt, studentProfiles } = options;

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: customPrompt
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        max_tokens: 2000,
        temperature: 0.8,
        stream: false,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        return {
          success: false,
          error: 'No content generated from AI'
        };
      }

      return {
        success: true,
        content
      };

    } catch (error) {
      console.error('Upstage task generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate educational tasks'
      };
    }
  }
}

export const upstageService = new UpstageService();