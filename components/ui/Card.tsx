import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode; // Added icon prop
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'soft-md' | 'soft-lg';
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, actions, icon, shadow = 'soft-lg' }) => {
  const shadowClass = {
    'none': 'shadow-none',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl', // Ensure 'xl' is available in tailwind.config or is a default
    'soft-md': 'shadow-soft-md',
    'soft-lg': 'shadow-soft-lg',
  };
  
  return (
    <div className={`bg-card ${shadowClass[shadow]} rounded-xl p-6 md:p-7 ${className}`}> {/* Updated padding */}
      {(title || actions || icon) && (
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-lightBorder">
          <div className="flex items-center">
            {icon && <span className="mr-2 text-primary">{icon}</span>}
            {title && <h3 className="text-xl font-semibold text-textPrimary">{title}</h3>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
