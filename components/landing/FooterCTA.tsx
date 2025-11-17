'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FooterCTA: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{
        background: '#FFFFFF'
      }}
    >
      {/* Background Pattern */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '237px'
        }}
      >
        <Image
          src="/landing/footer-pattern-figma.svg"
          alt="Footer pattern"
          fill
          className="object-cover object-bottom"
          priority={false}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-[1240px] mx-auto px-8">
        <div className="max-w-[593px] mx-auto text-center space-y-8">
          {/* Title */}
          <h2
            style={{
              fontFamily: 'Poppins',
              fontSize: '48px',
              fontWeight: 600,
              color: '#014845',
              lineHeight: '72px'
            }}
          >
            {t('footerCta.title')}
          </h2>

          {/* Description */}
          <p
            style={{
              fontFamily: 'Poppins',
              fontSize: '16px',
              fontWeight: 500,
              color: '#A0A0A0',
              lineHeight: '24px'
            }}
          >
            {t('footerCta.description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 pt-4">
            {/* Sign In Button */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center hover:opacity-90 transition-opacity"
              style={{
                width: '209px',
                height: '48px',
                background: '#91C549',
                borderRadius: '16px',
                fontFamily: 'Quicksand',
                fontSize: '16px',
                fontWeight: 700,
                color: '#2B2B2B'
              }}
            >
              {t('footerCta.signIn')}
            </Link>

            {/* Sign Up Button with Shadow */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: '#FCC36B',
                  transform: 'translate(6px, 8px)',
                  zIndex: 0
                }}
              />
              <Link
                href="/signup"
                className="relative inline-flex items-center justify-center hover:opacity-90 transition-opacity"
                style={{
                  width: '219px',
                  height: '56px',
                  background: '#91C549',
                  borderRadius: '16px',
                  fontFamily: 'Quicksand',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#2B2B2B',
                  zIndex: 1
                }}
              >
                {t('footerCta.signUp')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FooterCTA;
