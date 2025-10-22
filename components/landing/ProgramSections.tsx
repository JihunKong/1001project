'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const ProgramSections: React.FC = () => {
  return (
    <>
      {/* English Learning Programs Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1495px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Left */}
            <div className="relative h-[700px]">
              <Image
                src="/landing/elp-illustration.svg"
                alt="English Learning Programs"
                fill
                className="object-contain"
              />
            </div>

            {/* Content Right */}
            <div className="space-y-6 max-w-[441px]">
              <h2
                className="text-[#608A3A] font-bold"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '32px',
                  lineHeight: '48px'
                }}
              >
                English Learning Programs
              </h2>

              <p
                className="text-[#2B2B2B]"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '24px'
                }}
              >
                Learn English through stories that inspire. Our program lets children explore language, culture, and imagination while building real communication skills.
              </p>

              <Link
                href="/programs/english-learning"
                className="inline-flex items-center justify-center px-8 py-3 bg-[#608A3A] hover:opacity-90 text-white rounded-2xl shadow-md transition-opacity group relative"
                style={{
                  fontFamily: 'Quicksand',
                  fontSize: '16px',
                  fontWeight: 700,
                  lineHeight: '20px',
                  width: '217px',
                  height: '57.5px'
                }}
              >
                <div className="absolute inset-0 bg-[#D1D5DC] rounded-2xl translate-x-1.5 translate-y-2 -z-10"></div>
                <span className="text-[#F4F4F4]">Learn More</span>
                <ArrowUpRight className="ml-2 w-6 h-6 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Writing Volunteer Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1495px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content Left */}
            <div className="space-y-6 max-w-[441px] lg:order-1">
              <h2
                className="text-[#FCC36B] font-bold"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '32px',
                  lineHeight: '48px'
                }}
              >
                Writing Volunteer
              </h2>

              <p
                className="text-[#2B2B2B]"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '24px'
                }}
              >
                Write a story, make an impact. Through Writing Volunteer, students become young authors while earning a Volunteer Certificate they can proudly share with schools and organizations.
              </p>

              <Link
                href="/programs/writing-volunteer"
                className="inline-flex items-center justify-center px-8 py-3 bg-[#FCC36B] hover:opacity-90 text-white rounded-2xl shadow-md transition-opacity group relative"
                style={{
                  fontFamily: 'Quicksand',
                  fontSize: '16px',
                  fontWeight: 700,
                  lineHeight: '20px',
                  width: '217px',
                  height: '57.5px'
                }}
              >
                <div className="absolute inset-0 bg-[#D1D5DC] rounded-2xl translate-x-1.5 translate-y-2 -z-10"></div>
                <span className="text-[#F4F4F4]">Learn More</span>
                <ArrowUpRight className="ml-2 w-6 h-6 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            {/* Image Right */}
            <div className="relative h-[700px] lg:order-2">
              <Image
                src="/landing/writing-volunteer-illustration.svg"
                alt="Writing Volunteer"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Kid Library Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1533px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Left */}
            <div className="relative h-[700px]">
              <Image
                src="/landing/kid-library-illustration.svg"
                alt="Kid Library"
                fill
                className="object-contain"
              />
            </div>

            {/* Content Right */}
            <div className="space-y-6 max-w-[478px]">
              <h2
                className="text-[#04A59D] font-bold"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '32px',
                  lineHeight: '48px'
                }}
              >
                Kid Library
              </h2>

              <p
                className="text-[#2B2B2B]"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '24px'
                }}
              >
                Kid Library is a global story collection where children can read and listen to stories written by kids from different cultures. It&apos;s a place to discover diverse voices, learn empathy, and explore the world through storytelling.
              </p>

              <Link
                href="/library"
                className="inline-flex items-center justify-center px-8 py-3 bg-[#04A59D] hover:opacity-90 text-white rounded-2xl shadow-md transition-opacity group relative"
                style={{
                  fontFamily: 'Quicksand',
                  fontSize: '16px',
                  fontWeight: 700,
                  lineHeight: '20px',
                  width: '217px',
                  height: '57.5px'
                }}
              >
                <div className="absolute inset-0 bg-[#D1D5DC] rounded-2xl translate-x-1.5 translate-y-2 -z-10"></div>
                <span className="text-[#F4F4F4]">Explore Library</span>
                <ArrowUpRight className="ml-2 w-6 h-6 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProgramSections;
