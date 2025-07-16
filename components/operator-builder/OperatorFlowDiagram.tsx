
import React from 'react';
import { Operator, Persona } from '../../types';
import { Card } from '../ui/Card';
import { ArrowRightIcon } from '../ui/Icons';

interface OperatorFlowDiagramProps {
  operator: Partial<Operator> | null;
  persona: Persona | undefined;
}

const FlowNode: React.FC<{ title: string; content?: string | null; icon?: React.ReactNode, className?: string }> = ({ title, content, icon, className = '' }) => (
  <div className={`flex-1 min-w-[150px] p-3 border border-border rounded-lg bg-card/60 shadow-sm text-center ${className}`}>
    <h4 className="text-xs font-semibold text-muted-foreground flex items-center justify-center mb-1">
      {icon && <span className="mr-1.5">{icon}</span>}
      {title}
    </h4>
    <p className="text-sm text-foreground line-clamp-3" title={content || ''}>{content || '...'}</p>
  </div>
);

const FlowArrow: React.FC = () => (
    <div className="flex-shrink-0 flex items-center justify-center mx-2 text-muted-foreground">
        <ArrowRightIcon className="w-5 h-5" />
    </div>
);


export const OperatorFlowDiagram: React.FC<OperatorFlowDiagramProps> = ({ operator, persona }) => {
  return (
    <div className="space-y-4">
        {/* Top level: Stimuli leading to response */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <FlowNode title="Target Persona" content={persona?.name} className="bg-primary/10 border-primary/50" />
            <FlowArrow />
            <div className="flex-1 p-3 border border-border rounded-lg bg-card/60 shadow-sm text-center">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Stimuli</h4>
                <div className="space-y-2">
                     <p className="text-sm text-foreground p-2 rounded bg-background text-left"><strong className="text-muted-foreground">CS:</strong> {operator?.conditioned_stimulus || '...'}</p>
                     <p className="text-sm font-bold text-center text-muted-foreground">+</p>
                     <p className="text-sm text-foreground p-2 rounded bg-background text-left"><strong className="text-muted-foreground">US:</strong> {operator?.unconditioned_stimulus || '...'}</p>
                </div>
            </div>
            <FlowArrow />
            <FlowNode title="Desired Response" content={operator?.desired_conditioned_response} />
        </div>
        {/* Bottom level: Reinforcement loop */}
        <div className="flex justify-center items-center">
             <div className="w-1/2 flex justify-center items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground -mr-1">
                    <path d="M12 21V15M12 15L9 18M12 15L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
             </div>
        </div>
        <div className="flex justify-center">
            <FlowNode title="Reinforcement Loop" content={operator?.reinforcement_loop} className="max-w-md" />
        </div>
    </div>
  );
};
