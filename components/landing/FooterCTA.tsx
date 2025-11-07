'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FooterCTA: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="relative py-24 bg-[#FCF6ED] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-[237px]">
        <Image
          src="/landing/footer-pattern.svg"
          alt="Footer pattern"
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative max-w-[1240px] mx-auto px-8">
        <div className="max-w-[593px] mx-auto text-center space-y-8">
          {/* Title with Gradient */}
          <h2
            className="font-semibold bg-gradient-to-r from-[#04A59D] to-[#91C549] bg-clip-text text-transparent"
            style={{
              fontFamily: 'Poppins',
              fontSize: '32px',
              lineHeight: '48px'
            }}
          >
            {t('footerCta.title')}
          </h2>

          {/* Description */}
          <p
            className="text-[#2B2B2B]"
            style={{
              fontFamily: 'Inter',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '19px'
            }}
          >
            {t('footerCta.description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-5 pt-4">
            {/* Sign In Button */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#91C549] hover:opacity-90 text-[#2B2B2B] rounded-2xl transition-opacity"
              style={{
                fontFamily: 'Quicksand',
                fontSize: '16px',
                fontWeight: 700,
                lineHeight: '20px',
                width: '209px',
                height: '48px'
              }}
            >
              {t('footerCta.signIn')}
            </Link>

            {/* Sign Up Button */}
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#91C549] hover:opacity-90 text-[#2B2B2B] rounded-2xl transition-opacity relative"
              style={{
                fontFamily: 'Quicksand',
                fontSize: '16px',
                fontWeight: 700,
                lineHeight: '20px',
                width: '219px',
                height: '56px'
              }}
            >
              <div className="absolute inset-0 bg-[#FCC36B] rounded-2xl translate-x-1.5 translate-y-1.5 -z-10"></div>
              {t('footerCta.signUp')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FooterCTA;
