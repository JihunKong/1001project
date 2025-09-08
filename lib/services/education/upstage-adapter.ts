// Upstage AI Text Adaptation Service

interface AdaptationOptions {
  targetAge: 'elementary' | 'middle' | 'high' | 'adult';
  originalText: string;
  title?: string;
}

interface AdaptationResult {
  adaptedText: string;
  readingLevel: string;
  vocabulary: string[];
  estimatedReadingTime: number;
}

export class UpstageTextAdapter {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.UPSTAGE_API_KEY || 'up_kcU1IMWm9wcC1rqplsIFMsEeqlUXN';
    this.baseUrl = process.env.UPSTAGE_BASE_URL || 'https://api.upstage.ai/v1';
    this.model = process.env.UPSTAGE_MODEL || 'solar-pro';
  }

  async adaptText(options: AdaptationOptions): Promise<AdaptationResult> {
    const { targetAge, originalText, title } = options;
    
    // Create prompt based on target age
    const prompt = this.createPrompt(targetAge, originalText, title);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an educational text adaptation expert. You adapt texts for different age groups while maintaining the core message and educational value.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        console.error('Upstage API error:', response.status);
        // Fallback to simple adaptation
        return this.simpleAdaptation(targetAge, originalText);
      }

      const data = await response.json();
      const adaptedText = data.choices[0]?.message?.content || originalText;
      
      // Extract vocabulary and calculate reading time
      const vocabulary = this.extractKeyVocabulary(adaptedText);
      const readingTime = this.calculateReadingTime(adaptedText, targetAge);
      const readingLevel = this.getReadingLevel(targetAge);
      
      return {
        adaptedText,
        readingLevel,
        vocabulary,
        estimatedReadingTime: readingTime
      };
    } catch (error) {
      console.error('Error adapting text with Upstage AI:', error);
      // Fallback to simple adaptation
      return this.simpleAdaptation(targetAge, originalText);
    }
  }

  private createPrompt(targetAge: string, originalText: string, title?: string): string {
    const ageDescriptions = {
      'elementary': 'elementary school students (ages 6-11)',
      'middle': 'middle school students (ages 12-14)',
      'high': 'high school students (ages 15-18)',
      'adult': 'adult learners'
    };

    const ageDesc = ageDescriptions[targetAge as keyof typeof ageDescriptions] || 'general learners';

    return `Please adapt the following text for ${ageDesc}. 
    ${title ? `Title: ${title}` : ''}
    
    Original Text:
    ${originalText}
    
    Guidelines:
    - Use age-appropriate vocabulary
    - Adjust sentence complexity
    - Maintain the main message and story
    - Add explanations for difficult concepts if needed
    - Keep the educational value
    
    Please provide only the adapted text without any additional comments or formatting.`;
  }

  private simpleAdaptation(targetAge: string, originalText: string): AdaptationResult {
    // Simple fallback adaptation based on age
    let adaptedText = originalText;
    
    if (targetAge === 'elementary') {
      // Simplify for elementary
      adaptedText = originalText
        .replace(/\. [A-Z]/g, (match) => match + ' ')
        .replace(/[,;]/g, '.')
        .split('.')
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0)
        .map(sentence => {
          const words = sentence.split(' ');
          if (words.length > 15) {
            const mid = Math.floor(words.length / 2);
            return words.slice(0, mid).join(' ') + '. ' + 
                   words.slice(mid).join(' ');
          }
          return sentence;
        })
        .join('. ') + '.';
    } else if (targetAge === 'middle') {
      // Moderate simplification
      adaptedText = originalText
        .split('.')
        .map(sentence => {
          const words = sentence.trim().split(' ');
          if (words.length > 20) {
            const mid = Math.floor(words.length / 2);
            return words.slice(0, mid).join(' ') + '. ' + 
                   words.slice(mid).join(' ');
          }
          return sentence.trim();
        })
        .filter(sentence => sentence.length > 0)
        .join('. ') + '.';
    }
    // For high school and adult, keep original or minimal changes
    
    const vocabulary = this.extractKeyVocabulary(adaptedText);
    const readingTime = this.calculateReadingTime(adaptedText, targetAge);
    const readingLevel = this.getReadingLevel(targetAge);
    
    return {
      adaptedText,
      readingLevel,
      vocabulary,
      estimatedReadingTime: readingTime
    };
  }

  private extractKeyVocabulary(text: string): string[] {
    // Extract potentially difficult words (longer than 7 characters)
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 7)
      .filter((word, index, self) => self.indexOf(word) === index)
      .slice(0, 10);
    
    return words;
  }

  private calculateReadingTime(text: string, targetAge: string): number {
    const wordsPerMinute = {
      'elementary': 100,
      'middle': 150,
      'high': 200,
      'adult': 250
    };
    
    const wpm = wordsPerMinute[targetAge as keyof typeof wordsPerMinute] || 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wpm);
  }

  private getReadingLevel(targetAge: string): string {
    const levels = {
      'elementary': 'Grade 1-5',
      'middle': 'Grade 6-8',
      'high': 'Grade 9-12',
      'adult': 'College Level'
    };
    
    return levels[targetAge as keyof typeof levels] || 'General';
  }
}

// Singleton instance
export const upstageAdapter = new UpstageTextAdapter();