'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Heart, 
  Globe, 
  Users, 
  BookOpen,
  Palette,
  Translate,
  GraduationCap,
  Code,
  Camera,
  MessageCircle,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  Award,
  Target,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Volunteer Hub - 1001 Stories',
  description: 'Join our global network of volunteers. Share your skills in translation, illustration, teaching, and more to empower children worldwide.',
  keywords: 'volunteer, global, education, translation, illustration, teaching, community',
  openGraph: {
    title: 'Volunteer Hub - 1001 Stories',
    description: 'Make a difference in children\'s lives through volunteering. Find your perfect project match.',
    url: 'https://1001stories.org/volunteer',
    type: 'website',
  },
};

// Mock volunteer opportunities
const opportunities = [
  {
    id: '1',
    title: 'Story Translator',
    category: 'Translation',
    icon: Translate,
    location: 'Remote',
    timeCommitment: '3-5 hours/week',
    urgency: 'high',
    volunteers: 12,
    maxVolunteers: 15,
    skills: ['Spanish', 'English', 'Cultural sensitivity'],
    description: 'Help translate children\'s stories from Spanish to English, making them accessible to a global audience.',
    impact: '50+ stories translated monthly'
  },
  {
    id: '2',
    title: 'Children\'s Book Illustrator',
    category: 'Art & Design',
    icon: Palette,
    location: 'Remote',
    timeCommitment: '5-8 hours/week',
    urgency: 'medium',
    volunteers: 8,
    maxVolunteers: 12,
    skills: ['Digital illustration', 'Children\'s art', 'Adobe Creative Suite'],
    description: 'Create beautiful illustrations for children\'s stories from around the world.',
    impact: '20+ stories illustrated monthly'
  },
  {
    id: '3',
    title: 'Online English Tutor',
    category: 'Teaching',
    icon: GraduationCap,
    location: 'Remote',
    timeCommitment: '2-4 hours/week',
    urgency: 'high',
    volunteers: 25,
    maxVolunteers: 40,
    skills: ['English fluency', 'Teaching experience', 'Patience with children'],
    description: 'Provide one-on-one English tutoring sessions for children in our partner communities.',
    impact: '100+ students supported monthly'
  },
  {
    id: '4',
    title: 'Platform Developer',
    category: 'Technology',
    icon: Code,
    location: 'Remote',
    timeCommitment: '8-10 hours/week',
    urgency: 'medium',
    volunteers: 5,
    maxVolunteers: 8,
    skills: ['React', 'Node.js', 'TypeScript', 'Database design'],
    description: 'Help develop and maintain our digital platform, improving user experience and functionality.',
    impact: 'Platform serving 10,000+ users'
  },
  {
    id: '5',
    title: 'Content Creator',
    category: 'Media',
    icon: Camera,
    location: 'Remote',
    timeCommitment: '4-6 hours/week',
    urgency: 'low',
    volunteers: 6,
    maxVolunteers: 10,
    skills: ['Video editing', 'Photography', 'Social media', 'Storytelling'],
    description: 'Create engaging content to share our stories and mission across social media platforms.',
    impact: '50,000+ people reached monthly'
  },
  {
    id: '6',
    title: 'Community Moderator',
    category: 'Community',
    icon: MessageCircle,
    location: 'Remote',
    timeCommitment: '3-5 hours/week',
    urgency: 'medium',
    volunteers: 15,
    maxVolunteers: 20,
    skills: ['Communication', 'Conflict resolution', 'Cultural awareness'],
    description: 'Help moderate our online community spaces, fostering positive interactions and learning.',
    impact: '2,000+ community members supported'
  }
];

const skillAreas = [
  {
    icon: Translate,
    title: 'Translation & Language',
    description: 'Bridge language barriers to share stories globally',
    skills: ['Translation', 'Interpretation', 'Proofreading', 'Cultural adaptation']
  },
  {
    icon: Palette,
    title: 'Art & Illustration',
    description: 'Bring stories to life with beautiful visuals',
    skills: ['Digital illustration', 'Character design', 'Book layout', 'Animation']
  },
  {
    icon: GraduationCap,
    title: 'Education & Teaching',
    description: 'Empower young minds through learning',
    skills: ['ESL teaching', 'Curriculum design', 'Mentoring', 'Workshop facilitation']
  },
  {
    icon: Code,
    title: 'Technology & Development',
    description: 'Build the platform that connects us all',
    skills: ['Web development', 'Mobile apps', 'UX/UI design', 'Data analysis']
  }
];

const impact = [
  { number: '1,000+', label: 'Active Volunteers', icon: Users },
  { number: '50+', label: 'Countries Represented', icon: Globe },
  { number: '500+', label: 'Stories Published', icon: BookOpen },
  { number: '10,000+', label: 'Children Reached', icon: Heart }
];

export default function Volunteer() {
  const { t } = useTranslation('common');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCommitment, setSelectedCommitment] = useState('All');

  const categories = ['All', 'Translation', 'Art & Design', 'Teaching', 'Technology', 'Media', 'Community'];
  const commitments = ['All', '2-4 hours/week', '3-5 hours/week', '5-8 hours/week', '8-10 hours/week'];

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesCategory = selectedCategory === 'All' || opp.category === selectedCategory;
    const matchesCommitment = selectedCommitment === 'All' || opp.timeCommitment === selectedCommitment;
    return matchesCategory && matchesCommitment;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-red-100 rounded-full">
              <Heart className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">{t('volunteer.title')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('volunteer.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#opportunities"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-all transform hover:scale-105"
              >
                Browse Projects
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-red-600 bg-white border-2 border-red-600 rounded-full hover:bg-red-50 transition-all transform hover:scale-105"
              >
                Join Our Community
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Together We Make Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of volunteers who are making a real difference in children's education worldwide.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {impact.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Areas */}
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
              Where You Can Help
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We need diverse talents and skills to support our mission. Find where your expertise can make the biggest impact.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {skillAreas.map((area, index) => (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full">
                  <area.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {area.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {area.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {area.skills.slice(0, 2).map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    +{area.skills.length - 2} more
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Opportunities */}
      <section id="opportunities" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Current Volunteer Opportunities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find the perfect project that matches your skills, schedule, and passion.
            </p>
          </motion.div>

          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-12">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Commitment</label>
              <select
                value={selectedCommitment}
                onChange={(e) => setSelectedCommitment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {commitments.map(commitment => (
                  <option key={commitment} value={commitment}>{commitment}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Opportunities Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredOpportunities.map((opp, index) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                      <opp.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{opp.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {opp.location}
                        <span>•</span>
                        <Clock className="w-4 h-4" />
                        {opp.timeCommitment}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUrgencyColor(opp.urgency)}`}>
                    {opp.urgency} priority
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{opp.description}</p>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Required Skills:</div>
                  <div className="flex flex-wrap gap-2">
                    {opp.skills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {opp.volunteers}/{opp.maxVolunteers} volunteers
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                    <Target className="w-4 h-4" />
                    {opp.impact}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Learn More
                  </button>
                  <button className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {t('volunteer.apply')}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-pink-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <Award className="w-16 h-16 text-yellow-300 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-red-100 mb-8">
              Join our global community of changemakers and help empower the next generation 
              of storytellers, thinkers, and leaders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-red-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Start Volunteering Today
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-red-600 transition-all transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                Have Questions?
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}