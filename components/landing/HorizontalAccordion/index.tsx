'use client';

import { useReducedMotion } from 'framer-motion';
import AccordionItem from './AccordionItem';
import MobileCarousel from './MobileCarousel';
import { useAccordionAutoPlay } from './useAccordionAutoPlay';
import { HorizontalAccordionProps } from './types';

export default function HorizontalAccordion({
  items,
  className = '',
  autoPlayInterval = 5000
}: HorizontalAccordionProps) {
  const prefersReducedMotion = useReducedMotion();

  const {
    activeIndex,
    goToIndex,
    pause,
    resume
  } = useAccordionAutoPlay({
    totalItems: items.length,
    interval: autoPlayInterval,
    enabled: !prefersReducedMotion
  });

  return (
    <div className={className}>
      {/* Desktop: Horizontal Accordion */}
      <div
        className="hidden lg:flex gap-4"
        onMouseEnter={pause}
        onMouseLeave={resume}
        role="tablist"
        aria-label="Library features"
      >
        {items.map((item, index) => (
          <AccordionItem
            key={item.id}
            item={item}
            isExpanded={index === activeIndex}
            onClick={() => goToIndex(index)}
            onMouseEnter={() => goToIndex(index)}
            index={index}
            totalItems={items.length}
          />
        ))}
      </div>

      {/* Mobile: Swipe Carousel */}
      <div
        className="lg:hidden"
        onTouchStart={pause}
        onTouchEnd={() => setTimeout(resume, 3000)}
      >
        <MobileCarousel
          items={items}
          activeIndex={activeIndex}
          onIndexChange={goToIndex}
        />
      </div>
    </div>
  );
}

export { useAccordionAutoPlay } from './useAccordionAutoPlay';
export type { AccordionItemData, HorizontalAccordionProps } from './types';
