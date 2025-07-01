import React from 'react';
import { Persona, RSTTraitLevel } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import RstVisualBar from './RstVisualBar';
import { DEFAULT_PERSONA_AVATAR, RST_TRAITS } from '../../constants';

const SparklesIcon = () => ( // Copied from PersonaForm or make it a shared UI icon
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.468 3.468.39 4.753 4.401 1.83c.772.321 1.415-.098.884-.868l-1.542-2.926 2.433-2.096 2.926 1.542c.77.518 1.589.097.868-.884l-1.83-4.401 4.753-.39 3.468-3.468-.39-4.753-4.401-1.83zm-1.022 6.425a.75.75 0 01.21-.527l1.542-1.542a.75.75 0 00-1.06-1.06l-1.542 1.542a.75.75 0 01-.527.21h-2.13a.75.75 0 000 1.5h2.13zm-5.262 2.132a.75.75 0 01.21-.527l1.542-1.542a.75.75 0 00-1.06-1.06l-1.542 1.542a.75.75 0 01-.527.21v-2.13a.75.75 0 00-1.5 0v2.13a.75.75 0 01-.527-.21l-1.542-1.542a.75.75 0 00-1.06 1.06l1.542 1.542a.75.75 0 01.21.527v2.13a.75.75 0 001.5 0v-2.13zM15 10.5a.75.75 0 01-.75.75h-2.13a.75.75 0 01-.527-.21l-1.542-1.542a.75.75 0 10-1.06 1.06l1.542 1.542a.75.75 0 01.21.527v2.13a.75.75 0 001.5 0v-2.13a.75.75 0 01.527.21l1.542 1.542a.75.75 0 101.06-1.06l-1.542-1.542a.75.75 0 01-.21-.527V8.37a.75.75 0 00-1.5 0v2.13z" clipRule="evenodd" />
  </svg>
);

interface PersonaCardProps {
  persona: Persona;
  onEdit: (persona: Persona) => void;
  onRefreshVulnerabilities: (persona: Persona) => void;
  isRefreshingVulnerabilities: boolean;
}

const PersonaCardComponent: React.FC<PersonaCardProps> = ({ persona, onEdit, onRefreshVulnerabilities, isRefreshingVulnerabilities }) => {
  return (
    <Card title={persona.name} className="flex flex-col justify-between">
      <div>
        <img 
          src={persona.avatarUrl || DEFAULT_PERSONA_AVATAR} 
          alt={persona.name} 
          className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-primary object-cover" 
          onError={(e) => (e.currentTarget.src = DEFAULT_PERSONA_AVATAR)}
        />
        <p className="text-sm text-textSecondary mb-1"><strong>Demographics:</strong> {persona.demographics}</p>
        <p className="text-sm text-textSecondary mb-1"><strong>Psychographics:</strong> {persona.psychographics}</p>
        <p className="text-sm text-textSecondary mb-3"><strong>Initial Beliefs:</strong> {persona.initialBeliefs}</p>
        
        {persona.rstProfile && (
          <div className="mt-2 mb-3 p-3 bg-indigo-50 rounded-md border border-indigo-200">
              <h4 className="font-semibold text-sm text-indigo-700 mb-1">RST Profile:</h4>
              {RST_TRAITS.map(traitInfo => (
                  <div key={traitInfo.key} className="text-xs text-indigo-600 mb-1.5">
                      <span className="font-medium">{traitInfo.label.split(' (')[0]}: </span>
                      <span>{persona.rstProfile?.[traitInfo.key] || 'Not Assessed'}</span>
                      <RstVisualBar level={persona.rstProfile?.[traitInfo.key] || 'Not Assessed'} />
                  </div>
              ))}
          </div>
        )}

        {persona.vulnerabilities && persona.vulnerabilities.length > 0 && (
          <div className="mt-2 mb-3">
            <h4 className="font-semibold text-sm text-textPrimary">Vulnerabilities:</h4>
            <ul className="list-disc list-inside text-xs text-textSecondary">
              {persona.vulnerabilities.map((vul, idx) => <li key={idx}>{vul}</li>)}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEdit(persona)}>Edit</Button>
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={() => onRefreshVulnerabilities(persona)} 
          isLoading={isRefreshingVulnerabilities}
          leftIcon={<SparklesIcon />}
        >
          Refresh Vulnerabilities (AI)
        </Button>
      </div>
    </Card>
  );
};

export const PersonaCard = React.memo(PersonaCardComponent);
