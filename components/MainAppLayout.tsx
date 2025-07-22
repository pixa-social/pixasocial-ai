import React from 'react';
import { Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ViewName, User, UserProfile } from '../types';
import { APP_TITLE, VIEW_PATH_MAP } from '../constants';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { useAppData } from '../hooks/useAppData';

interface MainAppLayoutProps {
  currentUser: UserProfile; 
  onLogout: () => void;
  onUpdateUser: (updatedUserData: Partial<User>) => void;
}

// Define the shape of the context that will be provided to child routes.
export type AppDataContextType = ReturnType<typeof useAppData>;

export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  currentUser, 
  onLogout,
  onUpdateUser,
}) => {
  const appData = useAppData(currentUser);
  const navigate = useNavigate();
  
  const handleNavigate = (view: ViewName) => {
    const path = VIEW_PATH_MAP[view];
    if (path) {
      navigate(path);
    } else {
      console.warn(`No path found for view: ${view}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onLogout={onLogout} isAuthenticated={!!currentUser} currentUser={currentUser} />
      <Breadcrumbs />
      <main className="flex-grow container mx-auto px-4 pb-8 max-w-7xl">
        <Outlet context={{ ...appData, currentUser, onUpdateUser, onNavigate: handleNavigate }} />
      </main>
      <footer className="bg-gray-900 text-gray-400 text-center p-4 text-sm border-t border-border">
        &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.
      </footer>
    </div>
  );
};

// Helper hook for child components to easily access the context.
export function useAppDataContext() {
  return useOutletContext<AppDataContextType & { currentUser: UserProfile; onUpdateUser: (updatedUserData: Partial<User>) => void; onNavigate: (view: ViewName) => void; }>();
}