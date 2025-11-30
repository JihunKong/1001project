export interface AccordionItemData {
  id: string;
  stepNumber: string;
  titleKey: string;
  descriptionKey: string;
  image: string;
}

export interface HorizontalAccordionProps {
  items: AccordionItemData[];
  className?: string;
  autoPlayInterval?: number;
}

export interface AccordionItemProps {
  item: AccordionItemData;
  isExpanded: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  index: number;
  totalItems: number;
}

export interface MobileCarouselProps {
  items: AccordionItemData[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}
