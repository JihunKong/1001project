'use client';

import React from 'react';
import ScrollAnimatedContainer from './ScrollAnimatedContainer';

interface AnimatedFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor?: string;
  iconBgColor?: string;
  animationDelay?: number;
}

export default function AnimatedFeatureCard({
  icon,
  title,
  description,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  animationDelay = 0
}: AnimatedFeatureCardProps) {
  return (
    <ScrollAnimatedContainer
      animationType="slideUp"
      delay={animationDelay}
      duration={600}
      className="group"
    >
      <div className="relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:transform hover:scale-105 hover:-translate-y-2 overflow-hidden">
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-success-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Content */}
        <div className="relative text-center">
          <ScrollAnimatedContainer
            animationType="scaleIn"
            delay={animationDelay + 200}
            className="relative"
          >
            <div className={`w-20 h-20 ${iconBgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
              <div className={`${iconColor} group-hover:scale-110 transition-transform duration-300`}>
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

        {/* Decorative element */}
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-primary-200 to-success-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-accent-200 to-secondary-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
      </div>
    </ScrollAnimatedContainer>
  );
}