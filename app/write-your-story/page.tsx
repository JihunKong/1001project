'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import HorizontalAccordion from '@/components/landing/HorizontalAccordion';
import { AccordionItemData } from '@/components/landing/HorizontalAccordion/types';
import HomePageNavigation from '@/components/ui/HomePageNavigation';
import { ArrowRight, Pencil, Save, Send, Sparkles } from 'lucide-react';

const accordionItems: AccordionItemData[] = [
  {
    id: 'step1',
    stepNumber: '01',
    titleKey: 'writeYourStory.steps.step1.title',
    descriptionKey: 'writeYourStory.steps.step1.description',
    image: '/landing/library/accordion-step1.jpg'
  },
  {
    id: 'step2',
    stepNumber: '02',
    titleKey: 'writeYourStory.steps.step2.title',
    descriptionKey: 'writeYourStory.steps.step2.description',
    image: '/landing/library/accordion-step2.jpg'
  },
  {
    id: 'step3',
    stepNumber: '03',
    titleKey: 'writeYourStory.steps.step3.title',
    descriptionKey: 'writeYourStory.steps.step3.description',
    image: '/landing/library/accordion-step3.jpg'
  }
];

const howItWorksSteps = [
  { number: '1', colorClass: 'bg-green-500', image: '/landing/library/how-it-works-1.jpg', textKey: 'writeYourStory.howItWorks.step1' },
  { number: '2', colorClass: 'bg-amber-500', image: '/landing/library/how-it-works-2.jpg', textKey: 'writeYourStory.howItWorks.step2' },
  { number: '3', colorClass: 'bg-blue-400', image: '/landing/library/how-it-works-3.jpg', textKey: 'writeYourStory.howItWorks.step3' }
];

