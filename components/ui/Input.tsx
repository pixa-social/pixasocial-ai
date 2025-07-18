
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className = '', containerClassName = '', leftIcon, rightIcon, ...props }) => {
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon;
  const baseStyles = `block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm bg-card text-foreground disabled:opacity-50 ${hasLeftIcon ? 'pl-10' : ''} ${hasRightIcon ? 'pr-10' : ''} placeholder-muted-foreground/50`;
  const errorStyles = error ? 'border-destructive focus:ring-destructive focus:border-destructive' : 'border-input';

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>}
      <div className="relative rounded-lg shadow-sm">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          className={`${baseStyles} ${errorStyles} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
};
