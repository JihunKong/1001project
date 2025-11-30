'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import HorizontalAccordion from './HorizontalAccordion';
import { AccordionItemData } from './HorizontalAccordion/types';

const accordionItems: AccordionItemData[] = [
  {
    id: 'step1',
    stepNumber: '01',
    titleKey: 'landing.library.accordion.step1.title',
    descriptionKey: 'landing.library.accordion.step1.description',
    image: '/landing/library/step1-setup.svg'
  },
  {
    id: 'step2',
    stepNumber: '02',
    titleKey: 'landing.library.accordion.step2.title',
    descriptionKey: 'landing.library.accordion.step2.description',
    image: '/landing/library/step2-choose.svg'
  },
  {
    id: 'step3',
    stepNumber: '03',
    titleKey: 'landing.library.accordion.step3.title',
    descriptionKey: 'landing.library.accordion.step3.description',
    image: '/landing/library/step3-read.svg'
  }
];

const stats = [
  { valueKey: 'landing.library.stats.stories.value', labelKey: 'landing.library.stats.stories.label', icon: '📚' },
  { valueKey: 'landing.library.stats.children.value', labelKey: 'landing.library.stats.children.label', icon: '👶' },
  { valueKey: 'landing.library.stats.countries.value', labelKey: 'landing.library.stats.countries.label', icon: '🌍' },
  { valueKey: 'landing.library.stats.volunteers.value', labelKey: 'landing.library.stats.volunteers.label', icon: '🤝' }
];

export default function LibrarySection() {
  const { t } = useTranslation();

  return (
    <section
      className="py-16 md:py-24 overflow-hidden"
      style={{ backgroundColor: '#FCF6ED' }}
    >
      <div className="mx-auto max-w-[1240px] px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="mb-6"
            style={{
              fontFamily: 'Poppins',
              fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 700,
              lineHeight: '1.5',
              color: '#014845'
            }}
          >
            {t('landing.library.title')}
          </h2>
          <p
            className="max-w-2xl mx-auto mb-8"
            style={{
              fontFamily: 'Poppins',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '1.5',
              color: '#014845'
            }}
          >
            {t('landing.library.description')}
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl transition-all hover:scale-105"
            style={{
              backgroundColor: '#04A59D',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
            }}
          >
            <span
              style={{
                fontFamily: 'Quicksand',
                fontSize: '16px',
                fontWeight: 700,
                color: '#F4F4F4'
              }}
            >
              {t('landing.library.cta')}
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F4F4F4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </Link>
        </div>

        {/* Horizontal Accordion */}
        <div className="mb-16">
          <HorizontalAccordion
            items={accordionItems}
            autoPlayInterval={5000}
          />
        </div>

        {/* Stats Bar */}
        <div
          className="rounded-[40px] p-8 md:p-12"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.05)'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 'clamp(24px, 4vw, 36px)',
                      fontWeight: 600,
                      background: 'linear-gradient(90deg, #04A59D 0%, #91C549 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {t(stat.valueKey)}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#608A3A'
                  }}
                >
                  {t(stat.labelKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