export default function WriteYourStoryPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FCF6ED' }}>
      {/* Navigation */}
      <HomePageNavigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Decorative book icons */}
        <div className="absolute top-32 left-[10%] w-24 h-24 md:w-40 md:h-40 opacity-80 hidden lg:block">
          <div className="text-6xl md:text-8xl">📗</div>
        </div>
        <div className="absolute top-48 right-[5%] w-20 h-20 md:w-28 md:h-28 opacity-80 hidden lg:block">
          <div className="text-5xl md:text-7xl">📕</div>
        </div>
        <div className="absolute bottom-20 left-[15%] w-16 h-16 md:w-20 md:h-20 opacity-80 hidden lg:block">
          <div className="text-4xl md:text-5xl">📙</div>
        </div>
        <div className="absolute bottom-32 right-[15%] w-12 h-12 md:w-16 md:h-16 opacity-80 hidden lg:block">
          <div className="text-3xl md:text-4xl">📗</div>
        </div>

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
              {t('writeYourStory.hero.title')}
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
              {t('writeYourStory.hero.description')}
            </p>
            <Link
              href={session ? "/dashboard/writer" : "/signup?role=writer"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl transition-all hover:scale-105"
              style={{
                backgroundColor: '#04A59D',
                color: '#FFFFFF',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              {t('writeYourStory.hero.cta')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Story Editor Preview Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="mx-auto max-w-[1100px] px-6 md:px-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Editor Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <Pencil className="w-6 h-6" style={{ color: '#608A3A' }} />
                <h3
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#2B2B2B'
                  }}
                >
                  {t('writeYourStory.preview.title')}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#6B7280'
                  }}
                  disabled
                >
                  <Save className="w-4 h-4" />
                  {t('writeYourStory.preview.saveDraft')}
                </button>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: 'linear-gradient(90deg, #04A59D 0%, #91C549 100%)',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#FFFFFF'
                  }}
                  disabled
                >
                  <Send className="w-4 h-4" />
                  {t('writeYourStory.preview.submitReview')}
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="grid md:grid-cols-3 gap-0">
              {/* Main Editor Area */}
              <div className="md:col-span-2 p-6 border-r border-gray-100">
                <input
                  type="text"
                  value={t('writeYourStory.preview.storyTitle')}
                  className="w-full text-2xl font-semibold mb-4 border-none outline-none bg-transparent"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    color: '#2B2B2B'
                  }}
                  readOnly
                />
                <div className="space-y-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', lineHeight: 1.8 }}>
                  <p>Once upon a time, in a land far away, there lived a young prince on a tiny asteroid called B-612. The prince spent his days caring for his beloved rose and watching sunsets. One day, he decided to explore the universe and visit other planets...</p>
                  <p>On his journey, he met many curious grown-ups who taught him about the strange ways of adults. But it was on Earth that he found the most important lesson of all - that the most beautiful things in the world cannot be seen with eyes, but only felt with the heart.</p>
                  <p className="text-gray-400 italic">Continue writing your story here...</p>
                </div>
              </div>

              {/* AI Review Panel */}
              <div className="p-6 bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5" style={{ color: '#04A59D' }} />
                  <h4
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#2B2B2B'
                    }}
                  >
                    {t('writeYourStory.preview.aiReview')}
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-sm text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      ✓ Engaging opening sentence
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-sm text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      ✓ Good character development
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-sm text-amber-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      💡 Consider adding more dialogue
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Steps Accordion Section */}
      <section className="py-8 md:py-16">
        <div className="mx-auto max-w-[1240px] px-6 md:px-8">
          <HorizontalAccordion items={accordionItems} />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FCF6ED' }}>
        <div className="mx-auto max-w-[1065px] px-6 md:px-8">
          <div className="text-center mb-12">
            <h2
              className="mb-4"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 600,
                lineHeight: 1.4,
                color: '#2B2B2B'
              }}
            >
              {t('writeYourStory.howItWorks.title')}
            </h2>
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                color: '#6B7280'
              }}
            >
              {t('writeYourStory.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {howItWorksSteps.map((step) => (
              <div key={step.number} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div
                    className={`absolute top-4 left-4 w-8 h-8 ${step.colorClass} rounded-full flex items-center justify-center z-10`}
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#FFFFFF'
                    }}
                  >
                    {step.number}
                  </div>
                  <div className="w-full h-[290px] rounded-t-2xl overflow-hidden relative">
                    <Image
                      src={step.image}
                      alt={t(step.textKey)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                </div>
                <div className="p-6">
                  <p
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: 1.6,
                      color: '#4B5563'
                    }}
                  >
                    {t(step.textKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 md:py-12" style={{ backgroundColor: '#608A3A' }}>
        <div className="mx-auto max-w-[1065px] px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div
                className="mb-2"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 700,
                  color: '#FFFFFF'
                }}
              >
                <span className="mr-2">📚</span>500+
              </div>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                {t('writeYourStory.stats.stories')}
              </p>
            </div>
            <div className="text-center">
              <div
                className="mb-2"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 700,
                  color: '#FFFFFF'
                }}
              >
                <span className="mr-2">👶</span>10K
              </div>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                {t('writeYourStory.stats.children')}
              </p>
            </div>
            <div className="text-center">
              <div
                className="mb-2"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 700,
                  color: '#FFFFFF'
                }}
              >
                <span className="mr-2">🌍</span>50+
              </div>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                {t('writeYourStory.stats.countries')}
              </p>
            </div>
            <div className="text-center">
              <div
                className="mb-2"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 700,
                  color: '#FFFFFF'
                }}
              >
                <span className="mr-2">🤝</span>100+
              </div>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                {t('writeYourStory.stats.volunteers')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FCF6ED' }}>
        <div className="mx-auto max-w-[1100px] px-6 md:px-8">
          <div className="text-center mb-8">
            <h2
              className="mb-4"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 600,
                lineHeight: 1.4,
                color: '#2B2B2B'
              }}
            >
              {t('writeYourStory.dashboard.title')}
            </h2>
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                color: '#6B7280'
              }}
            >
              {t('writeYourStory.dashboard.subtitle')}
            </p>
          </div>

          {/* Dashboard Preview Card - Figma Image */}
          <div className="relative">
            <div className="rounded-3xl shadow-xl overflow-hidden">
              <Image
                src="/landing/write-your-story/writer-dashboard-preview.png"
                alt="Writer Dashboard Preview"
                width={1056}
                height={640}
                className="w-full h-auto"
                priority
              />
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href={session ? "/dashboard/writer" : "/signup?role=writer"}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(90deg, #04A59D 0%, #91C549 100%)',
                  color: '#FFFFFF',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600
                }}
              >
                {t('writeYourStory.hero.cta')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
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
              {t('writeYourStory.cta.title')}
            </h2>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl transition-all hover:scale-105"
              style={{
                backgroundColor: '#04A59D',
                color: '#FFFFFF',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              {t('writeYourStory.cta.button')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: '#2B2B2B' }}>
        <div className="mx-auto max-w-[1240px] px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.svg"
                  alt="1001 Stories"
                  width={32}
                  height={32}
                />
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#FFFFFF'
                  }}
                >
                  1001 Stories
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                Empowering young voices, inspiring the world through stories.
              </p>
              <Image
                src="/landing/social-icons.svg"
                alt="Social media icons"
                width={120}
                height={24}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF'
                }}
              >
                Contact Us
              </h3>
              <div className="flex flex-col gap-1">
                <Link
                  href="mailto:info@1001stories.org"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                  className="hover:text-white transition-colors"
                >
                  info@1001stories.org
                </Link>
                <Link
                  href="/contact"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                  className="hover:text-white transition-colors"
                >
                  Contact Form
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.5)'
              }}
            >
              © 2025 1001 Stories. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
