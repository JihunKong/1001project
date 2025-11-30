'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AccordionItemProps } from './types';

export default function AccordionItem({
  item,
  isExpanded,
  onClick,
  onMouseEnter,
  index,
  totalItems
}: AccordionItemProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="relative cursor-pointer overflow-hidden rounded-2xl"
      style={{
        height: '400px',
        backgroundColor: '#F5F5F5'
      }}
      initial={false}
      animate={{
        width: isExpanded ? '60%' : `${40 / (totalItems - 1)}%`,
        transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="tab"
      aria-selected={isExpanded}
      aria-controls={`panel-${item.id}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Background Image */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: isExpanded ? 1 : 0.6
        }}
        transition={{ duration: 0.3 }}
      >
        <Image
          src={item.image}
          alt={t(item.titleKey)}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 60vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background: isExpanded
              ? 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)'
              : 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)'
          }}
        />
      </motion.div>

      {/* Step Number Badge */}
      <div
        className="absolute top-6 left-6 px-4 py-2 rounded-full"
        style={{
          backgroundColor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <span
          style={{
            fontFamily: 'Poppins',
            fontSize: '14px',
            fontWeight: 600,
            color: '#04A59D'
          }}
        >
          {item.stepNumber}
        </span>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <motion.h3
          style={{
            fontFamily: 'Quicksand',
            fontSize: isExpanded ? '24px' : '18px',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: isExpanded ? '12px' : '0'
          }}
          animate={{
            fontSize: isExpanded ? '24px' : '18px'
          }}
          transition={{ duration: 0.3 }}
        >
          {t(item.titleKey)}
        </motion.h3>

        <motion.p
          style={{
            fontFamily: 'Poppins',
            fontSize: '16px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.9)',
            lineHeight: '1.6'
          }}
          initial={false}
          animate={{
            opacity: isExpanded ? 1 : 0,
            height: isExpanded ? 'auto' : 0,
            marginTop: isExpanded ? '8px' : 0
          }}
          transition={{ duration: 0.3 }}
        >
          {t(item.descriptionKey)}
        </motion.p>
      </div>

      {/* Expand Indicator (when collapsed) */}
      {!isExpanded && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
