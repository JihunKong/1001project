'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export default function MissionVisionSection() {
  const { t } = useTranslation();
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-[1240px] px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <div
              className="px-6 py-2 rounded-full"
              style={{
                background: '#FAFAFA'
              }}
            >
              <span
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#2B2B2B'
                }}
              >
                {t('landing.missionVision.badge')}
              </span>
            </div>
          </div>

          <h2
            className="max-w-[1240px]"
            style={{
              fontFamily: 'Poppins',
              fontSize: '40px',
              fontWeight: 600,
              lineHeight: '1.2'
            }}
          >
            <span
              style={{
                background: 'linear-gradient(90deg, #04A59D 0%, #91C549 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t('landing.missionVision.tagline1')}
            </span>
            <span style={{ color: '#2B2B2B' }}>
              {t('landing.missionVision.tagline2')}
            </span>
          </h2>
        </div>

        {/* Two Columns */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* About Us */}
          <div className="space-y-4">
            <h3
              style={{
                fontFamily: 'Quicksand',
                fontSize: '20px',
                fontWeight: 700,
                color: '#04A59D'
              }}
            >
              {t('landing.missionVision.aboutUs.title')}
            </h3>
            <p
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                fontWeight: 400,
                color: '#2B2B2B',
                lineHeight: '2em'
              }}
            >
              {t('landing.missionVision.aboutUs.description')}
            </p>
          </div>

          {/* Our Vision */}
          <div className="space-y-4">
            <h3
              style={{
                fontFamily: 'Quicksand',
                fontSize: '20px',
                fontWeight: 700,
                color: '#04A59D'
              }}
            >
              {t('landing.missionVision.ourVision.title')}
            </h3>
            <p
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                fontWeight: 400,
                color: '#2B2B2B',
                lineHeight: '2em'
              }}
            >
              {t('landing.missionVision.ourVision.description')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
