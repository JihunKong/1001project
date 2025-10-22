import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import HomePageNavigation from '@/components/ui/HomePageNavigation';
import FooterCTA from '@/components/landing/FooterCTA';

export default function AboutPage() {
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
              1001 Stories,
            </h1>
            <h2
              className="text-[#FAFAFA] font-semibold"
              style={{
                fontFamily: 'Poppins',
                fontSize: '24px',
                lineHeight: '1.5em'
              }}
            >
              Empowering Communities through Storytelling
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
              A global citizenship platform for young learners, brining stories from under-resourced communities to the world
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
              Who We Are
            </h2>
            <p
              className="text-[#2B2B2B] font-bold"
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                lineHeight: '1.5em'
              }}
            >
              Seeds of Empowerment and the 1001 Stories Project
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
                  Seeds of Empowerment
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
                  SOE is a non-profit organization dedicated to empowering underserved communities through education, storytelling, and technology. By supporting grassroots projects round the world, they help amplify local voices and foster sustainable development.
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
                  1001 Stories Project
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
                  Our mobile storytelling program, 1001 Stories, brings meaningful learning to some of the hardest to reach populations around the world. We aim to facilitate the creation, development, and gathering of 1001 empowering stories from every participating local community.
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
              Benefits
            </h2>
            <p
              className="text-[#2B2B2B] font-bold"
              style={{
                fontFamily: 'Inter',
                fontSize: '16px',
                lineHeight: '19px'
              }}
            >
              Why Join 1001 Stories?
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
                  Promote Global Citizenship and Literacy
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
                  Through storytelling and cultural exchange, 1001 Stories fosters global citizenship education, helping children around the world develop reading and writing skills. By publishing and sharing their stories on a global stage, we amplify young voices and inspire cross-cultural understanding.
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
                  Empower Young Learners Everywhere
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
                  We raise awareness about diverse experiences and support children&apos;s dreams by offering scholarships and creating accessible educational opportunities. Our self-sustaining platform is designed to empower all young learners, regardless of their backgrounds, to thrive and grow.
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
                  Integrate AI and Personalized Learning
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
                  By combining storybooks with AI-powered tools, 1001 Stories offers personalized learning experiences tailored to each student&apos;s journey. Our platform nurtures creativity, builds practical AI literacy skills, and prepares young minds for an increasingly connected and digital future.
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
              Our Features
            </h2>
            <p
              className="text-[#2B2B2B] font-bold"
              style={{
                fontFamily: 'Inter',
                fontSize: '16px',
                lineHeight: '13px'
              }}
            >
              More exciting features are on the way. Stay tuned!
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
                    📖 Browse the 1001 Stories Library
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
                    Discover stories written by young authors around the world. Explore different cultures, perspectives, and dreams through storytelling.
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
                Learn More
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
                    📝 Write Your Story
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
                    Share your voice with the world! Write and submit your own story, inspire others, and become part of our global library.
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
                Learn More
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
                    📚 Join a Book Club (Coming Soon)
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
                    Find and join book clubs that match your interests. Read together, discuss ideas, and connect with young storytellers across the globe.
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
                Learn More
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
                    🎯 Set and Track Your Goals (Coming Soon)
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
                    Start with a quick assessment to personalize your journey. Set learning goals based on your interests and track your progress as you grow.
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
                Learn More
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
            Our Testimonials
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
                  Before 1001 Stories, I was too shy to share my writing. Now, my story is published for everyone to read! I feel like my voice matters, and I want to write even more
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
                  Sofia, Student (10)
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
                  I love reading stories from kids in other countries. It feels like I&apos;m making new friends from around the world. 1001 Stories makes learning so much fun!
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
                  Ayaan, Student (11)
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
                  1001 Stories gave my daughter the confidence to express herself creatively. Watching her set goals, complete her first story, and proudly share it was an unforgettable moment for our family
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
                  Emily&apos;s Mom
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
                  As a parent, I wanted something educational but also inspiring. 1001 Stories struck the perfect balance—helping my son develop literacy skills while encouraging him to think globally and dream big.
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
                  David&apos;s Dad
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
                Empowering young voices and inspiring the world through stories.
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
                Contact
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
                  Contact Form
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
              ©2024 1001 Stories. All rights reserved
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-[#FAFAFA] hover:underline font-semibold"
                style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-[#FAFAFA] hover:underline font-semibold"
                style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
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
