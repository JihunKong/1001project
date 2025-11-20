'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function CircularBadge() {
  const { t } = useTranslation();

  return (
    <div className="absolute top-[200px] lg:top-[250px] xl:top-[288px] left-[46.1%] z-10 hidden lg:block">
      <div className="relative w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] xl:w-[139px] xl:h-[139px] animate-spin-slow">
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full"
          style={{ animation: 'spin 10s linear infinite' }}
        >
          <defs>
            <path
              id="circlePath"
              d="M 80, 80 m -60, 0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0"
            />
          </defs>

          <circle cx="80" cy="80" r="70" fill="#FCC36B" />

          <text
            fontSize="12"
            fontWeight="700"
            fontFamily="Poppins"
            fill="#2B2B2B"
            letterSpacing="2"
          >
            <textPath href="#circlePath" startOffset="0%">
              {t('circularBadge.text')}
            </textPath>
          </text>
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-[#2B2B2B] rounded-full">
            <ArrowRight className="w-6 h-6 md:w-7 md:h-7 text-white rotate-[-45deg]" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
