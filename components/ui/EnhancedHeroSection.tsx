'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import CircularBadge from '@/components/landing/CircularBadge';

interface HeroSectionProps {
  abTestVariant?: string;
  onEngagement?: (metrics: any) => void;
}

const EnhancedHeroSection: React.FC<HeroSectionProps> = ({
  abTestVariant = 'default',
  onEngagement
}) => {
  const { t } = useTranslation();

  const handleCTAClick = () => {
    onEngagement?.({
      storyId: 'hero_cta',
      sessionId: Date.now().toString(),
      timestamp: new Date(),
      eventType: 'click',
      metadata: { ctaType: 'explore_library' },
      abTestVariant,
      conversionFunnel: 'homepage_to_library'
    });
  };

  return (
    <section
      className="relative overflow-hidden pt-20"
      style={{
        minHeight: '100vh'
      }}
    >
      {/* Rectangle 84 - Background Gradient */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{
          height: '1036.62px',
          top: '-0.52px',
          background: 'linear-gradient(180deg, rgba(4, 165, 157, 0.45) 0%, rgba(96, 138, 58, 0.45) 54.33%, rgba(250, 250, 250, 0.45) 100%)',
          zIndex: 1
        }}
      />
      {/* Main Container - 1920px width base */}
      <div className="relative w-full min-h-[calc(100vh-80px)]" style={{ zIndex: 10 }}>
        {/* Hero Background Image - Positioned from Figma */}
        <div
          className="absolute hidden lg:block"
          style={{
            left: '50%',
            right: 0,
            top: '-1.93px',
            height: '923.29px',
            borderRadius: '0px 0px 0px 400px',
            overflow: 'hidden'
          }}
        >
          <Image
            src="/landing/hero-background.png"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Circular Badge - Exact Figma Position */}
        <div className="hidden lg:block">
          <CircularBadge />
        </div>

        {/* Content Container */}
        <div className="relative px-8 lg:px-0">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex items-center min-h-[calc(100vh-80px)] py-20 lg:pl-[81.4px]">
              {/* Text Content - Max width from Figma */}
              <div className="w-full lg:max-w-[661px]" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Tag Badge */}
                <span
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '40px',
                    fontWeight: 700,
                    lineHeight: '120%',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'linear-gradient(90deg, #04A59D 0%, #91C549 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {t('footerCta.tag')}
                </span>

                {/* Main Title */}
                <h1
                  className="max-w-[539px]"
                  style={{
                    marginTop: '20px',
                    fontFamily: 'Poppins',
                    fontSize: '70px',
                    fontWeight: 600,
                    color: '#2B2B2B',
                    lineHeight: '1.2',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {t('hero.title')}
                </h1>

                {/* Description */}
                <p
                  className="max-w-[539px]"
                  style={{
                    marginTop: '20px',
                    fontFamily: 'Poppins',
                    fontSize: '20px',
                    fontWeight: 500,
                    color: '#4B4B4B',
                    lineHeight: '1.5'
                  }}
                >
                  {t('hero.description')}
                </p>

                {/* CTA Button */}
                <div style={{ marginTop: '40px' }}>
                  <Link
                    href="/library"
                    onClick={handleCTAClick}
                    className="inline-flex items-center justify-center hover:opacity-90 transition-opacity"
                    style={{
                      width: '210px',
                      height: '48px',
                      background: 'linear-gradient(90deg, #04A59D 0%, #91C549 100%)',
                      borderRadius: '16px',
                      boxShadow: '5px 5px 10px 2px rgba(0, 0, 0, 0.25)',
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#F4F4F4'
                    }}
                  >
                    <span>{t('hero.cta')}</span>
                    <ArrowUpRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Hero Image */}
      <div className="lg:hidden relative w-full h-64 mt-8">
        <Image
          src="/landing/hero-background.png"
          alt="Hero background"
          fill
          className="object-cover rounded-bl-[100px]"
          priority
        />
      </div>
    </section>
  );
};

export default EnhancedHeroSection;
