import React from 'react';
import { Persona, RSTProfile, UserProfile } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import RstVisualBar from './RstVisualBar';
import { DEFAULT_PERSONA_AVATAR, RST_TRAITS } from '../../constants';
import { TrashIcon, PencilIcon, SparklesIcon, EyeIcon } from '../ui/Icons';
import { useToast } from '../ui/ToastProvider';

interface PersonaCardProps {
  persona: Persona;
  onEdit: (persona: Persona) => void;
  onDelete: (personaId: number) => void;
  onRefreshVulnerabilities?: (persona: Persona) => void;
  onDeepDiveRequest?: (persona: Persona) => void;
  isRefreshingVulnerabilities: boolean;
  isDiving: boolean;
  currentUser: UserProfile;
}

const InfoSection: React.FC<{ title: string; items: string[] | null | undefined; icon: React.ReactNode }> = ({ title, items, icon }) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
        <h4 className="font-semibold text-sm text-muted-foreground flex items-center mb-1">
            {icon}
            <span className="ml-2">{title}</span>
        </h4>
        <ul className="space-y-1">
            {items.slice(0, 3).map((item, idx) => (
                <li key={idx} className="text-xs text-foreground bg-card/50 px-2 py-1 rounded">{item}</li>
            ))}
            {items.length > 3 && <li className="text-xs text-muted-foreground px-2 py-1">...and {items.length - 3} more</li>}
        </ul>
    </div>
  );
};

const PersonaCardComponent: React.FC<PersonaCardProps> = ({ 
  persona, onEdit, onDelete, onRefreshVulnerabilities, onDeepDiveRequest, 
  isRefreshingVulnerabilities, isDiving, currentUser 
}) => {
  const { showToast } = useToast();
  const hasNoCredits = currentUser.ai_usage_count_monthly >= currentUser.role.max_ai_uses_monthly;

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRefreshVulnerabilities?.(persona);
  };
  
  const handleDeepDiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeepDiveRequest?.(persona);
  };

  return (
    <Card className="flex flex-col justify-between" shadow="soft-lg">
      <div>
        <div className="flex items-start space-x-4">
            <img 
              src={persona.avatar_url || DEFAULT_PERSONA_AVATAR} 
              alt={persona.name} 
              className="w-20 h-20 rounded-lg border-2 border-primary/30 object-cover" 
              onError={(e) => (e.currentTarget.src = DEFAULT_PERSONA_AVATAR)}
            />
            <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{persona.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2" title={persona.demographics || ''}>{persona.demographics}</p>
            </div>
        </div>
        
        <div className="mt-4 space-y-4">
            <InfoSection title="Goals" items={persona.goals} icon={<CheckCircleIcon className="w-4 h-4 text-green-400" />} />
            <InfoSection title="Fears" items={persona.fears} icon={<ExclamationTriangleIcon className="w-4 h-4 text-red-400" />} />
        </div>

        {persona.rst_profile && (
          <div className="mt-4 pt-3 border-t border-border/50">
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">RST Profile:</h4>
              {RST_TRAITS.map(traitInfo => {
                const rstProfile = persona.rst_profile as unknown as RSTProfile;
                return (
                  <div key={traitInfo.key} className="text-xs text-textSecondary mb-1.5" title={traitInfo.description}>
                      <div className="flex justify-between items-center mb-0.5">
                          <span className="font-medium text-muted-foreground">{traitInfo.label.split(' (')[0]}</span>
                          <span className="font-semibold text-foreground">{rstProfile?.[traitInfo.key] || 'N/A'}</span>
                      </div>
                      <RstVisualBar level={rstProfile?.[traitInfo.key] || 'Not Assessed'} />
                  </div>
                )
              })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center flex-wrap gap-2">
        {onDeepDiveRequest && (
            <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleDeepDiveClick}
                isLoading={isDiving}
                disabled={hasNoCredits}
                title={hasNoCredits ? "You have no AI credits remaining." : "Get a deep dive analysis"}
                leftIcon={<EyeIcon className="w-4 h-4"/>}
            >
                Deep Dive
            </Button>
        )}
        <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => onEdit(persona)} title="Edit Persona"><PencilIcon className="w-4 h-4"/></Button>
            {onRefreshVulnerabilities && (
                 <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleRefreshClick} 
                    isLoading={isRefreshingVulnerabilities}
                    disabled={hasNoCredits}
                    title={hasNoCredits ? "No AI credits remaining" : "Refresh vulnerabilities with AI"}
                >
                    <SparklesIcon className="w-4 h-4"/>
                </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onDelete(persona.id)} title="Delete Persona" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                <TrashIcon className="w-4 h-4"/>
            </Button>
        </div>
      </div>
    </Card>
  );
};

// Dummy icons for InfoSection
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M8.257 3.099c.636-1.1 2.29-1.1 2.926 0l5.485 9.5a1.75 1.75 0 01-1.463 2.651H4.235a1.75 1.75 0 01-1.463-2.651l5.485-9.5zM9 8a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1zm1 6a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" />
    </svg>
);


export const PersonaCard = React.memo(PersonaCardComponent);