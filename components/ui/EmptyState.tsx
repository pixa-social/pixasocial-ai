import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { ArrowRightIcon, LightBulbIcon } from './Icons';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <Card className={`text-center py-12 px-6 bg-card/50 border-2 border-dashed border-border/50 ${className}`}>
      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
        {icon || <LightBulbIcon className="w-8 h-8 text-primary" />}
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      {typeof description === 'string' ? (
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">{description}</p>
      ) : (
        <div className="text-muted-foreground mt-2 max-w-md mx-auto">{description}</div>
      )}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          className="mt-6"
          rightIcon={<ArrowRightIcon className="w-4 h-4" />}
        >
          {action.label}
        </Button>
      )}
    </Card>
  );
};
