'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HomePageProps, Story, CulturalCollection, CulturalEvent, EngagementMetrics, ABTestConfig, HomePageSection } from '../../types/discovery';
import StoryCard from './StoryCard';
import EnhancedHeroSection from '../ui/EnhancedHeroSection';
import FeatureGrid from '../landing/FeatureGrid';
import SocialProof from '../landing/SocialProof';

const HomePage: React.FC<HomePageProps> = ({
  userId,
  personalizationEnabled = true,
  abTestConfig
}) => {
  const [sections, setSections] = useState<HomePageSection[]>([]);
  const [culturalEvents, setCulturalEvents] = useState<CulturalEvent[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<CulturalCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroStory, setHeroStory] = useState<Story | null>(null);
  const [abTestVariant, setAbTestVariant] = useState<string>('default');

  // A/B Testing setup
  useEffect(() => {
    if (abTestConfig?.active && abTestConfig.variants.length > 0) {
      const randomValue = Math.random();
      let cumulativeWeight = 0;

      for (const variant of abTestConfig.variants) {
        cumulativeWeight += variant.weight;
        if (randomValue <= cumulativeWeight) {
          setAbTestVariant(variant.name);
          break;
        }
      }
    }
  }, [abTestConfig]);

  // Load homepage content
  useEffect(() => {
    const loadHomeContent = async () => {
      setLoading(true);
      try {
        // Simulate API calls - replace with actual API endpoints
        const [
          heroResponse,
          sectionsResponse,
          eventsResponse,
          collectionsResponse
        ] = await Promise.all([
          fetchHeroStory(userId),
          fetchHomeSections(userId, personalizationEnabled, abTestVariant),
          fetchCulturalEvents(),
          fetchFeaturedCollections()
        ]);

        setHeroStory(heroResponse);
        setSections(sectionsResponse);
        setCulturalEvents(eventsResponse);
        setFeaturedCollections(collectionsResponse);
      } catch (error) {
        console.error('Failed to load homepage content:', error);
        // Fallback to default content
        loadFallbackContent();
      } finally {
        setLoading(false);
      }
    };

    loadHomeContent();
  }, [userId, personalizationEnabled, abTestVariant]);

  const handleEngagement = useCallback((metrics: EngagementMetrics) => {
    // Track engagement for conversion optimization
    const enhancedMetrics = {
      ...metrics,
      abTestVariant,
      pageContext: 'homepage',
      conversionFunnel: 'homepage_to_story'
    };

    // Send to analytics service
    trackEngagement(enhancedMetrics);
  }, [abTestVariant]);

  const trackSectionView = useCallback((sectionId: string, sectionType: string) => {
    const sectionMetrics: EngagementMetrics = {
      storyId: `section_${sectionId}`,
      sessionId: generateSessionId(),
      timestamp: new Date(),
      eventType: 'view',
      metadata: {
        sectionType,
        sectionPosition: sections.findIndex(s => s.id === sectionId),
        abTestVariant
      },
      abTestVariant,
      conversionFunnel: 'homepage_section_engagement'
    };

    trackEngagement(sectionMetrics);
  }, [sections, abTestVariant]);

  const renderHeroSection = () => {
    return (
      <EnhancedHeroSection
        abTestVariant={abTestVariant}
        onEngagement={handleEngagement}
      />
    );
  };

  const renderCulturalEvents = () => {
    if (culturalEvents.length === 0) return null;

    return (
      <section className="homepage__cultural-events">
        <div className="homepage__section-header">
          <h2 className="homepage__section-title">Cultural Celebrations</h2>
          <p className="homepage__section-description">
            Discover stories connected to current cultural events and festivals
          </p>
        </div>
        <div className="homepage__events-carousel">
          {culturalEvents.slice(0, 5).map(event => (
            <div
              key={event.id}
              className="homepage__event-card"
              onClick={() => trackSectionView(event.id, 'cultural_event')}
            >
              <div className="homepage__event-date">
                {formatEventDate(event.date)}
              </div>
              <h3 className="homepage__event-title">{event.title}</h3>
              <p className="homepage__event-origin">
                {event.culturalOrigin.name}
              </p>
              <div className="homepage__event-stories">
                {event.relatedStories.length} related stories
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderFeaturedCollections = () => {
    if (featuredCollections.length === 0) return null;

    return (
      <section className="homepage__featured-collections">
        <div className="homepage__section-header">
          <h2 className="homepage__section-title">Expert Collections</h2>
          <p className="homepage__section-description">
            Curated story collections from cultural experts and educators
          </p>
        </div>
        <div className="homepage__collections-grid">
          {featuredCollections.slice(0, 3).map(collection => (
            <div
              key={collection.id}
              className="homepage__collection-card"
              onClick={() => trackSectionView(collection.id, 'featured_collection')}
            >
              <div className="homepage__collection-header">
                <h3 className="homepage__collection-title">{collection.name}</h3>
                <div className="homepage__collection-curator">
                  {collection.curator.avatar && (
                    <Image
                      src={collection.curator.avatar}
                      alt={collection.curator.name}
                      width={40}
                      height={40}
                      className="homepage__curator-avatar"
                    />
                  )}
                  <div className="homepage__curator-info">
                    <div className="homepage__curator-name">
                      {collection.curator.name}
                    </div>
                    <div className="homepage__curator-expertise">
                      {collection.curator.expertise}
                    </div>
                  </div>
                </div>
              </div>
              <p className="homepage__collection-description">
                {collection.description}
              </p>
              <div className="homepage__collection-meta">
                <span className="homepage__collection-stories">
                  {collection.stories.length} stories
                </span>
                <span className="homepage__collection-culture">
                  {collection.culturalOrigin.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderSection = (section: HomePageSection) => {
    return (
      <section
        key={section.id}
        className={`homepage__section homepage__section--${section.type}`}
        onMouseEnter={() => trackSectionView(section.id, section.type)}
      >
        <div className="homepage__section-header">
          <h2 className="homepage__section-title">{section.title}</h2>
          {section.description && (
            <p className="homepage__section-description">{section.description}</p>
          )}
          {section.viewAllLink && (
            <Link
              href={section.viewAllLink}
              className="homepage__section-view-all"
              onClick={() => handleEngagement({
                storyId: `section_${section.id}_view_all`,
                sessionId: generateSessionId(),
                timestamp: new Date(),
                eventType: 'click',
                metadata: {
                  sectionType: section.type,
                  actionType: 'view_all'
                },
                abTestVariant,
                conversionFunnel: 'homepage_to_section'
              })}
            >
              View All →
            </Link>
          )}
        </div>

        <div className={`homepage__stories-grid homepage__stories-grid--${getGridLayout(section.type, abTestVariant)}`}>
          {section.stories.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              variant={getCardVariant(section.type, abTestVariant)}
              showEngagementMetrics={abTestVariant !== 'minimal_metrics'}
              onEngagement={handleEngagement}
              abTestVariant={abTestVariant}
              recommendationContext={getRecommendationContext(section.type)}
            />
          ))}
        </div>
      </section>
    );
  };

  const renderPersonalizedRecommendations = () => {
    if (!personalizationEnabled || !userId) return null;

    const personalizedSection = sections.find(s => s.type === 'personalized');
    if (!personalizedSection || personalizedSection.stories.length === 0) return null;

    return (
      <section className="homepage__personalized">
        <div className="homepage__section-header">
          <h2 className="homepage__section-title">
            <span className="homepage__personalized-icon">✨</span>
            Recommended for You
          </h2>
          <p className="homepage__section-description">
            Based on your reading history and cultural interests
          </p>
        </div>
        <div className="homepage__personalized-grid">
          {personalizedSection.stories.slice(0, 4).map(story => (
            <StoryCard
              key={story.id}
              story={story}
              variant="detailed"
              showEngagementMetrics={true}
              onEngagement={handleEngagement}
              abTestVariant={abTestVariant}
              recommendationContext="personalized"
            />
          ))}
        </div>
        {personalizedSection.stories.length > 4 && (
          <button className="homepage__load-more">
            Load More Recommendations
          </button>
        )}
      </section>
    );
  };

  return (
    <main className={`homepage homepage--${abTestVariant}`}>
      {renderHeroSection()}

      {/* Feature Grid Section - NEW */}
      <FeatureGrid />

      {loading && <div className="homepage__loading">Loading amazing stories...</div>}
      {renderCulturalEvents()}
      {renderPersonalizedRecommendations()}
      {renderFeaturedCollections()}

      {sections
        .filter(section => section.type !== 'personalized')
        .map(renderSection)}

      {/* Social Proof Section - NEW */}
      <SocialProof />

      <section className="homepage__cta-section">
        <div className="homepage__cta-content">
          <h2 className="homepage__cta-title">
            Share Your Cultural Story
          </h2>
          <p className="homepage__cta-description">
            Join our global community of storytellers and help preserve cultural heritage
          </p>
          <Link
            href="/signup"
            className="btn-secondary interactive-element"
            onClick={() => handleEngagement({
              storyId: 'footer_cta',
              sessionId: generateSessionId(),
              timestamp: new Date(),
              eventType: 'click',
              metadata: { ctaType: 'share_story' },
              abTestVariant,
              conversionFunnel: 'homepage_to_create'
            })}
          >
            Start Sharing
          </Link>
        </div>
      </section>
    </main>
  );
};

// Helper functions
async function fetchHeroStory(userId?: string): Promise<Story | null> {
  // Mock implementation - replace with actual API call
  return new Promise(resolve => {
    setTimeout(() => resolve(mockHeroStory), 300);
  });
}

async function fetchHomeSections(userId?: string, personalized?: boolean, variant?: string): Promise<HomePageSection[]> {
  // Mock implementation - replace with actual API call
  return new Promise(resolve => {
    setTimeout(() => resolve(mockHomeSections), 500);
  });
}

async function fetchCulturalEvents(): Promise<CulturalEvent[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockCulturalEvents), 400);
  });
}

async function fetchFeaturedCollections(): Promise<CulturalCollection[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockFeaturedCollections), 350);
  });
}

function loadFallbackContent() {
  // Implement fallback content loading
  console.warn('Loading fallback homepage content');
  // No data to load, but we still need to show the hero section
}

function trackEngagement(metrics: EngagementMetrics) {
  // Send to analytics service
  // TODO: Implement analytics tracking
  // fetch('/api/analytics/engagement', {
  //   method: 'POST',
  //   body: JSON.stringify(metrics)
  // });
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function formatEventDate(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays < 7) return `In ${diffInDays} days`;
  return date.toLocaleDateString();
}

function getGridLayout(sectionType: string, abTestVariant?: string): string {
  if (abTestVariant === 'compact_grid') return 'compact';
  if (sectionType === 'trending') return 'featured';
  if (sectionType === 'educational') return 'grid';
  return 'standard';
}

function getCardVariant(sectionType: string, abTestVariant?: string): 'compact' | 'detailed' | 'hero' {
  if (abTestVariant === 'minimal_cards') return 'compact';
  if (sectionType === 'trending') return 'detailed';
  return 'detailed';
}

function getRecommendationContext(sectionType: string): string {
  const contexts: Record<string, string> = {
    trending: 'trending',
    personalized: 'personalized',
    featured: 'featured',
    cultural: 'similar_culture',
    educational: 'educational_path',
    community: 'community_favorite'
  };
  return contexts[sectionType] || 'general';
}

// Mock data - replace with actual API responses
const mockHeroStory: Story = {
  id: 'hero-1',
  title: 'The Last Storyteller of the Himalayas',
  summary: 'An elderly Sherpa shares ancient tales passed down through generations, preserving the oral traditions of his mountain community.',
  content: '...',
  authorId: 'author-1',
  authorName: 'Pemba Sherpa',
  culturalOrigin: {
    id: 'nepal-sherpa',
    name: 'Sherpa Culture',
    region: 'Himalayas',
    country: 'Nepal',
    coordinates: { lat: 27.9881, lng: 86.9250 },
    description: 'The Sherpa people of the Himalayas',
    traditions: ['mountaineering', 'buddhism', 'oral_storytelling']
  },
  storyType: 'folklore',
  educationalLevel: 'all_ages',
  languages: ['en', 'ne'],
  primaryLanguage: 'en',
  tags: ['mountains', 'tradition', 'heritage'],
  mediaAssets: [{
    id: 'media-1',
    type: 'image',
    url: '/images/himalayan-village.svg',
    description: 'Traditional Sherpa village in the Himalayas'
  }],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  publishedAt: new Date('2024-01-15'),
  featured: true,
  trending: true,
  viewCount: 15420,
  likeCount: 1250,
  shareCount: 340,
  commentCount: 89,
  bookmarkCount: 780,
  completionRate: 0.87,
  averageRating: 4.8,
  ratingCount: 156
};

const mockHomeSections: HomePageSection[] = [
  {
    id: 'trending',
    title: 'Trending Stories',
    description: 'Most popular stories this week',
    stories: [], // Would be populated with actual story data
    viewAllLink: '/discover?sort=trending',
    type: 'trending'
  }
];

const mockCulturalEvents: CulturalEvent[] = [];
const mockFeaturedCollections: CulturalCollection[] = [];

export default HomePage;