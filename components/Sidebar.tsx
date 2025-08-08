import React, { useState, useMemo, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NavItem, ViewName, UserProfile, RoleName } from '../types';
import { APP_TITLE, NAVIGATION_ITEMS, VIEW_PATH_MAP } from '../constants';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { ArrowRightOnRectangleIcon, ChevronLeftIcon, ChevronRightIcon } from './ui/Icons';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface SidebarProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onNavigate: (view: ViewName) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const AiCreditCounter: React.FC<{ currentUser: UserProfile; isCollapsed: boolean }> = ({ currentUser, isCollapsed }) => {
    const { ai_usage_count_monthly, role } = currentUser;
    const { max_ai_uses_monthly } = role;
    const remainingCredits = max_ai_uses_monthly - ai_usage_count_monthly;
    
    const creditsClass = remainingCredits > (max_ai_uses_monthly * 0.2) ? 'text-green-400' : remainingCredits > 0 ? 'text-yellow-400' : 'text-destructive';

    if (isCollapsed) {
        return (
            <div className="flex items-center justify-center h-10 w-10 bg-white/5 border border-white/10 rounded-full" title={`${remainingCredits} credits remaining`}>
                <span className={`font-mono font-semibold text-xs ${creditsClass}`}>{remainingCredits}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg" title={`You have ${remainingCredits} out of ${max_ai_uses_monthly} monthly AI credits remaining.`}>
            <span role="img" aria-label="credits" className="text-yellow-400 mr-2">⚡</span>
            <span className={`font-mono font-semibold text-sm ${creditsClass}`}>{remainingCredits}</span>
            <span className="text-xs text-muted-foreground mx-1">/</span>
            <span className="text-xs text-muted-foreground">{max_ai_uses_monthly}</span>
        </div>
    );
};


const NavItemLink: React.FC<{ item: NavItem; isCollapsed: boolean; onNavigate: (view: ViewName) => void }> = ({ item, isCollapsed, onNavigate }) => {
  const location = useLocation();
  const isActive = item.viewName ? location.pathname.startsWith(VIEW_PATH_MAP[item.viewName]) : false;

  const linkClasses = cn(
    "flex items-center p-2 rounded-lg transition-colors duration-200 w-full text-left",
    isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground',
    isCollapsed ? 'justify-center' : ''
  );

  return (
    <button onClick={() => onNavigate(item.viewName!)} className={linkClasses} title={isCollapsed ? item.label : ''}>
      {item.icon && <span className={cn(!isCollapsed && "mr-3")}>{React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}</span>}
      {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
    </button>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ currentUser, onLogout, onNavigate, isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();

  const visibleNavItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter(item => !item.isAdminOnly || (item.isAdminOnly && currentUser.role?.name === RoleName.Admin));
  }, [currentUser]);

  const isViewActiveInDropdown = useCallback((item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => child.viewName && location.pathname.startsWith(VIEW_PATH_MAP[child.viewName]));
  }, [location.pathname]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const sidebarContent = (isMobileView: boolean) => (
    <div className={cn(
        "flex flex-col h-full bg-gray-900/60 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ease-in-out",
        isCollapsed && !isMobileView ? "w-20" : "w-64"
    )}>
      <div className="flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0">
        {!isCollapsed && <h1 className="font-bold text-xl text-foreground">{APP_TITLE}</h1>}
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        <Accordion type="single" className="w-full" defaultValue={visibleNavItems.find(isViewActiveInDropdown)?.label}>
          {visibleNavItems.map(item => (
            item.children ? (
              <AccordionItem value={item.label} key={item.label} className="border-b-0">
                <AccordionTrigger className={cn("flex items-center p-2 rounded-lg transition-colors duration-200 w-full text-left",
                  isViewActiveInDropdown(item) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground',
                  isCollapsed && !isMobileView ? 'justify-center' : ''
                )}>
                    {item.icon && <span className={cn(!isCollapsed && "mr-3")}>{React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}</span>}
                    {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </AccordionTrigger>
                <AccordionContent className="pl-4">
                  <div className="space-y-1">
                    {item.children.map(child => child.viewName && <NavItemLink key={child.viewName} item={child} isCollapsed={false} onNavigate={onNavigate} />)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ) : (
              item.viewName && <NavItemLink key={item.viewName} item={item} isCollapsed={isCollapsed && !isMobileView} onNavigate={onNavigate} />
            )
          ))}
        </Accordion>
      </nav>
      
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="mb-4">
          <AiCreditCounter currentUser={currentUser} isCollapsed={isCollapsed && !isMobileView} />
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={currentUser.name || '?'} size="sm" />
          {!isCollapsed && (
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </div>
          )}
          <button onClick={onLogout} title="Logout" className="p-2 text-muted-foreground hover:text-destructive">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMobileView && (
        <div className="p-2 border-t border-white/10">
            <Button variant="ghost" onClick={toggleCollapse} className="w-full justify-center text-muted-foreground hover:text-foreground">
                {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
            </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed top-0 left-0 h-full z-40">
        {sidebarContent(false)}
      </div>

      {/* Mobile Sidebar */}
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
              {sidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};