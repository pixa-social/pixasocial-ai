
import React, { useCallback } from 'react';
import { Persona, AIPersonaDeepDive } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { DEFAULT_PERSONA_AVATAR } from '../../constants';
import { XMarkIcon, MegaphoneIcon, TvIcon, LightBulbIcon, BarsArrowUpIcon, RefreshIcon } from '../ui/Icons';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface PersonaDeepDiveModalProps {
  data: {
    persona: Persona;
    analysis: AIPersonaDeepDive | null;
  };
  onClose: () => void;
  onRefresh: (persona: Persona) => void;
  isRefreshing: boolean;
}

const InfoBlock: React.FC<{ title: string; content: string | string[] | undefined; icon: React.ReactNode; isGenerating?: boolean; }> = ({ title, content, icon, isGenerating }) => (
    <div className="bg-card/50 p-4 rounded-lg">
        <h4 className="text-lg font-semibold text-primary flex items-center mb-2">
            {icon}
            <span className="ml-2">{title}</span>
        </h4>
        {isGenerating ? (
            <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-muted-foreground">Generating...</span>
            </div>
        ) : (
            Array.isArray(content) ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                    {content.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">{content || 'Not available.'}</p>
            )
        )}
    </div>
);

export const PersonaDeepDiveModal: React.FC<PersonaDeepDiveModalProps> = ({ data, onClose, onRefresh, isRefreshing }) => {
  const { persona, analysis } = data;
  
  const handleRefresh = useCallback(() => {
    if (window.confirm("This will use AI credits to generate a new analysis and overwrite the current one. Are you sure?")) {
        onRefresh(persona);
    }
  }, [persona, onRefresh]);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
        <Card 
            className="w-full max-w-2xl bg-card shadow-xl rounded-lg transform transition-all duration-300 ease-in-out relative animate-modal-appear"
            shadow="xl"
        >
            <div className="p-6">
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <Button onClick={handleRefresh} variant="ghost" size="sm" leftIcon={<RefreshIcon className="w-4 h-4"/>} disabled={isRefreshing} isLoading={isRefreshing}>Refresh</Button>
                    <Button onClick={onClose} variant="ghost" size="icon" className="p-2" aria-label="Close"><XMarkIcon className="w-6 h-6" /></Button>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                    <img src={persona.avatar_url || DEFAULT_PERSONA_AVATAR} alt={persona.name} className="w-24 h-24 rounded-full border-4 border-primary object-cover" onError={(e) => (e.currentTarget.src = DEFAULT_PERSONA_AVATAR)}/>
                    <div>
                        <p className="text-sm text-muted-foreground">Deep Dive Analysis</p>
                        <h3 className="text-3xl font-bold text-foreground">{persona.name}</h3>
                    </div>
                </div>

                {!analysis || isRefreshing ? (
                    <LoadingSpinner text={isRefreshing ? "Refreshing analysis..." : "Loading analysis..."} />
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <InfoBlock title="Communication Style" content={analysis.communicationStyle} icon={<MegaphoneIcon className="w-5 h-5" />} />
                        <InfoBlock title="Media Habits" content={analysis.mediaHabits} icon={<TvIcon className="w-5 h-5" />} />
                        <InfoBlock title="Core Motivations" content={analysis.motivations} icon={<LightBulbIcon className="w-5 h-5" />} />
                        <InfoBlock title="Marketing Hooks" content={analysis.marketingHooks} icon={<BarsArrowUpIcon className="w-5 h-5" />} />
                    </div>
                )}
            </div>
        </Card>
    </div>
  );
};
