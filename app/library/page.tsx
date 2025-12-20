'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import HorizontalAccordion from '@/components/landing/HorizontalAccordion';
import { AccordionItemData } from '@/components/landing/HorizontalAccordion/types';
import HomePageNavigation from '@/components/ui/HomePageNavigation';
import { BookOpen } from 'lucide-react';

const accordionItems: AccordionItemData[] = [
  {
    id: 'step1',
    stepNumber: '01',
    titleKey: 'library.accordion.step1.title',
    descriptionKey: 'library.accordion.step1.description',
    image: '/landing/library/accordion-1.png'
  },
  {
    id: 'step2',
    stepNumber: '02',
    titleKey: 'library.accordion.step2.title',
    descriptionKey: 'library.accordion.step2.description',
    image: '/landing/library/accordion-2.png'
  },
  {
    id: 'step3',
    stepNumber: '03',
    titleKey: 'library.accordion.step3.title',
    descriptionKey: 'library.accordion.step3.description',
    image: '/landing/library/accordion-3.png'
  }
];

const stats = [
  { valueKey: 'library.stats.stories.value', labelKey: 'library.stats.stories.label', icon: '/landing/library/icon-book.svg' },
  { valueKey: 'library.stats.children.value', labelKey: 'library.stats.children.label', icon: '/landing/library/icon-baby.svg' },
  { valueKey: 'library.stats.countries.value', labelKey: 'library.stats.countries.label', icon: '/landing/library/icon-globe.svg' },
  { valueKey: 'library.stats.volunteers.value', labelKey: 'library.stats.volunteers.label', icon: '/landing/library/icon-handshake.svg' }
];

const howItWorksSteps = [
  { number: '1', colorClass: 'bg-green-500', image: '/landing/library/how-it-works-1.png', textKey: 'library.howItWorks.step1' },
  { number: '2', colorClass: 'bg-amber-500', image: '/landing/library/how-it-works-2.png', textKey: 'library.howItWorks.step2' },
  { number: '3', colorClass: 'bg-blue-400', image: '/landing/library/how-it-works-3.png', textKey: 'library.howItWorks.step3' }
];

