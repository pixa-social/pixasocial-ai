import React, { useState } from 'react';
import { Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ViewName, User, UserProfile } from '../types';
import { APP_TITLE, VIEW_PATH_MAP } from '../constants';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { useAppData } from '../hooks/useAppData';
import { Bars3Icon } from './ui/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface MainAppLayoutProps {
  currentUser: UserProfile; 
  onLogout: () => void;
  onUpdateUser: (updatedUserData: Partial<User>) => void;
}

export type AppDataContextType = ReturnType<typeof useAppData>;

export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  currentUser, 
  onLogout,
  onUpdateUser,
}) => {
  const appData = useAppData(currentUser);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const handleNavigate = (view: ViewName) => {
    const path = VIEW_PATH_MAP[view];
    if (path) {
      navigate(path);
      setIsMobileMenuOpen(false); // Close mobile menu on navigation
    } else {
      console.warn(`No path found for view: ${view}`);
    }
  };

  const enhancedContext = {
    ...appData,
    currentUser,
    onUpdateUser,
    onNavigate: handleNavigate,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        currentUser={currentUser}
        onLogout={onLogout}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className={cn(
          "flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <header className="flex-shrink-0 bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
              aria-label="Open sidebar"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="flex-1 hidden lg:block">
              <Breadcrumbs />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="lg:hidden">
            <Breadcrumbs />
          </div>
          <div className="container mx-auto px-0 sm:px-0 py-6">
            <Outlet context={enhancedContext} />
          </div>
        </main>
        
        <footer className="bg-background text-muted-foreground text-center p-4 text-xs border-t border-border">
            &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export function useAppDataContext() {
  return useOutletContext<AppDataContextType & { currentUser: UserProfile; onUpdateUser: (updatedUserData: Partial<User>) => void; onNavigate: (view: ViewName) => void; }>();
}