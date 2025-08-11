'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Heart, 
  Target, 
  MessageCircle,
  BookOpen,
  Globe,
  Award,
  Clock,
  CheckCircle,
  ArrowRight,
  Calendar,
  Lightbulb,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentorship Program - 1001 Stories',
  description: 'Connect with global mentors and support young storytellers through our comprehensive mentorship program.',
  keywords: 'mentorship, guidance, support, storytelling, young authors, global network',
  openGraph: {
    title: 'Mentorship Program - 1001 Stories',
    description: 'Join our mentorship network to guide and inspire the next generation of storytellers.',
    url: 'https://1001stories.org/programs/mentorship',
    type: 'website',
  },
};

export default function MentorshipProgram() {
  const { t } = useTranslation('common');

  const programTypes = [
    {
      title: 'Young Author Mentorship',
      description: 'One-on-one guidance for children developing their storytelling skills',
      duration: '6 months',
      commitment: '2 hours/week',
      age: '8-16 years',
      icon: BookOpen,
      color: 'blue'
    },
    {
      title: 'Creative Writing Circles',
      description: 'Small group mentorship focused on creative writing techniques',
      duration: '3 months',
      commitment: '1.5 hours/week',
      age: '12-18 years',
      icon: Users,
      color: 'green'
    },
    {
      title: 'Digital Storytelling',
      description: 'Learn multimedia storytelling with technology integration',
      duration: '4 months',
      commitment: '3 hours/week',
      age: '14-20 years',
      icon: Globe,
      color: 'purple'
    },
    {
      title: 'Publishing Pathway',
      description: 'Guide young authors through the story publication process',
      duration: '8 months',
      commitment: '2.5 hours/week',
      age: '16-22 years',
      icon: Award,
      color: 'orange'
    }
  ];

  const mentorBenefits = [
    {
      icon: Heart,
      title: 'Make Real Impact',
      description: 'Directly influence a young person\'s creative development and confidence'
    },
    {
      icon: Globe,
      title: 'Global Connections',
      description: 'Connect with mentees from diverse cultures and backgrounds worldwide'
    },
    {
      icon: Lightbulb,
      title: 'Develop Skills',
      description: 'Enhance your leadership, communication, and teaching abilities'
    },
    {
      icon: Users,
      title: 'Join Community',
      description: 'Be part of a supportive network of experienced mentors and educators'
    }
  ];

  const menteeBenefits = [
    {
      icon: BookOpen,
      title: 'Personalized Guidance',
      description: 'Receive tailored feedback and support for your unique storytelling journey'
    },
    {
      icon: Target,
      title: 'Skill Development',
      description: 'Improve writing, creativity, and communication skills through expert guidance'
    },
    {
      icon: Award,
      title: 'Publication Opportunities',
      description: 'Get support to publish your stories on our global platform'
    },
    {
      icon: MessageCircle,
      title: 'Cultural Exchange',
      description: 'Learn from mentors with diverse backgrounds and experiences'
    }
  ];

  const process = [
    {
      step: '1',
      title: 'Application',
      description: 'Submit your application with background information and goals',
      icon: Target
    },
    {
      step: '2',
      title: 'Matching',
      description: 'Our team carefully matches mentors and mentees based on interests and goals',
      icon: Users
    },
    {
      step: '3',
      title: 'Orientation',
      description: 'Participate in program orientation and establish mentorship guidelines',
      icon: BookOpen
    },
    {
      step: '4',
      title: 'Begin Journey',
      description: 'Start regular mentorship sessions and work toward your storytelling goals',
      icon: ArrowRight
    }
  ];

  const successStories = [
    {
      name: 'Sarah Chen',
      age: 15,
      country: 'Canada',
      story: 'Published 3 stories and won regional writing competition',
      mentor: 'Dr. Amanda Rodriguez, Published Author',
      quote: 'My mentor helped me find my unique voice and gave me confidence to share my stories with the world.'
    },
    {
      name: 'Miguel Santos',
      age: 17,
      country: 'Brazil',
      story: 'Created multimedia story series about Amazon rainforest',
      mentor: 'James Wilson, Documentary Filmmaker',
      quote: 'Through mentorship, I learned to combine my passion for nature with storytelling technology.'
    },
    {
      name: 'Amina Hassan',
      age: 14,
      country: 'Kenya',
      story: 'Developed poetry workshop for local school',
      mentor: 'Prof. Lisa Thompson, Creative Writing',
      quote: 'My mentor showed me how to use poetry to express my culture and inspire other young writers.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-blue-100 rounded-full">
              <Heart className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">Mentorship Program</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect passionate mentors with aspiring young storytellers to create meaningful 
              relationships that inspire creativity, build confidence, and shape the future of storytelling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                Become a Mentor
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-all"
              >
                Find a Mentor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Program Types */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Mentorship Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our specialized mentorship tracks designed to support different aspects of storytelling and creative development.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {programTypes.map((program, index) => (
              <motion.div
                key={program.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-${program.color}-100 rounded-lg flex-shrink-0`}>
                    <program.icon className={`w-8 h-8 text-${program.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {program.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {program.description}
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Duration</div>
                        <div className="text-gray-600">{program.duration}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Commitment</div>
                        <div className="text-gray-600">{program.commitment}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Age Range</div>
                        <div className="text-gray-600">{program.age}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                    Learn More
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Mentors */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Become a Mentor?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our community of dedicated mentors and experience the rewards of guiding young creative minds.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mentorBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center bg-white p-6 rounded-xl shadow-md"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
                  <benefit.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Mentees */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Benefits for Young Writers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how our mentorship program can accelerate your creative growth and storytelling journey.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {menteeBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
                  <benefit.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with our mentorship program is simple and straightforward.
            </p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {process.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-600 rounded-full text-white font-bold text-xl">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                  {index < process.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-200 transform -translate-x-1/2"></div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our mentorship program has helped young writers achieve their creative goals.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{story.quote}"
                </blockquote>
                <div className="border-t border-gray-200 pt-4">
                  <div className="font-semibold text-gray-900">{story.name}, {story.age}</div>
                  <div className="text-sm text-gray-600 mb-2">{story.country}</div>
                  <div className="text-sm text-blue-600 font-medium mb-2">Achievement: {story.story}</div>
                  <div className="text-xs text-gray-500">Mentored by: {story.mentor}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Start Your Mentorship Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Whether you're looking to guide young writers or seeking creative guidance yourself, 
              our mentorship program connects passionate storytellers across the globe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Apply as Mentor
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Find a Mentor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}