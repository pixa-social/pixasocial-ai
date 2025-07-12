

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NavItem, ViewName, UserProfile, RoleName } from '../types';
import { APP_TITLE, NAVIGATION_ITEMS } from '../constants';
import { Button } from './ui/Button'; 
import { ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from './ui/Icons'; 

interface NavbarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  isAuthenticated: boolean;
  onLogout?: () => void;
  currentUser: UserProfile;
}

const NavLinkComponent: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  isDropdownChild?: boolean;
}> = ({ item, isActive, onClick, isDropdownChild }) => {
  const baseClasses = `px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-150 ease-in-out`;
  const activeClasses = isDropdownChild 
    ? 'bg-primary/80 text-white' 
    : 'bg-primary text-white';
  const inactiveClasses = isDropdownChild 
    ? 'text-textPrimary hover:bg-gray-700 hover:text-white block w-full text-left' 
    : 'text-textSecondary hover:bg-gray-700 hover:text-white';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isDropdownChild ? 'block w-full text-left' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {item.icon && <span className="mr-2 inline-block align-middle">{item.icon}</span>}
      {item.label}
    </button>
  );
};
const NavLink = React.memo(NavLinkComponent);

const MobileNavLinkComponent: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const baseClasses = `block px-3 py-3 rounded-md text-base font-medium cursor-pointer transition-colors duration-150 ease-in-out`;
  const activeClasses = 'bg-primary text-white';
  const inactiveClasses = 'text-textSecondary hover:bg-primary/80 hover:text-white';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {item.icon && <span className="mr-2 inline-block align-middle">{item.icon}</span>}
      {item.label}
    </button>
  );
}
const MobileNavLink = React.memo(MobileNavLinkComponent);

