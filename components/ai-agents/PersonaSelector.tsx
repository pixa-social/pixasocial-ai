import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/Popover';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Persona, Sentiment } from '../../types';
import { User, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PersonaSelectorProps {
  personas: Persona[];
  activePersona: Persona | null;
  onSelect: (persona: Persona) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sentiment: Sentiment;
}

const sentimentRingClasses: Record<NonNullable<Sentiment>, string> = {
    positive: 'ring-green-500',
    neutral: 'ring-yellow-500',
    negative: 'ring-red-500',
};

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ personas, activePersona, onSelect, open, onOpenChange, sentiment }) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>
      <Button variant="ghost" className="text-muted-foreground hover:text-foreground h-auto py-1.5 px-3">
        <div className="relative">
            <Avatar name={activePersona?.name || '?'} imageUrl={activePersona?.avatar_url} size="sm" />
            <div className={cn(
                "absolute -inset-0.5 rounded-full ring-2 ring-transparent transition-all",
                sentiment && sentimentRingClasses[sentiment]
            )} />
        </div>
        <span className="font-semibold ml-2">{activePersona?.name || "Select Persona"}</span>
        <ChevronDown className="w-4 h-4 ml-2"/>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-64 p-2 bg-background border-border shadow-2xl mt-2 origin-top-left left-0 absolute">
      <div className="space-y-1">
        <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Chat as...</p>
        {personas.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-card transition-colors"
          >
            <Avatar imageUrl={p.avatar_url || undefined} name={p.name} size="sm" />
            <span className="text-sm font-medium">{p.name}</span>
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);