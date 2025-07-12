

import React, { useRef, useEffect } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseStyles = 'block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-card text-textPrimary placeholder-textSecondary/50 overflow-hidden';
  const errorStyles = error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-mediumBorder';
  
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [props.value]); // Re-run effect when the value changes

  return (
    <div className={` ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-textSecondary mb-1">{label}</label>}
      <textarea
        id={id}
        ref={textareaRef}
        className={`${baseStyles} ${errorStyles} ${className}`}
        rows={props.rows || 1} // Start with a single row
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
};