'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Heart, 
  TreePine, 
  Users, 
  BookOpen,
  GraduationCap,
  Globe,
  Target,
  CreditCard,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Star,
  Gift
} from 'lucide-react';
import Link from 'next/link';

export default function Donate() {
  const { t } = useTranslation('common');
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [isMonthly, setIsMonthly] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const donationAmounts = [10, 25, 50, 100, 250, 500];

  const impactAreas = [
    {
      icon: GraduationCap,
      title: 'Student Scholarships',
      percentage: 60,
      description: 'Provide educational opportunities for young authors and learners in underserved communities',
      impact: '$25 funds one month of learning for a student',
      color: 'blue'
    },
    {
      icon: TreePine,
      title: 'Project Reinvestment',
      percentage: 25,
      description: 'Discover and publish more children\'s stories, expanding our global library',
      impact: '$50 supports story collection and publication',
      color: 'green'
    },
    {
      icon: Globe,
      title: 'Platform Operations',
      percentage: 15,
      description: 'Keep our platform running, secure, and accessible worldwide',
      impact: '$100 maintains platform access for 1,000 users monthly',
      color: 'purple'
    }
  ];

  const donationTiers = [
    {
      amount: '$25',
      title: 'Story Supporter',
      description: 'Funds one month of learning for a student',
      benefits: ['Impact updates', 'Community access', 'Digital thank you card'],
      popular: false
    },
    {
      amount: '$50',
      title: 'Education Champion',
      description: 'Supports story collection and publication',
      benefits: ['Quarterly impact reports', 'Exclusive content access', 'Priority community features', 'Recognition on donor wall'],
      popular: true
    },
    {
      amount: '$100',
      title: 'Global Impact Partner',
      description: 'Maintains platform access for 1,000 users monthly',
      benefits: ['Annual impact report', 'Direct connection with beneficiaries', 'Beta feature access', 'Donor advisory council invitation'],
      popular: false
    },
    {
      amount: '$250+',
      title: 'Transformational Giver',
      description: 'Creates lasting change in multiple communities',
      benefits: ['VIP impact dashboard', 'Annual virtual meet & greet', 'Custom impact stories', 'Legacy recognition program'],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Monthly Donor',
      amount: '$50/month',
      quote: 'Seeing the direct impact of my donations on children\'s education is incredibly rewarding. The transparency and updates keep me connected to the cause.',
      avatar: '/images/donors/sarah.jpg'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Education Champion',
      amount: '$100/month',
      quote: 'As an educator, I believe in the power of storytelling to transform lives. This platform creates real opportunities for children globally.',
      avatar: '/images/donors/michael.jpg'
    },
    {
      name: 'Maria Rodriguez',
      role: 'Corporate Partner',
      amount: '$500/month',
      quote: 'Our company values align perfectly with 1001 Stories. We\'re proud to support education and empowerment for children worldwide.',
      avatar: '/images/donors/maria.jpg'
    }
  ];

  const impactStats = [
    { number: '2,500+', label: 'Students Supported', icon: Users },
    { number: '500+', label: 'Stories Published', icon: BookOpen },
    { number: '50+', label: 'Countries Reached', icon: Globe },
    { number: '$250K+', label: 'Total Impact Generated', icon: DollarSign }
  ];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setShowCustomAmount(false);
    setCustomAmount('');
  };

  const handleCustomAmount = () => {
    setShowCustomAmount(true);
    setSelectedAmount(0);
  };

  const getDisplayAmount = () => {
    if (showCustomAmount && customAmount) {
      return parseInt(customAmount) || 0;
    }
    return selectedAmount;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-green-100 rounded-full">
              <TreePine className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">Seeds of Empowerment</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Every contribution plants seeds of hope and opportunity for children worldwide. 
              Your donation directly funds scholarships, educational programs, and global impact initiatives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => document.getElementById('donation-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-all transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Donate Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                href="#impact"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-green-600 bg-white border-2 border-green-600 rounded-full hover:bg-green-50 transition-all"
              >
                <Target className="w-5 h-5" />
                See Our Impact
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {impactStats.map((stat, index) => (
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

      {/* How Your Donation Helps */}
      <section id="impact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How Your Donation Creates Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We reinvest 100% of revenue into our mission. See exactly how your contribution transforms lives.
            </p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto space-y-8">
            {impactAreas.map((area, index) => (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg p-8 flex flex-col lg:flex-row items-center gap-8"
              >
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-${area.color}-100 rounded-full flex-shrink-0`}>
                  <area.icon className={`w-10 h-10 text-${area.color}-600`} />
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {area.title}
                    </h3>
                    <div className="text-3xl font-bold text-blue-600">
                      {area.percentage}%
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {area.description}
                  </p>
                  <div className={`inline-flex items-center px-4 py-2 bg-${area.color}-50 text-${area.color}-700 rounded-full font-medium`}>
                    <Gift className="w-5 h-5 mr-2" />
                    {area.impact}
                  </div>
                </div>
                <div className="w-full lg:w-32">
                  <div className={`w-full h-4 bg-${area.color}-100 rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full bg-${area.color}-500 rounded-full transition-all duration-1000`}
                      style={{ width: `${area.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section id="donation-form" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Make a Donation
              </h2>
              <p className="text-xl text-gray-600">
                Choose your contribution level and help us create lasting change.
              </p>
            </motion.div>

            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
              {/* Donation Type Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-white rounded-full p-1 shadow-md">
                  <button
                    onClick={() => setIsMonthly(false)}
                    className={`px-6 py-3 rounded-full font-medium transition-all ${
                      !isMonthly 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    One-time
                  </button>
                  <button
                    onClick={() => setIsMonthly(true)}
                    className={`px-6 py-3 rounded-full font-medium transition-all ${
                      isMonthly 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {donationAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountSelect(amount)}
                    className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                      selectedAmount === amount && !showCustomAmount
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-8">
                <button
                  onClick={handleCustomAmount}
                  className={`w-full p-4 rounded-lg border-2 transition-all font-semibold ${
                    showCustomAmount
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  Other Amount
                </button>
                {showCustomAmount && (
                  <div className="mt-4">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="1"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Impact Preview */}
              {getDisplayAmount() > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-lg border border-green-200 mb-8"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Impact:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="font-bold text-blue-600">{Math.floor(getDisplayAmount() * 0.6)}</div>
                      <div className="text-gray-600">Towards Scholarships</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-600">{Math.floor(getDisplayAmount() * 0.25)}</div>
                      <div className="text-gray-600">Project Reinvestment</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="font-bold text-purple-600">{Math.floor(getDisplayAmount() * 0.15)}</div>
                      <div className="text-gray-600">Platform Operations</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Donate Button */}
              <div className="text-center">
                <button className="inline-flex items-center gap-3 px-12 py-4 bg-green-600 text-white font-semibold text-lg rounded-full hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg">
                  <CreditCard className="w-6 h-6" />
                  Donate ${getDisplayAmount()}{isMonthly ? '/month' : ''}
                  <Heart className="w-6 h-6" />
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  Secure payment powered by Stripe • Tax-deductible donation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Tiers */}
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
              Donation Recognition Tiers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our community of supporters and receive special recognition for your contribution.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {donationTiers.map((tier, index) => (
              <motion.div
                key={tier.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow ${
                  tier.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{tier.amount}</div>
                  <div className="text-xl font-semibold text-gray-900 mb-2">{tier.title}</div>
                  <div className="text-gray-600 text-sm">{tier.description}</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                
                <button className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Choose This Level
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
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
              What Our Donors Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from supporters who are making a difference in children&apos;s lives worldwide.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-green-50 p-8 rounded-xl"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role} • {testimonial.amount}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Ways to Help */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Other Ways to Support Our Mission
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Can&apos;t donate right now? There are many other ways to help us create impact for children worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/volunteer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-all transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Volunteer With Us
              </Link>
              <Link
                href="/partners"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-all"
              >
                <Users className="w-5 h-5" />
                Corporate Partnerships
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-green-600 bg-white border-2 border-green-600 rounded-full hover:bg-green-50 transition-all"
              >
                <BookOpen className="w-5 h-5" />
                Share Our Stories
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}