const DropdownIconComponent: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg
    className={`ml-1 h-5 w-5 transform transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
const DropdownIcon = React.memo(DropdownIconComponent);

const AiCreditCounter: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
    const { ai_usage_count_monthly, role } = currentUser;
    const { max_ai_uses_monthly } = role;
    const remainingCredits = max_ai_uses_monthly - ai_usage_count_monthly;
    
    const creditsClass = remainingCredits > (max_ai_uses_monthly * 0.2)
      ? 'text-green-400'
      : remainingCredits > 0 ? 'text-yellow-400' : 'text-danger';

    return (
        <div 
            className="flex items-center px-3 py-2 bg-card border border-lightBorder rounded-md"
            title={`You have ${remainingCredits} out of ${max_ai_uses_monthly} monthly AI credits remaining.`}
        >
            <span role="img" aria-label="credits" className="text-yellow-400 mr-2">⚡</span>
            <span className={`font-mono font-semibold text-sm ${creditsClass}`}>
                {remainingCredits}
            </span>
            <span className="text-xs text-textSecondary mx-1">/</span>
            <span className="text-xs text-textSecondary">{max_ai_uses_monthly}</span>
        </div>
    );
};


export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, isAuthenticated, onLogout, currentUser }) => {
  const [openDropdownLabel, setOpenDropdownLabel] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const visibleNavItems = useMemo(() => {
    if (!currentUser) return [];
    return NAVIGATION_ITEMS.filter(item => {
        if (item.isAdminOnly) {
            return currentUser.role?.name === RoleName.Admin;
        }
        // This view is now under the public-facing pages, not in the main app nav
        if (item.viewName === ViewName.Methodology) {
            return false;
        }
        return true;
    });
  }, [currentUser]);

  const handleToggleDropdown = useCallback((label: string) => {
    setOpenDropdownLabel(prev => (prev === label ? null : label));
  }, []);

  const handleNavigate = useCallback((viewName?: ViewName) => {
    if (viewName) {
      onNavigate(viewName);
    }
    setOpenDropdownLabel(null); 
    setIsMobileMenuOpen(false); 
  }, [onNavigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && openDropdownLabel) {
        const isClickOnDropdownTrigger = (event.target as HTMLElement).closest('[aria-haspopup="true"]');
        if(!isClickOnDropdownTrigger || (isClickOnDropdownTrigger && isClickOnDropdownTrigger.getAttribute('aria-label') !== openDropdownLabel) ) {
            setOpenDropdownLabel(null);
        }
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && isMobileMenuOpen) {
        if (!(event.target as HTMLElement).closest('#mobile-menu-button')) {
          setIsMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownLabel, isMobileMenuOpen]);

  const isViewActive = useCallback((item: NavItem, currentViewToCheck: ViewName): boolean => {
    if (item.viewName) {
      return currentViewToCheck === item.viewName;
    }
    if (item.children) {
      return item.children.some(child => child.viewName === currentViewToCheck);
    }
    return false;
  }, []);

  return (
    <nav className="bg-background shadow-lg border-b border-lightBorder sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16"> 
          <div className="flex items-center">
            <span 
              className="font-bold text-xl sm:text-2xl text-white cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => { 
                  if (isAuthenticated) { handleNavigate(ViewName.Dashboard) } 
              }}
            >
              {APP_TITLE}
            </span>
          </div>

          {isAuthenticated && (
            <div className="hidden md:flex items-center">
              <div className="ml-10 flex items-center space-x-2">
                {visibleNavItems.map((item) => (
                  <div key={item.label} className="relative" ref={item.children ? dropdownRef : null}>
                    {item.children ? (
                      <div>
                        <button
                          onClick={() => handleToggleDropdown(item.label)}
                          aria-label={item.label}
                          className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-150 ease-in-out
                            ${isViewActive(item, currentView)
                              ? 'bg-primary/20 text-primary' 
                              : 'text-textSecondary hover:bg-gray-700 hover:text-white'
                            }`}
                          aria-expanded={openDropdownLabel === item.label}
                          aria-haspopup="true"
                          title={item.label}
                        >
                          {item.icon && <span className="mr-1.5">{item.icon}</span>}
                          {item.label}
                          <DropdownIcon isOpen={openDropdownLabel === item.label} />
                        </button>
                        {openDropdownLabel === item.label && (
                          <div
                            className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-lightBorder focus:outline-none z-50 py-1 transition-all duration-150 ease-out transform opacity-0 scale-95 group-focus-within:opacity-100 group-focus-within:scale-100"
                            role="menu"
                            aria-orientation="vertical"
                            style={{ opacity: 1, transform: 'scale(1)' }} 
                          >
                            {item.children.map((child) => (
                              <NavLink
                                key={child.label}
                                item={child}
                                isActive={currentView === child.viewName}
                                onClick={() => handleNavigate(child.viewName)}
                                isDropdownChild={true}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <NavLink
                        item={item}
                        isActive={currentView === item.viewName}
                        onClick={() => handleNavigate(item.viewName)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center ml-6 space-x-4">
                 <AiCreditCounter currentUser={currentUser} />
                {onLogout && (
                    <Button 
                    onClick={onLogout} 
                    variant="ghost" 
                    size="sm"
                    className="text-textSecondary hover:bg-primary/20 hover:text-white" 
                    leftIcon={<ArrowRightOnRectangleIcon className="h-5 w-5 transform rotate-180" />}
                    title="Logout"
                    >
                    Logout
                    </Button>
                )}
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="md:hidden flex items-center">
              {onLogout && !isMobileMenuOpen && (
                 <Button 
                    onClick={onLogout} 
                    variant="ghost" 
                    size="sm"
                    className="text-textSecondary hover:bg-primary/20 hover:text-white p-2 mr-2"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6 transform rotate-180" />
                  </Button>
              )}
              <button
                id="mobile-menu-button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-textSecondary hover:text-white hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-150 ease-in-out"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? "Close main menu" : "Open main menu"}
                title={isMobileMenuOpen ? "Close main menu" : "Open main menu"}
              >
                {isMobileMenuOpen ? <XMarkIcon className="block h-7 w-7" /> : <Bars3Icon className="block h-7 w-7" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && isMobileMenuOpen && (
        <div 
          id="mobile-menu" 
          ref={mobileMenuRef}
          className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-sm z-40 pt-20 overflow-y-auto" 
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {visibleNavItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <h3 className="px-3 py-2 text-sm font-semibold text-textSecondary uppercase tracking-wider">{item.label}</h3>
                    {item.children.map((child) => (
                      <MobileNavLink
                        key={child.label}
                        item={child}
                        isActive={currentView === child.viewName}
                        onClick={() => handleNavigate(child.viewName)}
                      />
                    ))}
                  </>
                ) : (
                  <MobileNavLink
                    item={item}
                    isActive={currentView === item.viewName}
                    onClick={() => handleNavigate(item.viewName)}
                  />
                )}
              </div>
            ))}
             <div className="py-4 px-2 border-t border-lightBorder">
                 <AiCreditCounter currentUser={currentUser} />
             </div>
          </div>
          {onLogout && (
             <div className="py-4 px-2 border-t border-lightBorder">
                <Button 
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false);}} 
                  variant="ghost" 
                  className="w-full text-textSecondary hover:bg-primary/20 hover:text-white justify-start px-3 py-3"
                  leftIcon={<ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 transform rotate-180" />}
                  title="Logout"
                >
                  Logout
                </Button>
             </div>
          )}
        </div>
      )}
    </nav>
  );
};
