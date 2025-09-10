import { OpenAI } from 'openai';

interface UpstageConfig {
  apiKey: string;
  baseUrl: string;
}

interface GPTConfig {
  apiKey: string;
  model: string;
}

class AIService {
  private openai: OpenAI | null = null;
  private upstageConfig: UpstageConfig | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    if (process.env.UPSTAGE_API_KEY) {
      this.upstageConfig = {
        apiKey: process.env.UPSTAGE_API_KEY,
        baseUrl: process.env.UPSTAGE_BASE_URL || 'https://api.upstage.ai/v1',
      };
    }
  }

  async generateStoryImage(prompt: string): Promise<{ url: string; error?: string }> {
    if (!this.openai) {
      return { url: '', error: 'OpenAI API not configured' };
    }

    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: `Children's book illustration: ${prompt}. Style: colorful, friendly, educational, appropriate for children.`,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        return { url: '', error: 'No image generated' };
      }

      return { url: imageUrl };
    } catch (error) {
      console.error('Error generating image with DALL-E:', error);
      return { url: '', error: 'Image generation failed' };
    }
  }

  async generateTTS(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'): Promise<{ audioBuffer?: Buffer; error?: string }> {
    if (!this.openai) {
      return { error: 'TTS generation failed' };
    }

    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
        response_format: 'mp3',
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return { audioBuffer: buffer };
    } catch (error) {
      console.error('TTS generation error:', error);
      return { error: 'TTS generation failed' };
    }
  }

  async parseBookContent(pdfBuffer: Buffer): Promise<{ 
    text: string; 
    pages: string[]; 
    metadata?: any; 
    error?: string;
  }> {
    if (!this.upstageConfig) {
      return { 
        text: '', 
        pages: [], 
        error: 'Upstage API not configured' 
      };
    }

    try {
      const formData = new FormData();
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      formData.append('file', blob, 'book.pdf');

      const response = await fetch(`${this.upstageConfig.baseUrl}/document-parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.upstageConfig.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upstage API error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        text: result.text || '',
        pages: result.pages || [],
        metadata: result.metadata,
      };
    } catch (error) {
      console.error('Error parsing PDF with Upstage:', error);
      return {
        text: '',
        pages: [],
        error: 'PDF parsing failed',
      };
    }
  }

  async generateChatResponse(
    bookContent: string, 
    userMessage: string,
    context?: string[]
  ): Promise<{ response: string; error?: string }> {
    if (!this.upstageConfig) {
      return { response: '', error: 'Upstage API not configured' };
    }

    try {
      const systemPrompt = `You are a helpful educational assistant for children's books. 
        You have access to the following book content: ${bookContent.slice(0, 2000)}...
        Answer questions about the story, characters, and lessons in a child-friendly manner.
        Keep responses short, engaging, and educational.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(context || []).map(msg => ({ role: 'assistant', content: msg })),
        { role: 'user', content: userMessage },
      ];

      const response = await fetch(`${this.upstageConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.upstageConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'solar-1-mini-chat',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Upstage API error: ${response.status}`);
      }

      const result = await response.json();
      const chatResponse = result.choices?.[0]?.message?.content || '';

      return { response: chatResponse };
    } catch (error) {
      console.error('Error generating chat response with Upstage:', error);
      return { response: '', error: 'Chat response generation failed' };
    }
  }

  async generateVocabularyExplanation(
    word: string,
    context: string,
    targetAge: number = 10
  ): Promise<{ explanation: string; examples: string[]; error?: string }> {
    if (!this.openai) {
      return { explanation: '', examples: [], error: 'OpenAI API not configured' };
    }

    try {
      const prompt = `Explain the word "${word}" in the context: "${context}"
        Target age: ${targetAge} years old
        Provide:
        1. Simple definition (1-2 sentences)
        2. Three example sentences using the word
        Format as JSON: { "explanation": "...", "examples": ["...", "...", "..."] }`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an educational assistant for children.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        explanation: parsed.explanation || '',
        examples: parsed.examples || [],
      };
    } catch (error) {
      console.error('Error generating vocabulary explanation:', error);
      return {
        explanation: '',
        examples: [],
        error: 'Vocabulary explanation failed',
      };
    }
  }

  async suggestIllustrationPrompts(
    storyText: string,
    pageNumber: number
  ): Promise<{ prompts: string[]; error?: string }> {
    if (!this.openai) {
      return { prompts: [], error: 'OpenAI API not configured' };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating illustration prompts for children\'s books.',
          },
          {
            role: 'user',
            content: `Given this story text from page ${pageNumber}: "${storyText.slice(0, 1000)}"
              
              Generate 3 illustration prompts that would work well for this page.
              Each prompt should be detailed, child-friendly, and visually descriptive.
              Format as JSON array: ["prompt1", "prompt2", "prompt3"]`,
          },
        ],
        temperature: 0.8,
        max_tokens: 400,
      });

      const content = response.choices[0]?.message?.content || '[]';
      const prompts = JSON.parse(content);

      return { prompts: Array.isArray(prompts) ? prompts : [] };
    } catch (error) {
      console.error('Error generating illustration prompts:', error);
      return { prompts: [], error: 'Prompt generation failed' };
    }
  }

  async analyzeReadingLevel(text: string): Promise<{
    level: string;
    ageRange: string;
    difficulty: number;
    error?: string;
  }> {
    if (!this.openai) {
      return {
        level: 'Unknown',
        ageRange: 'Unknown',
        difficulty: 0,
        error: 'OpenAI API not configured',
      };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing reading levels for children\'s books.',
          },
          {
            role: 'user',
            content: `Analyze the reading level of this text: "${text.slice(0, 2000)}"
              
              Provide:
              1. Reading level (e.g., "Grade 2", "Early Reader", "Chapter Book")
              2. Recommended age range (e.g., "6-8 years")
              3. Difficulty score (1-10, where 1 is easiest)
              
              Format as JSON: { "level": "...", "ageRange": "...", "difficulty": number }`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const analysis = JSON.parse(content);

      return {
        level: analysis.level || 'Unknown',
        ageRange: analysis.ageRange || 'Unknown',
        difficulty: analysis.difficulty || 5,
      };
    } catch (error) {
      console.error('Error analyzing reading level:', error);
      return {
        level: 'Unknown',
        ageRange: 'Unknown',
        difficulty: 0,
        error: 'Reading level analysis failed',
      };
    }
  }
}

export const aiService = new AIService();

export async function handleTTSRequest(text: string, voice?: string): Promise<{ 
  success: boolean; 
  error?: string; 
  audioUrl?: never;
}> {
  console.log('TTS requested but audio generation is disabled');
  return { 
    success: false, 
    error: 'Sound generation failed' 
  };
}

export default aiService;