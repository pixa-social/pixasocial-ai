

import React from 'react';
import { AgentLogo } from './shared';
import { Persona } from '../../types';
import { PersonaSelector } from './PersonaSelector';

interface WelcomeScreenProps {
  personas: Persona[];
  activePersona: Persona | null;
  onSelectPersona: (persona: Persona) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ personas, activePersona, onSelectPersona }) => {
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 animate-fade-in-up">
        <AgentLogo />
        <h3 className="text-2xl font-bold mt-4 text-foreground">
          {activePersona ? `Chat with ${activePersona.name}` : 'PixaSocial AI Agents'}
        </h3>
        <p className="mt-2 max-w-md">
          Start a conversation by typing below, or select a different persona to interact with.
        </p>
        <div className="mt-6">
            <PersonaSelector
                personas={personas}
                activePersona={activePersona}
                onSelect={onSelectPersona}
                open={popoverOpen}
                onOpenChange={setPopoverOpen}
                sentiment={null}
            />
        </div>
      </div>
    );
};