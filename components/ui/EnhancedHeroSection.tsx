'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

interface HeroSectionProps {
  abTestVariant?: string;
  onEngagement?: (metrics: any) => void;
}

const EnhancedHeroSection: React.FC<HeroSectionProps> = ({
  abTestVariant = 'default',
  onEngagement
}) => {
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
    <section className="relative min-h-screen bg-white overflow-hidden pt-20">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/landing/hero-background.svg"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative max-w-[1240px] mx-auto px-8">
        <div className="flex items-center min-h-[calc(100vh-80px)] py-20">
          {/* Content */}
          <div className="max-w-[701px] space-y-6">
            {/* Small Title */}
            <h2
              className="text-[#FAFAFA] font-semibold"
              style={{
                fontFamily: 'Quicksand',
                fontSize: '36px',
                lineHeight: '45px',
                textShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Empower Young Voices
            </h2>

            {/* Large Title */}
            <h1
              className="text-[#FAFAFA] font-bold"
              style={{
                fontFamily: 'Poppins',
                fontSize: '80px',
                lineHeight: '80px',
                textShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Inspire the World
            </h1>

            {/* Description */}
            <p
              className="text-[#EAEAEA] max-w-[661px]"
              style={{
                fontFamily: 'Poppins',
                fontSize: '20px',
                fontWeight: 500,
                lineHeight: '30px',
                textShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Our mission is to empower children to write, share, and learn through storytelling.
            </p>

            {/* CTA Button */}
            <div className="pt-4">
              <Link
                href="/library"
                onClick={handleCTAClick}
                className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-[#04A59D] to-[#91C549] hover:opacity-90 text-white rounded-2xl shadow-[5px_5px_10px_2px_rgba(0,0,0,0.25)] transition-opacity group"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '24px',
                  width: '210px',
                  height: '48px'
                }}
              >
                <span className="text-[#F4F4F4]">Explore Library</span>
                <ArrowUpRight className="ml-2 w-6 h-6 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;
