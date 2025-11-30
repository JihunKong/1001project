'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { MobileCarouselProps } from './types';

export default function MobileCarousel({
  items,
  activeIndex,
  onIndexChange
}: MobileCarouselProps) {
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const containerWidth = 320;
  const gap = 16;

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    let newIndex = activeIndex;

    if (offset < -threshold || velocity < -500) {
      newIndex = Math.min(activeIndex + 1, items.length - 1);
    } else if (offset > threshold || velocity > 500) {
      newIndex = Math.max(activeIndex - 1, 0);
    }

    onIndexChange(newIndex);
    animate(x, -newIndex * (containerWidth + gap), {
      type: 'spring',
      stiffness: 300,
      damping: 30
    });
  };

  return (
    <div className="relative overflow-hidden py-4">
      <motion.div
        className="flex gap-4"
        drag="x"
        dragConstraints={{
          left: -(items.length - 1) * (containerWidth + gap),
          right: 0
        }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex-shrink-0 rounded-2xl overflow-hidden"
            style={{
              width: containerWidth,
              height: '360px',
              backgroundColor: '#F5F5F5'
            }}
            animate={{
              scale: index === activeIndex ? 1 : 0.95,
              opacity: index === activeIndex ? 1 : 0.7
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Background Image */}
            <div className="relative w-full h-full">
              <Image
                src={item.image}
                alt={t(item.titleKey)}
                fill
                className="object-cover"
                sizes="320px"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 100%)'
                }}
              />

              {/* Step Badge */}
              <div
                className="absolute top-4 left-4 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <span
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#04A59D'
                  }}
                >
                  {item.stepNumber}
                </span>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3
                  style={{
                    fontFamily: 'Quicksand',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '8px'
                  }}
                >
                  {t(item.titleKey)}
                </h3>
                <p
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: '1.5'
                  }}
                >
                  {t(item.descriptionKey)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {items.map((_, index) => (
          <button
            key={index}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: index === activeIndex ? '#04A59D' : '#D9D9D9'
            }}
            onClick={() => {
              onIndexChange(index);
              animate(x, -index * (containerWidth + gap), {
                type: 'spring',
                stiffness: 300,
                damping: 30
              });
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
