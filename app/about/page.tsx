'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Heart, 
  Globe, 
  BookOpen, 
  Users, 
  Target,
  Lightbulb,
  Award,
  ArrowRight 
} from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - 1001 Stories',
  description: 'Learn about our mission to empower young voices and inspire the world through children\'s stories from underserved communities.',
  keywords: 'about, mission, children, stories, education, empowerment, global',
  openGraph: {
    title: 'About 1001 Stories - Empowering Young Voices',
    description: 'Discover our journey to bring children\'s stories from around the world to global audiences.',
    url: 'https://1001stories.org/about',
    type: 'website',
  },
};

export default function About() {
  const { t } = useTranslation('common');

  const values = [
    {
      icon: Heart,
      title: 'Empowerment',
      description: 'We believe every child has a story worth telling and the potential to inspire change.'
    },
    {
      icon: Globe,
      title: 'Global Unity',
      description: 'Stories transcend borders, connecting hearts and minds across cultures and continents.'
    },
    {
      icon: BookOpen,
      title: 'Education',
      description: 'Through storytelling, we make learning engaging, accessible, and transformative.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We foster connections between volunteers, educators, and communities worldwide.'
    }
  ];

  const milestones = [
    {
      year: '2023',
      title: 'Platform Launch',
      description: 'Launched our digital platform connecting global volunteers with local communities.'
    },
    {
      year: '2023',
      title: '100+ Stories',
      description: 'Published our first 100 stories from children in 15 different countries.'
    },
    {
      year: '2024',
      title: 'Global Expansion',
      description: 'Expanded to 50+ countries with over 500 published stories and 10,000 learners.'
    },
    {
      year: '2024',
      title: 'Seeds Program',
      description: 'Launched Seeds of Empowerment, reinvesting all revenue into scholarships and programs.'
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">About 1001 Stories</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We are a global non-profit platform dedicated to discovering, publishing, and sharing 
              stories from children in underserved communities, empowering young voices to inspire the world.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Every child has a unique perspective shaped by their experiences, culture, and dreams. 
                Through 1001 Stories, we create bridges between communities, fostering understanding 
                and empathy while providing educational opportunities that transform lives.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Our platform serves as a catalyst for global connection, where stories become tools 
                for learning, volunteers become mentors, and children become the authors of their own empowerment.
              </p>
              <Link
                href="/mission"
                className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                Learn More About Our Mission
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Stories Published</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">10,000+</div>
                <div className="text-gray-600">Children Reached</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
                <div className="text-gray-600">Countries</div>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-xl">
                <div className="text-3xl font-bold text-yellow-600 mb-2">1,000+</div>
                <div className="text-gray-600">Volunteers</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do, from how we interact with communities 
              to how we develop our platform and programs.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full">
                  <value.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a simple idea to a global movement, here are the key milestones 
              that have shaped our impact on children's education and empowerment.
            </p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center mb-12 last:mb-0"
              >
                <div className="flex-shrink-0 w-20 text-right mr-8">
                  <div className="text-2xl font-bold text-blue-600">{milestone.year}</div>
                </div>
                <div className="flex-shrink-0 w-4 h-4 bg-blue-600 rounded-full mr-8 relative">
                  {index !== milestones.length - 1 && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-20 bg-blue-200"></div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {milestone.title}
                  </h3>
                  <p className="text-gray-600">
                    {milestone.description}
                  </p>
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
              Join Our Mission
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Whether you're a teacher, volunteer, institution, or simply someone who believes 
              in the power of children's voices, there's a place for you in our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/volunteer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Become a Volunteer
              </Link>
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Support Our Mission
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}