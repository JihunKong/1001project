'use client';

import { motion } from 'framer-motion';
import { Heart, Globe, Users, BookOpen, Star, Target, Award } from 'lucide-react';
import Link from 'next/link';

const teamMembers = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'Executive Director',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Leading educational initiatives for 15+ years'
  },
  {
    name: 'Michael Chen',
    role: 'Program Director', 
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Passionate about cross-cultural education'
  },
  {
    name: 'Ana Martinez',
    role: 'Community Outreach',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    bio: 'Connecting communities worldwide'
  }
];

const milestones = [
  { year: '2020', achievement: 'Founded 1001 Stories platform' },
  { year: '2021', achievement: 'Reached 1,000 students' },
  { year: '2022', achievement: 'Expanded to 25 countries' },
  { year: '2023', achievement: 'Launched ESL program' },
  { year: '2024', achievement: '10,000+ active users' }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-yellow-50/30 to-white" />
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=1920&h=1080&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              About <span className="text-brand-primary">1001 Stories</span>
            </h1>
            <p className="text-xl text-gray-600">
              Empowering young voices and inspiring the world through the power of storytelling
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                1001 Stories is a global education platform dedicated to discovering, publishing, 
                and sharing stories from children in underserved communities. We believe every 
                child has a story worth telling and a voice that deserves to be heard.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Through our platform, we connect young storytellers with readers worldwide, 
                fostering cross-cultural understanding and empowering the next generation of 
                global citizens.
              </p>
              <div className="flex gap-4">
                <Link href="/library" className="btn-brand-primary">
                  Explore Stories
                </Link>
                <Link href="/volunteer" className="btn-brand-secondary">
                  Get Involved
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="/seeds-of-empowerment-logo.png" 
                alt="Seeds of Empowerment" 
                className="w-full max-w-md mx-auto"
              />
              <div className="absolute -bottom-4 -right-4 bg-yellow-100 rounded-2xl p-6 shadow-lg">
                <Star className="w-8 h-8 text-button-yellow mb-2" />
                <p className="font-bold text-2xl text-gray-900">10,000+</p>
                <p className="text-gray-600">Stories Shared</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Our Impact</h2>
            <p className="text-xl text-gray-600">Transforming education one story at a time</p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {[
              { icon: BookOpen, value: '500+', label: 'Stories Published' },
              { icon: Users, value: '10K+', label: 'Students Reached' },
              { icon: Globe, value: '50+', label: 'Countries' },
              { icon: Heart, value: '100+', label: 'Volunteers' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <stat.icon className="w-10 h-10 text-brand-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          
          {/* Timeline */}
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Our Journey</h3>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4"
                >
                  <div className="w-20 text-right font-bold text-brand-primary">
                    {milestone.year}
                  </div>
                  <div className="w-4 h-4 bg-button-yellow rounded-full flex-shrink-0" />
                  <div className="flex-1 bg-white p-4 rounded-lg shadow">
                    {milestone.achievement}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Our Team</h2>
            <p className="text-xl text-gray-600">Dedicated professionals working for global education</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-4 mx-auto w-48 h-48">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-brand-primary font-medium mb-2">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
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
              Join Our Mission
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Be part of a global movement to empower young voices and transform education
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-brand-primary text-lg px-8 py-4">
                Get Started Today
              </Link>
              <Link href="/donate" className="btn-brand-secondary text-lg px-8 py-4">
                Support Our Cause
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}