
import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';

interface PopoverContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const PopoverContext = createContext<PopoverContextType | null>(null);

const usePopover = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('usePopover must be used within a Popover component');
  }
  return context;
};

export const Popover: React.FC<{
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setOpen]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div ref={popoverRef} className="relative inline-block text-left">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger: React.FC<{ children: React.ReactElement; asChild?: boolean }> = ({ children, asChild = false }) => {
  const { setOpen, triggerRef } = usePopover();
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp ref={triggerRef} onClick={() => setOpen((o) => !o)} type="button">
      {children}
    </Comp>
  );
};

const popoverVariants = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
};

export const PopoverContent: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className = '' }) => {
  const { open } = usePopover();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={popoverVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`origin-top-right absolute right-0 mt-2 z-50 rounded-md shadow-lg bg-card ring-1 ring-border ring-opacity-5 focus:outline-none max-h-72 overflow-y-auto ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
