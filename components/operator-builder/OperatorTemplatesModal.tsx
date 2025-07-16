

import React from 'react';
import { Operator } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { XMarkIcon } from '../ui/Icons';
import { OPERATOR_TEMPLATES } from '../../constants';

type TemplateData = Partial<Omit<Operator, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'target_audience_id'>>;

interface OperatorTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateData: TemplateData) => void;
}

export const OperatorTemplatesModal: React.FC<OperatorTemplatesModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <Card
        title="Select an Operator Template"
        className="w-full max-w-2xl bg-card shadow-xl rounded-lg transform transition-all duration-300 ease-in-out relative"
        shadow="xl"
      >
        <Button onClick={onClose} variant="ghost" size="sm" className="absolute top-4 right-4 p-2" aria-label="Close">
          <XMarkIcon className="w-6 h-6" />
        </Button>
        <p className="text-muted-foreground mt-2 -mb-2">Select a template to get started with a pre-filled, proven strategy.</p>
        
        <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {OPERATOR_TEMPLATES.map(template => (
            <button
                key={template.title}
                className="w-full text-left block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => onSelect(template.data)}
                aria-label={`Select template: ${template.title}`}
            >
                <Card className="hover:border-primary transition-colors w-full">
                    <h4 className="text-lg font-bold text-primary">{template.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                </Card>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
