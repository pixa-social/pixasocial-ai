import React from 'react';
import { motion } from 'framer-motion';
import { type Message } from '@ai-sdk/react';
import { Avatar } from '../ui/Avatar';
import { UserProfile, Persona, GroundingSource } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ExternalLinkIcon } from '../ui/Icons';

type CustomMessage = Message & { grounding_sources?: GroundingSource[] };

interface ChatMessageProps {
  message: CustomMessage;
  currentUser: UserProfile;
  activePersona: Persona | null;
}

const messageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, currentUser, activePersona }) => (
  <motion.div
    key={message.id}
    variants={messageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.3 }}
    className={`flex items-start gap-3 w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
  >
    {message.role === 'assistant' && (
      <Avatar imageUrl={activePersona?.avatar_url || undefined} name={activePersona?.name || 'A'} size="md" className="border-2 border-primary/20" />
    )}
    
    <div className={`max-w-xl flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
      <div className={`p-4 rounded-3xl ${message.role === 'user' 
          ? 'bg-primary text-primary-foreground rounded-br-lg' 
          : 'bg-background text-foreground rounded-bl-lg'
      }`}>
        {message.content ? (
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{message.content}</pre>
        ) : (
          <LoadingSpinner size="sm" />
        )}
      </div>
      
      {message.grounding_sources && message.grounding_sources.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground w-full max-w-full">
              <p className="font-semibold mb-1">Sources:</p>
              <div className="flex flex-wrap gap-2">
                  {message.grounding_sources.map((source, index) => (
                      <a 
                          key={index} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-card/50 px-2 py-1 rounded-md border border-border hover:bg-border transition-colors truncate"
                          title={source.title}
                      >
                          <ExternalLinkIcon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                      </a>
                  ))}
              </div>
          </div>
      )}
    </div>
    
    {message.role === 'user' && (
      <Avatar name={currentUser.name || 'U'} size="md" className="border-2 border-border" />
    )}
  </motion.div>
);
