import { useCallback } from 'react';
import { ViewName } from '../types';

export const useNavigateToView = (onNavigate?: (view: ViewName) => void) => {
  return useCallback((view: ViewName) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      console.warn("useNavigateToView: onNavigate prop is not provided. Navigation will not occur.");
    }
  }, [onNavigate]);
};
