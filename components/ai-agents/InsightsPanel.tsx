import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ChevronLeftIcon, Lightbulb, ChevronRightIcon } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface InsightsPanelProps {
  insights: string[] | null;
  onGenerate: () => void;
  isLoading: boolean;
}

const sidebarVariants = {
  open: { x: 0, width: 320 },
  closed: { x: '100%', width: 0 },
};

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, onGenerate, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-20">
        <Button
          variant="secondary"
          className="rounded-r-none h-20 writing-vertical-rl text-sm font-semibold"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronRightIcon className="w-4 h-4"/> : <><Lightbulb className="w-4 h-4 mb-2"/> Insights</>}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="insights-panel"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-background border-l border-border flex-shrink-0 overflow-hidden"
          >
            <div className="p-4 flex flex-col h-full w-[320px]">
              <h3 className="text-lg font-bold text-foreground mb-4">Key Insights</h3>
              <div className="flex-grow overflow-y-auto pr-2">
                {isLoading && <LoadingSpinner text="Generating insights..."/>}
                {!isLoading && insights && insights.length > 0 && (
                  <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
                    {insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                )}
                {!isLoading && !insights && (
                    <div className="text-center text-sm text-muted-foreground pt-10">
                        <p>Click the button below to generate a summary of the key takeaways from this conversation.</p>
                    </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Button onClick={onGenerate} className="w-full" isLoading={isLoading}>
                  {insights ? 'Refresh Insights' : 'Generate Insights'}
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};