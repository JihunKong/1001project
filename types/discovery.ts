export interface Story {
  id: string;
  title: string;
  summary: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  culturalOrigin: CulturalOrigin;
  storyType: StoryType;
  educationalLevel: EducationalLevel;
  languages: string[];
  primaryLanguage: string;
  tags: string[];
  mediaAssets: MediaAsset[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  featured: boolean;
  trending: boolean;

  // Engagement metrics for conversion optimization
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  bookmarkCount: number;
  completionRate: number;
  averageRating: number;
  ratingCount: number;

  // A/B testing and personalization
  abTestVariant?: string;
  personalizedScore?: number;
  recommendationReason?: string;
}

export interface CulturalOrigin {
  id: string;
  name: string;
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  historicalPeriod?: string;
  traditions: string[];
  relatedCultures?: string[];
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  thumbnailUrl?: string;
  description?: string;
  culturalContext?: string;
  duration?: number; // for audio/video
}

export type StoryType =
  | 'folklore'
  | 'personal'
  | 'educational'
  | 'modern'
  | 'historical'
  | 'mythological'
  | 'biographical'
  | 'documentary';

export type EducationalLevel =
  | 'elementary'
  | 'middle'
  | 'high'
  | 'university'
  | 'adult'
  | 'all_ages';

export interface SearchFilters {
  culturalOrigins: string[];
  storyTypes: StoryType[];
  educationalLevels: EducationalLevel[];
  languages: string[];
  tags: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  sortBy: 'relevance' | 'popularity' | 'recent' | 'rating' | 'trending';
  minRating?: number;
  hasMedia?: boolean;
}

export interface PersonalizationPreferences {
  preferredCultures: string[];
  preferredLanguages: string[];
  educationalLevel: EducationalLevel;
  interests: string[];
  contentTypes: StoryType[];
  learningGoals: string[];
}

export interface EngagementMetrics {
  storyId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  eventType: 'view' | 'like' | 'share' | 'comment' | 'bookmark' | 'complete' | 'click' | 'search';
  metadata?: Record<string, any>;
  abTestVariant?: string;
  conversionFunnel?: string;
}

export interface RecommendationEngine {
  recommendations: Story[];
  algorithm: 'collaborative' | 'content_based' | 'cultural_similarity' | 'trending' | 'educational_path';
  confidence: number;
  reason: string;
  diversityScore: number; // Cultural diversity in recommendations
}

export interface CulturalCollection {
  id: string;
  name: string;
  description: string;
  culturalOrigin: CulturalOrigin;
  curator: {
    id: string;
    name: string;
    expertise: string;
    avatar?: string;
  };
  stories: Story[];
  educationalValue: string;
  targetAudience: EducationalLevel[];
  featured: boolean;
  createdAt: Date;
}

export interface SearchResult {
  stories: Story[];
  totalCount: number;
  facets: {
    culturalOrigins: Array<{ name: string; count: number }>;
    storyTypes: Array<{ type: StoryType; count: number }>;
    languages: Array<{ language: string; count: number }>;
    educationalLevels: Array<{ level: EducationalLevel; count: number }>;
  };
  suggestions: string[];
  searchAnalytics: {
    query: string;
    resultsCount: number;
    clickThroughRate: number;
    conversionRate: number;
  };
}

export interface CulturalEvent {
  id: string;
  title: string;
  description: string;
  culturalOrigin: CulturalOrigin;
  eventType: 'festival' | 'holiday' | 'commemoration' | 'seasonal';
  date: Date;
  relatedStories: string[];
  educationalContent: string;
  multimedia: MediaAsset[];
}

export interface UserEngagementProfile {
  userId: string;
  preferences: PersonalizationPreferences;
  engagementHistory: EngagementMetrics[];
  culturalExploration: {
    culturesExplored: string[];
    favoriteRegions: string[];
    learningProgress: Record<string, number>;
  };
  conversionMetrics: {
    signupSource: string;
    activationEvents: Date[];
    retentionScore: number;
    ltv: number;
  };
}

export interface ABTestConfig {
  testName: string;
  variants: Array<{
    name: string;
    weight: number;
    config: Record<string, any>;
  }>;
  targetMetric: string;
  startDate: Date;
  endDate?: Date;
  active: boolean;
}

export interface DiscoveryPageProps {
  initialFilters?: Partial<SearchFilters>;
  culturalFocus?: string;
  abTestConfig?: ABTestConfig;
}

export interface HomePageProps {
  userId?: string;
  personalizationEnabled?: boolean;
  abTestConfig?: ABTestConfig;
}

export interface StoryCardProps {
  story: Story;
  variant?: 'compact' | 'detailed' | 'hero';
  showEngagementMetrics?: boolean;
  onEngagement?: (metrics: EngagementMetrics) => void;
  abTestVariant?: string;
  recommendationContext?: string;
}

export interface CulturalExplorationProps {
  initialRegion?: string;
  mapView?: boolean;
  timelineView?: boolean;
  educationalMode?: boolean;
}

// Additional interfaces for homepage sections
export interface HomePageSection {
  id: string;
  title: string;
  description?: string;
  stories: Story[];
  viewAllLink?: string;
  type: 'trending' | 'personalized' | 'featured' | 'cultural' | 'educational' | 'community';
}