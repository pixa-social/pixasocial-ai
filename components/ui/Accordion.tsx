
import React, { useState, useContext, createContext, ReactNode } from 'react';
import { ChevronDownIcon } from './Icons';
import { cn } from '../../lib/utils';

interface AccordionContextProps {
  openItems: string[];
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextProps | undefined>(undefined);

const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an <Accordion> provider.');
  }
  return context;
};

export const Accordion: React.FC<{
  children: ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
}> = ({ children, type = 'single', defaultValue, className }) => {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggleItem = (value: string) => {
    setOpenItems((current) => {
      const isCurrentlyOpen = current.includes(value);
      if (type === 'single') {
        return isCurrentlyOpen ? [] : [value];
      }
      return isCurrentlyOpen ? current.filter((item) => item !== value) : [...current, value];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

const AccordionItemContext = createContext<{ value: string }>({ value: '' });

export const AccordionItem: React.FC<{ children: ReactNode; value: string; className?: string; }> = ({
  children,
  value,
  className,
}) => (
  <AccordionItemContext.Provider value={{ value }}>
    <div className={cn("border-b border-border last:border-b-0", className)}>{children}</div>
  </AccordionItemContext.Provider>
);

export const AccordionTrigger: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const { value } = useContext(AccordionItemContext);
  const { openItems, toggleItem } = useAccordionContext();
  const isOpen = openItems.includes(value);

  return (
    <button
      onClick={() => toggleItem(value)}
      aria-expanded={isOpen}
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(
        'flex w-full flex-1 items-center justify-between py-4 font-medium transition-colors hover:bg-white/5',
        className
      )}
    >
      {children}
      <ChevronDownIcon
        className={cn('h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground', isOpen && 'rotate-180')}
      />
    </button>
  );
};

export const AccordionContent: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const { value } = useContext(AccordionItemContext);
  const { openItems } = useAccordionContext();
  const isOpen = openItems.includes(value);

  return (
    <div
      className={cn('grid text-sm transition-all duration-300 ease-in-out', 
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        className
      )}
    >
      <div className="overflow-hidden">
        <div className="pb-4 pt-0">{children}</div>
      </div>
    </div>
  );
};
