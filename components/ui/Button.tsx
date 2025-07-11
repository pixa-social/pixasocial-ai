
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline' | 'link';
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
  const baseStyles = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 ease-in-out flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-px';
  
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-sky-400 focus:ring-primary',
    secondary: 'bg-secondary text-textPrimary hover:bg-slate-500 focus:ring-slate-400',
    danger: 'bg-danger text-white hover:bg-rose-600 focus:ring-danger',
    ghost: 'bg-transparent text-textSecondary hover:bg-gray-700 hover:text-textPrimary focus:ring-primary',
    success: 'bg-success text-white hover:bg-emerald-600 focus:ring-success',
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary hover:text-white focus:ring-primary',
    link: 'bg-transparent text-primary hover:text-sky-400 hover:underline focus:ring-primary',
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