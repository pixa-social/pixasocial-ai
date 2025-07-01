import React from 'react';
import { ToastProvider } from './components/ui/ToastProvider';
import { SupabaseApp } from './components/SupabaseApp';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <SupabaseApp />
    </ToastProvider>
  );
};

export default App;