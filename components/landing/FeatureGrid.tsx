'use client';

import React from 'react';
import Image from 'next/image';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '/landing/icons/icon-kid-library.svg',
    title: 'Kid Library',
    description: 'Discover stories written by young authors around the world. Explore dreams through storytelling.'
  },
  {
    icon: '/landing/icons/icon-global-mentoring.svg',
    title: 'Global Mentoring',
    description: 'Bridging young minds and global mentors through stories that inspire learning beyond borders.'
  },
  {
    icon: '/landing/icons/icon-learning-program.svg',
    title: 'Learning Program',
    description: 'Empowering children to learn English through stories that spark imagination and confidence.'
  },
  {
    icon: '/landing/icons/icon-volunteer.svg',
    title: 'Volunteer Support',
    description: 'Students can publish their stories as authors while earning a certified record of volunteer service.'
  }
];

const FeatureGrid: React.FC = () => {
  return (
    <section className="py-12 bg-[#F9FCF7]">
      <div className="max-w-[1240px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center space-y-4"
            >
              {/* Icon */}
              <div className="w-[85px] h-[85px] relative">
                <Image
                  src={feature.icon}
                  alt={feature.title}
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
                {feature.title}
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
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
