import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { SmartReply } from '../../types';

interface SmartRepliesProps {
  replies: SmartReply[];
  onSelect: (replyText: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export const SmartReplies: React.FC<SmartRepliesProps> = ({ replies, onSelect }) => {
  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-center justify-center gap-2 mb-3"
      >
        {replies.map((reply) => (
          <motion.div key={reply.id} variants={itemVariants}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(reply.text)}
              className="bg-card hover:bg-border"
            >
              {reply.text}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};