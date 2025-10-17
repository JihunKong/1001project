'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Users, BookOpen, Globe, Award } from 'lucide-react';

interface ImpactMetric {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}

const impactMetrics: ImpactMetric[] = [
  {
    icon: BookOpen,
    value: '1,200+',
    label: 'Stories Published',
    color: 'text-blue-600'
  },
  {
    icon: Users,
    value: '15,000+',
    label: 'Students Reached',
    color: 'text-green-600'
  },
  {
    icon: Globe,
    value: '50+',
    label: 'Countries',
    color: 'text-purple-600'
  },
  {
    icon: Award,
    value: '98%',
    label: 'Satisfaction Rate',
    color: 'text-orange-600'
  }
];

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Elementary Teacher, USA',
    content: '1001 Stories transformed my classroom. Students are more engaged with cultural learning than ever before.',
    rating: 5
  },
  {
    id: 2,
    name: 'Miguel Rodriguez',
    role: 'Parent, Mexico',
    content: 'My daughter loves the diverse stories and AI learning tools. She&apos;s reading at a higher level now.',
    rating: 5
  },
  {
    id: 3,
    name: 'Amina Hassan',
    role: 'Student Writer, Kenya',
    content: 'I published my first story here and received amazing feedback. It inspired me to keep writing!',
    rating: 5
  }
];

const SocialProof: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Impact Metrics */}
        <motion.div
          className="mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Our Global Impact
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {impactMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <metric.icon className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${metric.color}`} aria-hidden="true" />
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </div>
                <div className="text-sm sm:text-base text-gray-600">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Our Community Says
          </h2>
          <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of educators, students, and writers who are transforming education through storytelling.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="bg-white p-6 sm:p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Rating Stars */}
                <div className="flex mb-4" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" aria-hidden="true" />
                  ))}
                </div>

                {/* Testimonial Content */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author Info */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Partner Logos (Optional - can add later) */}
        <motion.div
          className="mt-16 sm:mt-20 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm text-gray-500 mb-6 uppercase tracking-wider">
            Trusted by Educational Institutions Worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 opacity-60">
            {/* Placeholder for partner logos - replace with actual logos */}
            <div className="text-2xl font-bold text-gray-400">Partner Logo</div>
            <div className="text-2xl font-bold text-gray-400">Partner Logo</div>
            <div className="text-2xl font-bold text-gray-400">Partner Logo</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
