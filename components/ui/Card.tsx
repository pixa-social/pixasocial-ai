import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'soft-md' | 'soft-lg'; // Added shadow prop
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, actions, shadow = 'soft-lg' }) => {
  const shadowClass = {
    'none': 'shadow-none',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl',
    'soft-md': 'shadow-soft-md',
    'soft-lg': 'shadow-soft-lg',
  };
  
  return (
    <div className={`bg-card ${shadowClass[shadow]} rounded-xl p-6 ${className}`}>
      {(title || actions) && (
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-lightBorder">
          {title && <h3 className="text-xl font-semibold text-textPrimary">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};