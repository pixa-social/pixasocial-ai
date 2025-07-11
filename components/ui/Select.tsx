
import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  style?: React.CSSProperties;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, options, error, className = '', containerClassName = '', ...props }) => {
  const baseStyles = 'appearance-none block w-full pl-3 pr-10 py-2 border bg-card rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-textPrimary';
  const errorStyles = error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-mediumBorder';

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-textSecondary mb-1">{label}</label>}
      <div className="relative">
        <select
          id={id}
          className={`${baseStyles} ${errorStyles} ${className}`}
          {...props}
        >
          <option value="">Select...</option>
          {options.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              style={option.style}
              className="bg-gray-800 text-textPrimary"
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-textSecondary">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
};
