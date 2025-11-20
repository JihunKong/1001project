'use client';

import { BookOpen, Users, Globe, Baby } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function OutcomeStatistics() {
  const { t } = useTranslation();

  const statistics = [
    {
      icon: BookOpen,
      number: '500+',
      label: t('outcomeStats.storiesPublished'),
    },
    {
      icon: Baby,
      number: '10K',
      label: t('outcomeStats.childrenReached'),
    },
    {
      icon: Globe,
      number: '50+',
      label: t('outcomeStats.countries'),
    },
    {
      icon: Users,
      number: '100+',
      label: t('outcomeStats.volunteers'),
    },
  ];
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-[1240px] px-8">
        <div
          className="px-8 md:px-16 py-12"
          style={{
            borderRadius: '40px',
            background: '#FFFFFF',
            boxShadow: '0px 1px 4px 0px rgba(12, 12, 13, 0.05)'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {statistics.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center gap-4"
                >
                  {/* Icon with Background Circle */}
                  <div
                    className="w-16 h-16 flex items-center justify-center rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #04A59D 0%, #91C549 100%)'
                    }}
                  >
                    <Icon
                      className="w-8 h-8"
                      style={{
                        color: '#FFFFFF',
                        strokeWidth: 2
                      }}
                    />
                  </div>

                  {/* Number */}
                  <div
                    className="bg-gradient-to-r from-[#04A59D] to-[#91C549] bg-clip-text text-transparent"
                    style={{
                      fontFamily: 'Inter',
                      fontSize: '36px',
                      fontWeight: 600
                    }}
                  >
                    {stat.number}
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#608A3A'
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
