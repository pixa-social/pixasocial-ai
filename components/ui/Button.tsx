import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline' | 'link'; // Added 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors duration-150 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-blue-600 focus:ring-primary focus:ring-offset-0', // Adjusted hover, offset
    secondary: 'bg-secondary text-white hover:bg-gray-700 focus:ring-secondary focus:ring-offset-0',
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-danger focus:ring-offset-0',
    ghost: 'bg-transparent text-primary hover:bg-blue-100 focus:ring-primary focus:ring-offset-0',
    success: 'bg-accent text-white hover:bg-emerald-600 focus:ring-accent focus:ring-offset-0',
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary hover:text-white focus:ring-primary focus:ring-offset-0',
    link: 'bg-transparent text-primary hover:text-blue-600 hover:underline focus:ring-primary focus:ring-offset-0', // Added link styles
  };

  const sizeStyles = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const currentVariantStyles = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      className={`${baseStyles} ${currentVariantStyles} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
