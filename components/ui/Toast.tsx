import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../../types';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from './Icons';

interface ToastProps extends ToastMessage {
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]); // Removed onDismiss from deps as handleDismiss is stable

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300); 
  };

  const typeStyles = {
    success: {
      bg: 'bg-green-500',
      icon: <CheckCircleIcon className="w-6 h-6 text-white" />,
      border: 'border-green-700',
    },
    error: {
      bg: 'bg-danger', // Red-500
      icon: <XCircleIcon className="w-6 h-6 text-white" />,
      border: 'border-red-700', // Darker Red
    },
    info: {
      bg: 'bg-blue-500',
      icon: <InformationCircleIcon className="w-6 h-6 text-white" />,
      border: 'border-blue-700', // Darker Blue
    },
    warning: { 
      bg: 'bg-warning', // Amber-500
      icon: <ExclamationTriangleIcon className="w-6 h-6 text-white" />,
      border: 'border-amber-700', // Darker Amber
    }
  };

  const currentStyles = typeStyles[type] || typeStyles.info;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`
        ${currentStyles.bg} text-white p-4 rounded-md shadow-xl border ${currentStyles.border}
        flex items-start space-x-3 w-full max-w-sm
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0 animate-toast-in' : 'animate-toast-out'}
      `}
    >
      <div className="shrink-0 pt-0.5">{currentStyles.icon}</div>
      <div className="flex-1 text-sm">
        <p>{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="p-1 -m-1 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
