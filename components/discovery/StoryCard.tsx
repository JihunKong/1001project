'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { StoryCardProps, EngagementMetrics, Story } from '../../types/discovery';

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  variant = 'detailed',
  showEngagementMetrics = true,
  onEngagement,
  abTestVariant,
  recommendationContext
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [impressionTracked, setImpressionTracked] = useState(false);

  const trackEngagement = useCallback((eventType: EngagementMetrics['eventType'], metadata?: Record<string, any>) => {
    if (onEngagement) {
      const engagementData: EngagementMetrics = {
        storyId: story.id,
        sessionId: generateSessionId(),
        timestamp: new Date(),
        eventType,
        metadata: {
          variant,
          abTestVariant,
          recommendationContext,
          ...metadata
        },
        ...(abTestVariant && { abTestVariant }),
        conversionFunnel: 'discovery_to_read'
      };
      onEngagement(engagementData);
    }
  }, [story.id, variant, abTestVariant, recommendationContext, onEngagement]);

  // Track impression when component is visible
  useEffect(() => {
    if (!impressionTracked && onEngagement) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.isIntersecting) {
            trackEngagement('view');
            setImpressionTracked(true);
            observer.disconnect();
          }
        },
        { threshold: 0.5, rootMargin: '50px' }
      );

      const element = document.getElementById(`story-card-${story.id}`);
      if (element) {
        observer.observe(element);
      }

      return () => observer.disconnect();
    }
    return () => {}; // Return empty cleanup function when no observer is created
  }, [story.id, impressionTracked, onEngagement, trackEngagement]);

  const handleCardClick = useCallback(() => {
    trackEngagement('click', { clickTarget: 'card_body' });
    // Navigation will be handled by parent component
  }, [trackEngagement]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    trackEngagement('like', { liked: newLikedState });
  }, [isLiked, trackEngagement]);

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);
    trackEngagement('bookmark', { bookmarked: newBookmarkState });
  }, [isBookmarked, trackEngagement]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackEngagement('share', { shareMethod: 'button_click' });

    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.summary,
        url: window.location.origin + `/story/${story.id}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/story/${story.id}`);
    }
  }, [story, trackEngagement]);

  const renderMediaPreview = () => {
    const primaryMedia = story.mediaAssets[0];
    if (!primaryMedia) return null;

    switch (primaryMedia.type) {
      case 'image':
        return (
          <div className="story-card__media" style={{ position: 'relative', width: '100%', height: '200px' }}>
            <Image
              src={primaryMedia.thumbnailUrl || primaryMedia.url}
              alt={primaryMedia.description || story.title}
              fill
              style={{ objectFit: 'cover' }}
              onLoad={() => trackEngagement('view', { mediaLoaded: true })}
            />
            {story.mediaAssets.length > 1 && (
              <div className="story-card__media-count">
                +{story.mediaAssets.length - 1} more
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="story-card__media story-card__media--video">
            <video
              poster={primaryMedia.thumbnailUrl}
              preload="metadata"
              onLoadedMetadata={() => trackEngagement('view', { videoPreview: true })}
            >
              <source src={primaryMedia.url} />
            </video>
            <div className="story-card__play-button">▶</div>
            {primaryMedia.duration && (
              <div className="story-card__duration">
                {formatDuration(primaryMedia.duration)}
              </div>
            )}
          </div>
        );
      case 'audio':
        return (
          <div className="story-card__media story-card__media--audio">
            <div className="story-card__audio-icon">🎵</div>
            <span className="story-card__audio-label">Audio Story</span>
            {primaryMedia.duration && (
              <span className="story-card__duration">
                {formatDuration(primaryMedia.duration)}
              </span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderCulturalContext = () => (
    <div className="story-card__cultural-context">
      <div className="story-card__origin">
        <span className="story-card__flag">🌍</span>
        <span className="story-card__origin-text">
          {story.culturalOrigin.name}, {story.culturalOrigin.country}
        </span>
      </div>
      <div className="story-card__type-badge">
        {story.storyType.replace('_', ' ').toUpperCase()}
      </div>
    </div>
  );

  const renderEngagementMetrics = () => {
    if (!showEngagementMetrics) return null;

    return (
      <div className="story-card__engagement">
        <div className="story-card__metric">
          <span className="story-card__metric-icon">👁</span>
          <span className="story-card__metric-count">
            {formatCount(story.viewCount)}
          </span>
        </div>
        <div className="story-card__metric">
          <span className="story-card__metric-icon">❤️</span>
          <span className="story-card__metric-count">
            {formatCount(story.likeCount)}
          </span>
        </div>
        <div className="story-card__metric">
          <span className="story-card__metric-icon">⭐</span>
          <span className="story-card__metric-count">
            {story.averageRating.toFixed(1)}
          </span>
        </div>
        <div className="story-card__completion-rate">
          {Math.round(story.completionRate * 100)}% completion
        </div>
      </div>
    );
  };

  const renderActions = () => (
    <div className="story-card__actions">
      <button
        className={`story-card__action ${isLiked ? 'story-card__action--active' : ''}`}
        onClick={handleLike}
        aria-label="Like story"
      >
        <span className="story-card__action-icon">
          {isLiked ? '❤️' : '🤍'}
        </span>
        <span className="story-card__action-text">Like</span>
      </button>

      <button
        className={`story-card__action ${isBookmarked ? 'story-card__action--active' : ''}`}
        onClick={handleBookmark}
        aria-label="Bookmark story"
      >
        <span className="story-card__action-icon">
          {isBookmarked ? '🔖' : '📌'}
        </span>
        <span className="story-card__action-text">Save</span>
      </button>

      <button
        className="story-card__action"
        onClick={handleShare}
        aria-label="Share story"
      >
        <span className="story-card__action-icon">📤</span>
        <span className="story-card__action-text">Share</span>
      </button>
    </div>
  );

  const renderRecommendationContext = () => {
    if (!recommendationContext) return null;

    return (
      <div className="story-card__recommendation-context">
        <span className="story-card__recommendation-icon">💡</span>
        <span className="story-card__recommendation-text">
          {getRecommendationText(recommendationContext)}
        </span>
      </div>
    );
  };

  const cardClasses = [
    'story-card',
    `story-card--${variant}`,
    abTestVariant && `story-card--test-${abTestVariant}`,
    story.trending && 'story-card--trending',
    story.featured && 'story-card--featured'
  ].filter(Boolean).join(' ');

  if (variant === 'compact') {
    return (
      <article
        id={`story-card-${story.id}`}
        className={cardClasses}
        onClick={handleCardClick}
        data-testid={`story-card-${story.id}`}
      >
        <div className="story-card__compact-content">
          {story.mediaAssets[0] && (
            <div className="story-card__compact-media" style={{ position: 'relative', width: '80px', height: '80px' }}>
              <Image
                src={story.mediaAssets[0].thumbnailUrl || story.mediaAssets[0].url}
                alt={story.title}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <div className="story-card__compact-text">
            <h3 className="story-card__title">{story.title}</h3>
            <p className="story-card__origin-compact">
              {story.culturalOrigin.name}
            </p>
            {renderEngagementMetrics()}
          </div>
        </div>
        {renderActions()}
      </article>
    );
  }

  return (
    <article
      id={`story-card-${story.id}`}
      className={cardClasses}
      onClick={handleCardClick}
      data-testid={`story-card-${story.id}`}
    >
      {story.trending && (
        <div className="story-card__trending-badge">
          🔥 Trending
        </div>
      )}

      {renderRecommendationContext()}
      {renderMediaPreview()}

      <div className="story-card__content">
        <div className="story-card__header">
          {renderCulturalContext()}
          <div className="story-card__education-level">
            {formatEducationalLevel(story.educationalLevel)}
          </div>
        </div>

        <h3 className="story-card__title">{story.title}</h3>
        <p className="story-card__summary">{story.summary}</p>

        <div className="story-card__author">
          <div className="story-card__author-info">
            {story.authorAvatar && (
              <Image
                src={story.authorAvatar}
                alt={story.authorName}
                width={32}
                height={32}
                className="story-card__author-avatar"
              />
            )}
            <span className="story-card__author-name">
              by {story.authorName}
            </span>
          </div>
          <span className="story-card__published-date">
            {formatDate(story.publishedAt || story.createdAt)}
          </span>
        </div>

        {story.tags.length > 0 && (
          <div className="story-card__tags">
            {story.tags.slice(0, 3).map(tag => (
              <span key={tag} className="story-card__tag">
                #{tag}
              </span>
            ))}
            {story.tags.length > 3 && (
              <span className="story-card__tag-more">
                +{story.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {renderEngagementMetrics()}
      </div>

      {renderActions()}
    </article>
  );
};

// Helper functions
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function formatEducationalLevel(level: string): string {
  return level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getRecommendationText(context: string): string {
  const contexts: Record<string, string> = {
    'similar_culture': 'Based on your interest in similar cultures',
    'trending': 'Currently trending in your area',
    'personalized': 'Recommended for you',
    'educational_path': 'Continues your learning journey',
    'community_favorite': 'Loved by the community'
  };
  return contexts[context] || 'Recommended';
}

export default StoryCard;