import { prisma } from '@/lib/prisma';

interface RecommendationFactors {
  userId: string;
  readingLevel?: string;
  recentlyRead?: string[];
  preferredCategories?: string[];
  completionRate?: number;
  vocabularyLevel?: number;
}

interface ContentRecommendation {
  id: string;
  title: string;
  author: string;
  reason: string;
  score: number;
  type: 'story' | 'book' | 'material';
  difficulty: 'easy' | 'medium' | 'hard' | 'challenge';
  estimatedReadTime: number;
  category: string[];
  tags: string[];
}

export class RecommendationEngine {
  private readonly WEIGHTS = {
    levelMatch: 0.3,
    categoryMatch: 0.2,
    novelty: 0.2,
    popularity: 0.1,
    completion: 0.1,
    diversity: 0.1
  };

  async getPersonalizedRecommendations(
    factors: RecommendationFactors,
    limit: number = 10
  ): Promise<ContentRecommendation[]> {
    const { userId, readingLevel = 'Intermediate', recentlyRead = [], preferredCategories = [] } = factors;

    // Get user's reading history and preferences
    const userHistory = await this.getUserReadingHistory(userId);
    
    // Get all available content
    const availableContent = await this.getAvailableContent(userId);
    
    // Calculate scores for each content item
    const scoredContent = availableContent.map(content => {
      const score = this.calculateContentScore(content, {
        ...factors,
        userHistory,
        recentlyRead: [...recentlyRead, ...userHistory.completedIds]
      });
      
      return {
        ...content,
        score,
        reason: this.generateRecommendationReason(content, score, factors)
      };
    });
    
    // Sort by score and apply diversity filter
    const recommendations = this.applyDiversityFilter(
      scoredContent.sort((a, b) => b.score - a.score),
      limit
    );
    
    return recommendations;
  }

  private async getUserReadingHistory(userId: string) {
    const interactions = await prisma.userContentInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        contentId: true,
        contentType: true,
        completed: true,
        progress: true,
        rating: true,
        createdAt: true
      }
    });

    return {
      completedIds: interactions.filter(i => i.completed).map(i => i.contentId),
      inProgressIds: interactions.filter(i => !i.completed && i.progress > 0).map(i => i.contentId),
      averageRating: interactions.filter(i => i.rating).reduce((acc, i) => acc + (i.rating || 0), 0) / 
                     interactions.filter(i => i.rating).length || 0,
      totalRead: interactions.filter(i => i.completed).length
    };
  }

  private async getAvailableContent(userId: string) {
    // Fetch books from database
    const books = await prisma.book.findMany({
      where: { 
        isPublished: true,
        isPremium: false // All content is free
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        category: true,
        tags: true,
        readingLevel: true,
        summary: true,
        viewCount: true,
        rating: true
      }
    });

    // Transform to recommendation format
    return books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.authorName,
      type: 'book' as const,
      category: book.category,
      tags: book.tags || [],
      readingLevel: book.readingLevel || 'Intermediate',
      popularity: book.viewCount,
      rating: book.rating || 0,
      summary: book.summary
    }));
  }

  private calculateContentScore(
    content: any,
    factors: any
  ): number {
    let score = 0;
    
    // Level matching score
    const levelScore = this.calculateLevelMatchScore(
      content.readingLevel,
      factors.readingLevel
    );
    score += levelScore * this.WEIGHTS.levelMatch;
    
    // Category matching score
    const categoryScore = this.calculateCategoryScore(
      content.category,
      factors.preferredCategories
    );
    score += categoryScore * this.WEIGHTS.categoryMatch;
    
    // Novelty score (not recently read)
    const noveltyScore = factors.recentlyRead.includes(content.id) ? 0 : 1;
    score += noveltyScore * this.WEIGHTS.novelty;
    
    // Popularity score
    const popularityScore = Math.min(content.popularity / 1000, 1);
    score += popularityScore * this.WEIGHTS.popularity;
    
    // Rating score
    const ratingScore = (content.rating || 0) / 5;
    score += ratingScore * this.WEIGHTS.completion;
    
    return score;
  }

  private calculateLevelMatchScore(
    contentLevel: string,
    userLevel: string
  ): number {
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    const contentIdx = levels.indexOf(contentLevel);
    const userIdx = levels.indexOf(userLevel);
    
    if (contentIdx === -1 || userIdx === -1) return 0.5;
    
    const diff = Math.abs(contentIdx - userIdx);
    
    // Perfect match = 1.0
    // One level diff = 0.7
    // Two level diff = 0.3
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.7;
    return 0.3;
  }

  private calculateCategoryScore(
    contentCategories: string[],
    preferredCategories: string[]
  ): number {
    if (!preferredCategories.length) return 0.5;
    
    const matches = contentCategories.filter(cat => 
      preferredCategories.includes(cat)
    ).length;
    
    return Math.min(matches / preferredCategories.length, 1);
  }

  private applyDiversityFilter(
    sortedContent: any[],
    limit: number
  ): ContentRecommendation[] {
    const selected: ContentRecommendation[] = [];
    const usedCategories = new Set<string>();
    const usedAuthors = new Set<string>();
    
    for (const content of sortedContent) {
      if (selected.length >= limit) break;
      
      // Ensure diversity in categories and authors
      const isNovel = !content.category.every((cat: string) => usedCategories.has(cat)) ||
                     !usedAuthors.has(content.author);
      
      if (selected.length < 3 || isNovel) {
        selected.push(this.mapToRecommendation(content));
        content.category.forEach((cat: string) => usedCategories.add(cat));
        usedAuthors.add(content.author);
      }
    }
    
    return selected;
  }

  private mapToRecommendation(content: any): ContentRecommendation {
    return {
      id: content.id,
      title: content.title,
      author: content.author,
      reason: content.reason,
      score: content.score,
      type: content.type,
      difficulty: this.mapLevelToDifficulty(content.readingLevel),
      estimatedReadTime: this.estimateReadTime(content),
      category: content.category,
      tags: content.tags
    };
  }

  private mapLevelToDifficulty(level: string): 'easy' | 'medium' | 'hard' | 'challenge' {
    switch (level) {
      case 'Beginner': return 'easy';
      case 'Intermediate': return 'medium';
      case 'Advanced': return 'hard';
      default: return 'medium';
    }
  }

  private estimateReadTime(content: any): number {
    // Estimate based on average reading speed and content length
    // This is a simplified calculation
    const wordsPerMinute = 200;
    const estimatedWords = 2000; // Default estimate
    return Math.ceil(estimatedWords / wordsPerMinute);
  }

  private generateRecommendationReason(
    content: any,
    score: number,
    factors: RecommendationFactors
  ): string {
    const reasons: string[] = [];
    
    if (content.readingLevel === factors.readingLevel) {
      reasons.push('Matches your reading level');
    }
    
    const categoryMatch = content.category.filter((cat: string) => 
      factors.preferredCategories?.includes(cat)
    );
    if (categoryMatch.length > 0) {
      reasons.push(`You enjoy ${categoryMatch[0]} stories`);
    }
    
    if (content.popularity > 500) {
      reasons.push('Popular with other learners');
    }
    
    if (content.rating >= 4) {
      reasons.push('Highly rated');
    }
    
    if (!factors.recentlyRead?.includes(content.id)) {
      reasons.push('New to you');
    }
    
    return reasons.slice(0, 2).join(' • ') || 'Recommended for you';
  }
}

export const recommendationEngine = new RecommendationEngine();