'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import HorizontalAccordion from './HorizontalAccordion';
import { AccordionItemData } from './HorizontalAccordion/types';

const libraryAccordionItems: AccordionItemData[] = [
  {
    id: 'library-step1',
    stepNumber: '01',
    titleKey: 'programs.kidLibrary.accordion.step1.title',
    descriptionKey: 'programs.kidLibrary.accordion.step1.description',
    image: '/landing/library/accordion-1.png'
  },
  {
    id: 'library-step2',
    stepNumber: '02',
    titleKey: 'programs.kidLibrary.accordion.step2.title',
    descriptionKey: 'programs.kidLibrary.accordion.step2.description',
    image: '/landing/library/accordion-2.png'
  },
  {
    id: 'library-step3',
    stepNumber: '03',
    titleKey: 'programs.kidLibrary.accordion.step3.title',
    descriptionKey: 'programs.kidLibrary.accordion.step3.description',
    image: '/landing/library/accordion-3.png'
  }
];

const writeYourStoryAccordionItems: AccordionItemData[] = [
  {
    id: 'write-step1',
    stepNumber: '01',
    titleKey: 'programs.writingVolunteer.accordion.step1.title',
    descriptionKey: 'programs.writingVolunteer.accordion.step1.description',
    image: '/landing/write-your-story/accordion-1.png'
  },
  {
    id: 'write-step2',
    stepNumber: '02',
    titleKey: 'programs.writingVolunteer.accordion.step2.title',
    descriptionKey: 'programs.writingVolunteer.accordion.step2.description',
    image: '/landing/write-your-story/accordion-2.png'
  },
  {
    id: 'write-step3',
    stepNumber: '03',
    titleKey: 'programs.writingVolunteer.accordion.step3.title',
    descriptionKey: 'programs.writingVolunteer.accordion.step3.description',
    image: '/landing/write-your-story/accordion-3.png'
  }
];

