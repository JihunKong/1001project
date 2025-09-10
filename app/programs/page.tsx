'use client';

import { motion } from 'framer-motion';
import { Globe, BookOpenCheck, Users, Handshake, Target, Award } from 'lucide-react';
import Link from 'next/link';

const programs = [
  {
    id: 'PARTNERSHIP_NETWORK',
    title: 'Partnership Network',
    description: 'Connect with schools, NGOs, companies, and universities worldwide to expand educational opportunities.',
    icon: Handshake,
    color: 'text-primary-green',
    bgColor: 'bg-green-50',
    features: [
      'Global institutional partnerships',
      'Resource sharing programs',
      'Cross-cultural exchanges',
      'Joint curriculum development',
      'NGO collaboration opportunities',
      'Corporate partnership programs'
    ],
    stats: {
      partners: '150+',
      countries: '25+',
      students: '10,000+'
    }
  },
  {
    id: 'ENGLISH_EDUCATION',
    title: 'English Education',
    description: 'Comprehensive ESL programs for teachers, students, and mentors to advance English language learning.',
    icon: BookOpenCheck,
    color: 'text-primary-green',
    bgColor: 'bg-yellow-50',
    features: [
      'Teacher training programs',
      'Student learning pathways',
      'Mentor support networks',
      'AI-powered learning tools',
      'Vocabulary building exercises',
      'Pronunciation practice'
    ],
    stats: {
      teachers: '500+',
      students: '15,000+',
      completion: '85%'
    }
  },
  {
    id: 'MENTORSHIP',
    title: 'Mentorship Program',
    description: 'Connect experienced professionals with newcomers across various expertise domains for guidance and growth.',
    icon: Users,
    color: 'text-primary-green',
    bgColor: 'bg-blue-50',
    features: [
      'One-on-one mentoring',
      'Professional development',
      'Cross-domain expertise sharing',
      'Flexible meeting schedules',
      'Community support networks',
      'Progress tracking tools'
    ],
    stats: {
      mentors: '200+',
      domains: '15+',
      satisfaction: '95%'
    }
  }
];

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-yellow-50/30 to-white" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              Our <span className="text-brand-primary">Programs</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Comprehensive initiatives designed to empower educators, students, and communities worldwide
            </p>
            
            <div className="flex justify-center gap-4">
              <Link href="/programs/apply" className="btn-brand-primary">
                Apply to Programs
              </Link>
              <Link href="/contact" className="btn-brand-secondary">
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {programs.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className={`p-8 ${program.bgColor}`}>
                  <program.icon className={`w-12 h-12 ${program.color} mb-4`} />
                  <h2 className="text-2xl font-bold mb-3">{program.title}</h2>
                  <p className="text-gray-600">{program.description}</p>
                </div>
                
                <div className="p-8">
                  <h3 className="font-semibold mb-4">Key Features</h3>
                  <ul className="space-y-2 mb-6">
                    {program.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Target className="w-4 h-4 text-brand-primary mt-1 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-3 text-sm">Program Impact</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(program.stats).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-lg font-bold text-brand-primary">{value}</div>
                          <div className="text-xs text-gray-500 capitalize">{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Link
                    href={`/programs/apply?program=${program.id}`}
                    className="btn-brand-accent w-full mt-6 text-center"
                  >
                    Apply Now
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <Award className="w-16 h-16 text-brand-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">
              Ready to Make an Impact?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of educators and volunteers who are transforming education worldwide
            </p>
            <Link href="/programs/apply" className="btn-brand-primary text-lg px-8 py-4">
              Apply to Programs
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}