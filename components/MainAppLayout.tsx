import React, { useState } from 'react';
import { Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ViewName, User, UserProfile } from '../types';
import { APP_TITLE, VIEW_PATH_MAP } from '../constants';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { useAppData } from '../hooks/useAppData';
import { Bars3Icon } from './ui/Icons';
import { AnimatePresence, motion } from 'framer-motion';

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
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar for desktop */}
      <div className="hidden lg:block">
          <Sidebar
            currentUser={currentUser}
            onLogout={onLogout}
            onNavigate={handleNavigate}
          />
      </div>

       {/* Mobile menu overlay */}
       <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 z-50 lg:hidden"
            >
              <Sidebar
                currentUser={currentUser}
                onLogout={onLogout}
                onNavigate={handleNavigate}
                isMobile
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>


      <div className="flex-1 flex flex-col min-w-0">
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
            {/* Can add user menu or actions for mobile header here if needed */}
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
