import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'soft-md' | 'soft-lg';
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, actions, icon, shadow = 'soft-lg' }) => {
  const shadowClass = {
    'none': 'shadow-none',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl',
    '2xl': 'shadow-2xl',
    'soft-md': 'shadow-soft-md',
    'soft-lg': 'shadow-soft-lg',
  };
  
  return (
    <div className={`bg-card/40 backdrop-blur-lg border border-border/30 rounded-xl p-6 md:p-7 ${shadowClass[shadow]} ${className}`}>
      {(title || actions || icon) && (
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
          <div className="flex items-center">
            {icon && <span className="mr-2 text-primary">{icon}</span>}
            {title && <h3 className="text-xl font-semibold text-card-foreground">{title}</h3>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};