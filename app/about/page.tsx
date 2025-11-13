'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import HomePageNavigation from '@/components/ui/HomePageNavigation';
import FooterCTA from '@/components/landing/FooterCTA';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <HomePageNavigation />

      {/* Hero Section */}
      <section className="relative h-[752px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/about/hero-background-13dbdc.png"
            alt="About 1001 Stories"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
        </div>

        <div className="relative max-w-[1240px] mx-auto px-8 h-full flex items-end pb-32">
          <div className="max-w-[873px] space-y-6">
            <h1
              className="text-[#FAFAFA] font-bold"
              style={{
                fontFamily: 'Poppins',
                fontSize: '80px',
                lineHeight: '1em'
              }}
            >
              {t('about.hero.title')}
            </h1>
            <h2
              className="text-[#FAFAFA] font-semibold"
              style={{
                fontFamily: 'Poppins',
                fontSize: '24px',
                lineHeight: '1.5em'
              }}
            >
              {t('about.hero.subtitle')}
            </h2>
            <p
              className="text-[#FAFAFA]"
              style={{
                fontFamily: 'Inter',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '19px'
              }}
            >
              {t('about.hero.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="mb-12 space-y-2">
            <h2
              className="text-[#2B2B2B] font-semibold"
              style={{
                fontFamily: 'Poppins',
                fontSize: '36px',
                lineHeight: '1.5em'
              }}
            >
              {t('about.whoWeAre.title')}
            </h2>
            <p
              className="text-[#2B2B2B] font-bold"
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                lineHeight: '1.5em'
              }}
            >
              {t('about.whoWeAre.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left: Illustration */}
            <div className="relative h-[532px]">
              <Image
                src="/about/who-we-are-illustration.svg"
                alt="Who We Are"
                fill
                className="object-contain"
              />
            </div>

            {/* Right: Two Cards */}
            <div className="space-y-6">
              {/* Seeds of Empowerment Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3
                  className="text-[#04A59D] font-semibold mb-3"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '24px',
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.whoWeAre.soe.title')}
                </h3>
                <p
                  className="text-[#4C4C4D]"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '2em'
                  }}
                >
                  {t('about.whoWeAre.soe.description')}
                </p>
              </div>

              {/* 1001 Stories Project Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3
                  className="text-[#04A59D] font-semibold mb-3"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '24px',
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.whoWeAre.project.title')}
                </h3>
                <p
                  className="text-[#4C4C4D]"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '2em'
                  }}
                >
                  {t('about.whoWeAre.project.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="mb-12 space-y-2">
            <h2
              className="text-[#2B2B2B] font-semibold"
              style={{
                fontFamily: 'Poppins',
                fontSize: '36px',
                lineHeight: '1.5em'
              }}
            >
              {t('about.benefits.title')}
            </h2>
            <p
              className="text-[#2B2B2B] font-bold"
              style={{
                fontFamily: 'Inter',
                fontSize: '16px',
                lineHeight: '19px'
              }}
            >
              {t('about.benefits.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Benefit 01 */}
            <div className="bg-white rounded-lg p-10 flex flex-col items-end">
              <span
                className="text-[#04A59D] font-bold text-right w-full"
                style={{
                  fontFamily: 'Quicksand',
                  fontSize: '64px',
                  lineHeight: '1em'
                }}
              >
                01
              </span>
              <div className="mt-10 space-y-3">
                <h3
                  className="text-[#2B2B2B] font-semibold"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '24px',
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.benefits.benefit1.title')}
                </h3>
                <p
                  className="text-[#6F6F6F]"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '2em'
                  }}
                >
                  {t('about.benefits.benefit1.description')}
                </p>
              </div>
            </div>

            {/* Benefit 02 */}
            <div className="bg-white rounded-lg p-10 flex flex-col items-end">
              <span
                className="text-[#04A59D] font-bold text-right w-full"
                style={{
                  fontFamily: 'Quicksand',
                  fontSize: '64px',
                  lineHeight: '1em'
                }}
              >
                02
              </span>
              <div className="mt-10 space-y-3">
                <h3
                  className="text-[#2B2B2B] font-semibold"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '24px',
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.benefits.benefit2.title')}
                </h3>
                <p
                  className="text-[#6F6F6F]"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '2em'
                  }}
                >
                  {t('about.benefits.benefit2.description')}
                </p>
              </div>
            </div>

            {/* Benefit 03 */}
            <div className="bg-white rounded-lg p-10 flex flex-col items-end">
              <span
                className="text-[#04A59D] font-bold text-right w-full"
                style={{
                  fontFamily: 'Quicksand',
                  fontSize: '64px',
                  lineHeight: '1em'
                }}
              >
                03
              </span>
              <div className="mt-10 space-y-3">
                <h3
                  className="text-[#2B2B2B] font-semibold"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '24px',
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.benefits.benefit3.title')}
                </h3>
                <p
                  className="text-[#6F6F6F]"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '2em'
                  }}
                >
                  {t('about.benefits.benefit3.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="mb-12 space-y-2">
            <h2
              className="text-[#2B2B2B] font-semibold"
              style={{
                fontFamily: 'Poppins',
                fontSize: '36px',
                lineHeight: '1.5em'
              }}
            >
              {t('about.features.title')}
            </h2>
            <p
              className="text-[#2B2B2B] font-bold"
              style={{
                fontFamily: 'Inter',
                fontSize: '16px',
                lineHeight: '13px'
              }}
            >
              {t('about.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Browse Library */}
            <div className="bg-white rounded-lg border border-[#F1F1F3] p-5 flex flex-col gap-14">
              <div className="space-y-6">
                <div className="relative h-[266px] w-full rounded-lg overflow-hidden">
                  <Image
                    src="/about/feature-library.png"
                    alt="Browse Library"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h3
                    className="text-[#2B2B2B] font-bold"
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '20px',
                      lineHeight: '1.5em'
                    }}
                  >
                    {t('about.features.library.title')}
                  </h3>
                  <p
                    className="text-[#6F6F6F]"
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      lineHeight: '2em'
                    }}
                  >
                    {t('about.features.library.description')}
                  </p>
                </div>
              </div>
              <button
                className="w-full py-3 px-6 bg-[#F7F7F8] border border-[#F1F1F3] rounded-md text-[#262626] font-bold text-center"
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: '14px',
                  lineHeight: '1.5em'
                }}
              >
                {t('about.features.library.cta')}
              </button>
            </div>

            {/* Feature 2: Write Your Story */}
            <div className="bg-white rounded-lg border border-[#F1F1F3] p-5 flex flex-col gap-14">
              <div className="space-y-6">
                <div className="relative h-[266px] w-full rounded-lg overflow-hidden">
                  <Image
                    src="/about/feature-write.png"
                    alt="Write Your Story"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h3
                    className="text-[#2B2B2B] font-bold"
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '20px',
                      lineHeight: '1.5em'
                    }}
                  >
                    {t('about.features.write.title')}
                  </h3>
                  <p
                    className="text-[#6F6F6F]"
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      lineHeight: '2em'
                    }}
                  >
                    {t('about.features.write.description')}
                  </p>
                </div>
              </div>
              <button
                className="w-full py-3 px-6 bg-[#F7F7F8] border border-[#F1F1F3] rounded-md text-[#262626] font-bold text-center"
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: '14px',
                  lineHeight: '1.5em'
                }}
              >
                {t('about.features.write.cta')}
              </button>
            </div>

            {/* Feature 3: Join Book Club (Coming Soon) */}
            <div className="bg-white rounded-lg border border-[#F1F1F3] p-5 flex flex-col gap-14">
              <div className="space-y-6">
                <div className="relative h-[266px] w-full rounded-lg overflow-hidden">
                  <Image
                    src="/about/feature-bookclub.png"
                    alt="Join a Book Club"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h3
                    className="text-[#262626] font-semibold"
                    style={{
                      fontFamily: 'Be Vietnam Pro',
                      fontSize: '20px',
                      lineHeight: '1.5em'
                    }}
                  >
                    {t('about.features.bookclub.title')}
                  </h3>
                  <p
                    className="text-[#4C4C4D]"
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      lineHeight: '2em'
                    }}
                  >
                    {t('about.features.bookclub.description')}
                  </p>
                </div>
              </div>
              <button
                className="w-full py-3 px-6 bg-[#F7F7F8] border border-[#F1F1F3] rounded-md text-[#262626] font-bold text-center"
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: '14px',
                  lineHeight: '1.5em'
                }}
              >
                {t('about.features.bookclub.cta')}
              </button>
            </div>

            {/* Feature 4: Set Goals (Coming Soon) */}
            <div className="bg-white rounded-lg border border-[#F1F1F3] p-5 flex flex-col gap-6">
              <div className="space-y-6">
                <div className="relative h-[266px] w-full rounded-lg overflow-hidden">
                  <Image
                    src="/about/feature-goals-26013c.png"
                    alt="Set and Track Your Goals"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h3
                    className="text-[#262626] font-semibold"
                    style={{
                      fontFamily: 'Be Vietnam Pro',
                      fontSize: '20px',
                      lineHeight: '1.5em'
                    }}
                  >
                    {t('about.features.goals.title')}
                  </h3>
                  <p
                    className="text-[#4C4C4D]"
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      lineHeight: '2em'
                    }}
                  >
                    {t('about.features.goals.description')}
                  </p>
                </div>
              </div>
              <button
                className="w-full py-3 px-6 bg-[#F7F7F8] border border-[#F1F1F3] rounded-md text-[#262626] font-bold text-center"
                style={{
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: '14px',
                  lineHeight: '1.5em'
                }}
              >
                {t('about.features.goals.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1240px] mx-auto px-8">
          <h2
            className="text-[#262626] font-semibold mb-12"
            style={{
              fontFamily: 'Be Vietnam Pro',
              fontSize: '38px',
              lineHeight: '1.5em'
            }}
          >
            {t('about.testimonials.title')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Testimonial 1: Sofia */}
            <div className="bg-white rounded-lg border border-[#F1F1F3] overflow-hidden">
              <div className="p-10">
                <p
                  className="text-[#4C4C4D]"
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: '16px',
                    fontWeight: 700,
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.testimonials.sofia.quote')}
                </p>
              </div>
              <div className="border-t border-[#F1F1F3]"></div>
              <div className="p-6 bg-[#FCFCFD] flex items-center gap-3">
                <div className="relative w-[50px] h-[50px] rounded-md overflow-hidden">
                  <Image
                    src="/about/testimonial-sofia.png"
                    alt="Sofia"
                    fill
                    className="object-cover"
                  />
                </div>
                <span
                  className="text-[#333333] font-semibold"
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: '16px',
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.testimonials.sofia.attribution')}
                </span>
              </div>
            </div>

            {/* Testimonial 2: Ayaan */}
            <div className="bg-white rounded-lg border border-[#F1F1F3] overflow-hidden">
              <div className="p-10">
                <p
                  className="text-[#4C4C4D]"
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: '16px',
                    fontWeight: 700,
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.testimonials.ayaan.quote')}
                </p>
              </div>
              <div className="border-t border-[#F1F1F3]"></div>
              <div className="p-6 bg-[#FCFCFD] flex items-center gap-3">
                <div className="relative w-[50px] h-[50px] rounded-md overflow-hidden">
                  <Image
                    src="/about/testimonial-ayaan.png"
                    alt="Ayaan"
                    fill
                    className="object-cover"
                  />
                </div>
                <span
                  className="text-[#333333] font-semibold"
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: '16px',
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.testimonials.ayaan.attribution')}
                </span>
              </div>
            </div>

            {/* Testimonial 3: Emily's Mom */}
            <div className="bg-white rounded-lg border border-[#F1F1F3] overflow-hidden">
              <div className="p-10">
                <p
                  className="text-[#4C4C4D]"
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: '16px',
                    fontWeight: 700,
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.testimonials.emily.quote')}
                </p>
              </div>
              <div className="border-t border-[#F1F1F3]"></div>
              <div className="p-6 bg-[#FCFCFD] flex items-center gap-3">
                <div className="relative w-[50px] h-[50px] rounded-md overflow-hidden">
                  <Image
                    src="/about/testimonial-emily.png"
                    alt="Emily's Mom"
                    fill
                    className="object-cover"
                  />
                </div>
                <span
                  className="text-[#333333] font-semibold"
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: '16px',
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.testimonials.emily.attribution')}
                </span>
              </div>
            </div>

            {/* Testimonial 4: David's Dad */}
            <div className="bg-white rounded-lg border border-[#F1F1F3] overflow-hidden">
              <div className="p-10">
                <p
                  className="text-[#4C4C4D]"
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: '16px',
                    fontWeight: 700,
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.testimonials.david.quote')}
                </p>
              </div>
              <div className="border-t border-[#F1F1F3]"></div>
              <div className="p-6 bg-[#FCFCFD] flex items-center gap-3">
                <div className="relative w-[50px] h-[50px] rounded-md overflow-hidden">
                  <Image
                    src="/about/testimonial-david.png"
                    alt="David's Dad"
                    fill
                    className="object-cover"
                  />
                </div>
                <span
                  className="text-[#333333] font-semibold"
                  style={{
                    fontFamily: 'Be Vietnam Pro',
                    fontSize: '16px',
                    lineHeight: '1.5em'
                  }}
                >
                  {t('about.testimonials.david.attribution')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <FooterCTA />

      {/* Footer */}
      <footer className="bg-[#8FD0AA] text-white py-12">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
            {/* Logo and Tagline */}
            <div className="space-y-6">
              <div className="flex items-center">
                <BookOpen className="h-7 w-7 text-[#608A3A]" />
                <span
                  className="ml-2 text-[#608A3A] font-semibold"
                  style={{ fontFamily: 'Poppins', fontSize: '24px', lineHeight: '36px' }}
                >
                  1001 Stories
                </span>
              </div>

              <p
                className="text-[#FAFAFA]"
                style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 500, lineHeight: '38px' }}
              >
                {t('about.footer.tagline')}
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
            <div></div>

            {/* Contact */}
            <div className="space-y-4">
              <h3
                className="text-[#FAFAFA] font-semibold"
                style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
              >
                {t('about.footer.contactTitle')}
              </h3>
              <div className="space-y-2">
                <a
                  href="mailto:info@1001stories.org"
                  className="block text-[#FAFAFA] hover:underline"
                  style={{ fontFamily: 'Inter', fontSize: '16px', fontWeight: 500, lineHeight: '19px' }}
                >
                  info@1001stories.org
                </a>
                <Link
                  href="/contact"
                  className="block text-[#FAFAFA] hover:underline"
                  style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 400, lineHeight: '24px' }}
                >
                  {t('about.footer.contactForm')}
                </Link>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#FAFAFA] mb-6"></div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p
              className="text-[#FAFAFA] font-semibold"
              style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
            >
              {t('about.footer.copyright')}
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-[#FAFAFA] hover:underline font-semibold"
                style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
              >
                {t('about.footer.privacyPolicy')}
              </Link>
              <Link
                href="/terms"
                className="text-[#FAFAFA] hover:underline font-semibold"
                style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
              >
                {t('about.footer.termsOfService')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