const ProgramSections: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      {/* Kid Library Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1240px] mx-auto px-8">
          <div
            className="overflow-hidden"
            style={{
              borderRadius: '40px'
            }}
          >
            {/* Background Image */}
            <div
              className="bg-cover bg-center"
              style={{
                backgroundImage: 'url(/landing/kid-library-bg.png)',
                height: '367px'
              }}
            />

            {/* Horizontal Accordion */}
            <div className="px-8 md:px-12 pt-8">
              <HorizontalAccordion
                items={libraryAccordionItems}
                autoPlayInterval={5000}
              />
            </div>

            {/* Content with Overlap */}
            <div className="relative mt-8 px-8 md:px-12 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                {/* Left: Tagline + Title + Button */}
                <div className="space-y-6">
                  <p
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '32px',
                      fontWeight: 400,
                      color: '#6F6F6F',
                      lineHeight: '48px'
                    }}
                  >
                    {t('programs.kidLibrary.tagline')}
                  </p>

                  <h2
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '32px',
                      fontWeight: 700,
                      color: '#04A59D',
                      lineHeight: '48px'
                    }}
                  >
                    {t('programs.kidLibrary.title')}
                  </h2>

                  <div className="relative inline-block">
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: '#D1D5DC',
                        transform: 'translate(7px, 9.5px)',
                        zIndex: 0
                      }}
                    />
                    <Link
                      href="/library"
                      className="relative inline-flex items-center justify-center hover:opacity-90 transition-opacity shadow-md"
                      style={{
                        width: '217px',
                        height: '57.5px',
                        background: '#04A59D',
                        borderRadius: '16px',
                        fontFamily: 'Quicksand',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#F4F4F4',
                        zIndex: 1
                      }}
                    >
                      <span>{t('programs.kidLibrary.cta')}</span>
                      <ArrowUpRight className="ml-2 w-6 h-6 text-white" />
                    </Link>
                  </div>
                </div>

                {/* Right: Description Paragraphs */}
                <div className="space-y-6">
                  <p
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#6F6F6F',
                      lineHeight: '36px'
                    }}
                  >
                    {t('programs.kidLibrary.description1')}
                  </p>

                  <p
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#6F6F6F',
                      lineHeight: '36px'
                    }}
                  >
                    {t('programs.kidLibrary.description2')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Writing Volunteer Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1240px] mx-auto px-8">
          <div
            className="overflow-hidden"
            style={{
              borderRadius: '40px'
            }}
          >
            {/* Background Image */}
            <div
              className="bg-cover bg-center"
              style={{
                backgroundImage: 'url(/landing/writing-volunteer-bg.png)',
                height: '367px'
              }}
            />

            {/* Horizontal Accordion */}
            <div className="px-8 md:px-12 pt-8">
              <HorizontalAccordion
                items={writeYourStoryAccordionItems}
                autoPlayInterval={5000}
              />
            </div>

            {/* Content with Overlap */}
            <div className="relative mt-8 px-8 md:px-12 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                {/* Left: Tagline + Title + Button */}
                <div className="space-y-6">
                  <p
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '32px',
                      fontWeight: 400,
                      color: '#6F6F6F',
                      lineHeight: '48px'
                    }}
                  >
                    {t('programs.writingVolunteer.tagline')}
                  </p>

                  <h2
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '32px',
                      fontWeight: 700,
                      color: '#FCC36B',
                      lineHeight: '48px'
                    }}
                  >
                    {t('programs.writingVolunteer.title')}
                  </h2>

                  <div className="relative inline-block">
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: '#D1D5DC',
                        transform: 'translate(7px, 9.5px)',
                        zIndex: 0
                      }}
                    />
                    <Link
                      href="/programs/writing-volunteer"
                      className="relative inline-flex items-center justify-center hover:opacity-90 transition-opacity shadow-md"
                      style={{
                        width: '217px',
                        height: '57.5px',
                        background: '#FCC36B',
                        borderRadius: '16px',
                        fontFamily: 'Quicksand',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#F4F4F4',
                        zIndex: 1
                      }}
                    >
                      <span>{t('programs.writingVolunteer.cta')}</span>
                      <ArrowUpRight className="ml-2 w-6 h-6 text-white" />
                    </Link>
                  </div>
                </div>

                {/* Right: Description Paragraphs */}
                <div className="space-y-6">
                  <p
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#6F6F6F',
                      lineHeight: '36px'
                    }}
                  >
                    {t('programs.writingVolunteer.description1')}
                  </p>

                  <p
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#6F6F6F',
                      lineHeight: '36px'
                    }}
                  >
                    {t('programs.writingVolunteer.description2')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* English Learning Programs Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1240px] mx-auto px-8">
          <div
            className="overflow-hidden"
            style={{
              borderRadius: '40px'
            }}
          >
            {/* Background Image */}
            <div
              className="bg-cover bg-center"
              style={{
                backgroundImage: 'url(/landing/elp-bg.png)',
                height: '367px'
              }}
            />

            {/* Content with Overlap */}
            <div className="relative mt-8 px-8 md:px-12 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                {/* Left: Tagline + Title + Button */}
                <div className="space-y-6">
                  <p
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '32px',
                      fontWeight: 400,
                      color: '#6F6F6F',
                      lineHeight: '48px'
                    }}
                  >
                    {t('programs.englishLearning.tagline')}
                  </p>

                  <h2
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '32px',
                      fontWeight: 700,
                      color: '#608A3A',
                      lineHeight: '48px'
                    }}
                  >
                    {t('programs.englishLearning.title')}
                  </h2>

                  <div className="relative inline-block">
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: '#D1D5DC',
                        transform: 'translate(7px, 9.5px)',
                        zIndex: 0
                      }}
                    />
                    <Link
                      href="/programs/english-learning"
                      className="relative inline-flex items-center justify-center hover:opacity-90 transition-opacity shadow-md"
                      style={{
                        width: '217px',
                        height: '57.5px',
                        background: '#608A3A',
                        borderRadius: '16px',
                        fontFamily: 'Quicksand',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#F4F4F4',
                        zIndex: 1
                      }}
                    >
                      <span>{t('programs.englishLearning.cta')}</span>
                      <ArrowUpRight className="ml-2 w-6 h-6 text-white" />
                    </Link>
                  </div>
                </div>

                {/* Right: Description Paragraphs */}
                <div className="space-y-6">
                  <p
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#6F6F6F',
                      lineHeight: '36px'
                    }}
                  >
                    {t('programs.englishLearning.description1')}
                  </p>

                  <p
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#6F6F6F',
                      lineHeight: '36px'
                    }}
                  >
                    {t('programs.englishLearning.description2')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProgramSections;
