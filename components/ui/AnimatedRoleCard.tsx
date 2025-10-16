'use client';

import Link from 'next/link';
import React from 'react';
import ScrollAnimatedContainer from './ScrollAnimatedContainer';

interface AnimatedRoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  iconColor: string;
  bgColor: string;
  animationDelay?: number;
}

export default function AnimatedRoleCard({
  icon,
  title,
  description,
  features,
  ctaText,
  ctaHref,
  iconColor,
  bgColor,
  animationDelay = 0
}: AnimatedRoleCardProps) {
  return (
    <ScrollAnimatedContainer
      animationType="slideUp"
      delay={animationDelay}
      duration={700}
      className="group h-full"
    >
      <div className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] overflow-hidden border border-gray-100 hover:border-gray-200 h-full flex flex-col">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-success-100"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200 to-success-200 rounded-full opacity-30 transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-accent-200 to-secondary-200 rounded-full opacity-30 transform -translate-x-12 translate-y-12"></div>
        </div>

        <div className="relative p-8 flex-1 flex flex-col">
          {/* Icon and Header */}
          <div className="text-center mb-8">
            <ScrollAnimatedContainer
              animationType="scaleIn"
              delay={animationDelay + 200}
              className="relative"
            >
              <div className={`w-20 h-20 ${iconColor} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 backdrop-blur-sm`}>
                <div className="text-white group-hover:scale-110 transition-transform duration-300">
                  {icon}
                </div>
              </div>
            </ScrollAnimatedContainer>

            <ScrollAnimatedContainer
              animationType="fadeIn"
              delay={animationDelay + 400}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary-700 transition-colors duration-300">
                {title}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg font-light group-hover:text-gray-900 transition-colors duration-300">
                {description}
              </p>
            </ScrollAnimatedContainer>
          </div>

          {/* Features List */}
          <ScrollAnimatedContainer
            animationType="slideUp"
            delay={animationDelay + 600}
            className="flex-1 mb-8"
          >
            <div className="space-y-4">
              {features.map((feature, index) => (
                <ScrollAnimatedContainer
                  key={index}
                  animationType="slideInLeft"
                  delay={animationDelay + 700 + (index * 100)}
                >
                  <div className="flex items-start gap-3 text-left group-hover:transform group-hover:translate-x-1 transition-transform duration-300">
                    <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-br from-primary-400 to-success-400 rounded-full mt-2.5 group-hover:scale-125 transition-transform duration-300"></div>
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300 font-medium">
                      {feature}
                    </span>
                  </div>
                </ScrollAnimatedContainer>
              ))}
            </div>
          </ScrollAnimatedContainer>

          {/* CTA Button */}
          <ScrollAnimatedContainer
            animationType="slideUp"
            delay={animationDelay + 800}
          >
            <Link
              href={ctaHref}
              className={`block w-full ${bgColor} text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:brightness-110 focus:ring-4 focus:ring-opacity-50 focus:outline-none`}
            >
              <span className="flex items-center justify-center gap-2">
                {ctaText}
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </ScrollAnimatedContainer>
        </div>

        {/* Subtle border glow on hover */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-200 via-success-200 to-accent-200 opacity-20"></div>
        </div>
      </div>
    </ScrollAnimatedContainer>
  );
}