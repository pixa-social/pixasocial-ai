
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className = '', containerClassName = '', leftIcon, ...props }) => {
  const hasIcon = !!leftIcon;
  const baseStyles = `block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-card text-textPrimary disabled:opacity-50 ${hasIcon ? 'pl-10' : ''} placeholder-textSecondary/50`;
  const errorStyles = error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-mediumBorder';

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-textSecondary mb-1">{label}</label>}
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
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
};