export default function LibraryPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FCF6ED' }}>
      {/* Navigation */}
      <HomePageNavigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Decorative circles */}
        <div
          className="absolute -top-32 -left-32 w-[720px] h-[720px] rounded-full hidden lg:block"
          style={{ border: '5px solid #608A3A', opacity: 0.3 }}
        />
        <div
          className="absolute -bottom-48 -right-48 w-[720px] h-[720px] rounded-full hidden lg:block"
          style={{ border: '5px solid #608A3A', opacity: 0.3 }}
        />

        <div className="mx-auto max-w-[1240px] px-6 md:px-8 relative z-10">
          <div className="text-center">
            <h1
              className="mb-6"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(32px, 5vw, 64px)',
                fontWeight: 700,
                lineHeight: 1.5,
                color: '#014845'
              }}
            >
              {t('library.hero.title')}
            </h1>
            <p
              className="max-w-2xl mx-auto mb-8"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#014845'
              }}
            >
              {t('library.hero.description')}
            </p>
            <Link
              href={session ? "/dashboard/writer/library" : "/login"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl transition-all hover:scale-105"
              style={{
                backgroundColor: '#04A59D',
                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
              }}
            >
              <span
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#F4F4F4'
                }}
              >
                {t('library.cta.explore')}
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
        </div>
      </section>

      {/* Horizontal Accordion Section */}
      <section className="py-8 md:py-12 overflow-hidden">
        <div className="mx-auto max-w-[1455px] px-4 md:px-8">
          <HorizontalAccordion
            items={accordionItems}
            autoPlayInterval={5000}
          />
        </div>
      </section>

      {/* Stats Bar Section */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-[1240px] px-6 md:px-8">
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
                    <span className="text-2xl">
                      {index === 0 && '📚'}
                      {index === 1 && '👶'}
                      {index === 2 && '🌍'}
                      {index === 3 && '🤝'}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
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
                      fontFamily: 'Inter, sans-serif',
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

      {/* How 1001 Stories Works Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="mx-auto max-w-[1280px] px-6 md:px-8">
          <div className="text-center mb-12">
            <h2
              className="mb-4"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(28px, 4vw, 36px)',
                fontWeight: 700,
                color: '#2D3748'
              }}
            >
              {t('library.howItWorks.title')}
            </h2>
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                color: '#4A5568'
              }}
            >
              {t('library.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg transition-shadow duration-300 hover:shadow-xl"
                style={{ boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.1)' }}
              >
                <div className="flex justify-center mb-6">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center ${step.colorClass}`}
                  >
                    <span
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#FFFFFF'
                      }}
                    >
                      {step.number}
                    </span>
                  </div>
                </div>
                <div
                  className="w-full h-[290px] rounded-2xl mb-6 overflow-hidden relative"
                >
                  <Image
                    src={step.image}
                    alt={t(step.textKey)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: step.colorClass === 'bg-green-500' ? '#7CB342' :
                                      step.colorClass === 'bg-amber-500' ? '#F59E0B' : '#5B9BD5',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginTop: '-12px'
                  }}
                >
                  {t(step.textKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-16 md:py-24 overflow-hidden" style={{ backgroundColor: '#FCF6ED' }}>
        <div className="mx-auto max-w-[1065px] px-6 md:px-8 relative z-10">
          <div className="text-center">
            <h2
              className="mb-8"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(28px, 4vw, 48px)',
                fontWeight: 500,
                lineHeight: 1.5,
                color: '#014845'
              }}
            >
              {t('library.bottomCta.title')}
            </h2>
            <Link
              href={session ? "/dashboard/writer/library" : "/login"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl transition-all hover:scale-105"
              style={{
                backgroundColor: '#04A59D',
                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
              }}
            >
              <span
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#F4F4F4'
                }}
              >
                {t('library.bottomCta.button')}
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
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12"
        style={{
          background: '#8FD0AA'
        }}
      >
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
            {/* Logo and Tagline */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <BookOpen
                  className="w-7 h-7"
                  style={{ color: '#608A3A' }}
                />
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#608A3A',
                    lineHeight: '36px'
                  }}
                >
                  1001 Stories
                </span>
              </div>

              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#FAFAFA',
                  lineHeight: '38px'
                }}
              >
                {t('footer.tagline')}
              </p>

              {/* Social Icons */}
              <div className="relative w-[136px] h-[32px]">
                <Image
                  src="/landing/social-icons.svg"
                  alt="Social media icons"
                  width={136}
                  height={32}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Spacer */}
            <div />

            {/* Contact */}
            <div className="space-y-4">
              <h3
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FAFAFA',
                  lineHeight: '24px'
                }}
              >
                {t('footer.contact')}
              </h3>

              <div className="space-y-2">
                <a
                  href="mailto:info@1001stories.org"
                  className="block hover:underline"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#FAFAFA',
                    lineHeight: '19px'
                  }}
                >
                  info@1001stories.org
                </a>

                <Link
                  href="/contact"
                  className="block hover:underline"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#FAFAFA',
                    lineHeight: '24px'
                  }}
                >
                  {t('footer.contactForm')}
                </Link>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="mb-6"
            style={{
              borderTop: '1px solid #FAFAFA'
            }}
          />

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: '#FAFAFA',
                lineHeight: '24px'
              }}
            >
              {t('footer.copyright')}
            </p>

            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="hover:underline"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FAFAFA',
                  lineHeight: '24px'
                }}
              >
                {t('footer.privacy')}
              </Link>

              <Link
                href="/terms"
                className="hover:underline"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FAFAFA',
                  lineHeight: '24px'
                }}
              >
                {t('footer.terms')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
