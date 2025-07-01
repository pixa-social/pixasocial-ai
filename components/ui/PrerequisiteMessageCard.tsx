import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { ExclamationTriangleIcon, ArrowRightIcon } from './Icons'; // Assuming ArrowRightIcon for action

interface PrerequisiteMessageCardProps {
  title: string;
  message: string | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const PrerequisiteMessageCard: React.FC<PrerequisiteMessageCardProps> = ({
  title,
  message,
  action,
  className = '',
}) => {
  return (
    <Card className={`mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-yellow-700">{title}</h3>
          {typeof message === 'string' ? (
            <p className="text-yellow-600 text-sm mt-1">{message}</p>
          ) : (
            <div className="text-yellow-600 text-sm mt-1">{message}</div>
          )}
          {action && (
            <Button
              variant="secondary"
              size="sm"
              onClick={action.onClick}
              className="mt-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300"
              leftIcon={action.icon || <ArrowRightIcon className="w-4 h-4" />}
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
