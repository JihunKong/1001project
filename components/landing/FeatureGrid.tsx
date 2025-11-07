'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Feature {
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

const features: Feature[] = [
  {
    icon: '/landing/icons/icon-kid-library.svg',
    titleKey: 'features.kidLibrary.title',
    descriptionKey: 'features.kidLibrary.description'
  },
  {
    icon: '/landing/icons/icon-global-mentoring.svg',
    titleKey: 'features.globalMentoring.title',
    descriptionKey: 'features.globalMentoring.description'
  },
  {
    icon: '/landing/icons/icon-learning-program.svg',
    titleKey: 'features.learningProgram.title',
    descriptionKey: 'features.learningProgram.description'
  },
  {
    icon: '/landing/icons/icon-volunteer.svg',
    titleKey: 'features.volunteerSupport.title',
    descriptionKey: 'features.volunteerSupport.description'
  }
];

const FeatureGrid: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-12 bg-[#F9FCF7]">
      <div className="max-w-[1240px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.titleKey}
              className="flex flex-col items-center text-center space-y-4"
            >
              {/* Icon */}
              <div className="w-[85px] h-[85px] relative">
                <Image
                  src={feature.icon}
                  alt={t(feature.titleKey)}
                  width={85}
                  height={85}
                  className="object-contain"
                />
              </div>

              {/* Title */}
              <h3
                className="text-[#91C549] font-semibold"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '24px',
                  lineHeight: '36px'
                }}
              >
                {t(feature.titleKey)}
              </h3>

              {/* Description */}
              <p
                className="text-[#6F6F6F]"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '24px'
                }}
              >
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
