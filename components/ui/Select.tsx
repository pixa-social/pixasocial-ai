import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, options, error, className = '', containerClassName = '', ...props }) => {
  const baseStyles = 'block w-full pl-3 pr-10 py-2 border border-mediumBorder bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-textPrimary';
  const errorStyles = error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-mediumBorder';

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-textSecondary mb-1">{label}</label>}
      <select
        id={id}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      >
        <option value="">Select...</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
};