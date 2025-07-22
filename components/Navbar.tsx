import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NavItem, ViewName, UserProfile, RoleName } from '../types';
import { APP_TITLE, NAVIGATION_ITEMS, VIEW_PATH_MAP } from '../constants';
import { Button } from './ui/Button'; 
import { ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from './ui/Icons'; 

interface NavbarProps {
  isAuthenticated: boolean;
  onLogout?: () => void;
  currentUser: UserProfile;
}

const DropdownIconComponent: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg className={`ml-1 h-5 w-5 transform transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const DropdownIcon = React.memo(DropdownIconComponent);

const AiCreditCounter: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
    const { ai_usage_count_monthly, role } = currentUser;
    const { max_ai_uses_monthly } = role;
    const remainingCredits = max_ai_uses_monthly - ai_usage_count_monthly;
    
    const creditsClass = remainingCredits > (max_ai_uses_monthly * 0.2) ? 'text-green-400' : remainingCredits > 0 ? 'text-yellow-400' : 'text-destructive';

    return (
        <div className="flex items-center px-3 py-2 bg-card/70 backdrop-blur-sm border border-border/50 rounded-md" title={`You have ${remainingCredits} out of ${max_ai_uses_monthly} monthly AI credits remaining.`}>
            <span role="img" aria-label="credits" className="text-yellow-400 mr-2">⚡</span>
            <span className={`font-mono font-semibold text-sm ${creditsClass}`}>{remainingCredits}</span>
            <span className="text-xs text-muted-foreground mx-1">/</span>
            <span className="text-xs text-muted-foreground">{max_ai_uses_monthly}</span>
        </div>
    );
};

export const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, onLogout, currentUser }) => {
  const [openDropdownLabel, setOpenDropdownLabel] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const visibleNavItems = useMemo(() => {
    if (!currentUser) return [];
    return NAVIGATION_ITEMS.filter(item => !item.isAdminOnly || (item.isAdminOnly && currentUser.role?.name === RoleName.Admin));
  }, [currentUser]);

  const handleToggleDropdown = useCallback((label: string) => {
    setOpenDropdownLabel(prev => (prev === label ? null : label));
  }, []);

  const closeMenus = useCallback(() => {
    setOpenDropdownLabel(null); 
    setIsMobileMenuOpen(false); 
  }, []);

  useEffect(() => {
    closeMenus();
  }, [location.pathname, closeMenus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && openDropdownLabel) {
        if (!(event.target as HTMLElement).closest(`[aria-label="${openDropdownLabel}"]`)) {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownLabel, isMobileMenuOpen]);

  const isViewActiveInDropdown = useCallback((item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => child.viewName && location.pathname.startsWith(VIEW_PATH_MAP[child.viewName]));
  }, [location.pathname]);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out flex items-center ${
      isActive 
      ? 'bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary shadow-lg' 
      : 'text-muted-foreground hover:bg-card/70 hover:text-white'
    }`;
    
  const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-3 rounded-md text-base font-medium cursor-pointer transition-colors duration-150 ease-in-out flex items-center ${
      isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-primary/80 hover:text-white'
    }`;

  return (
    <nav className="bg-background/70 backdrop-blur-md shadow-lg border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16"> 
          <NavLink 
            to={isAuthenticated ? VIEW_PATH_MAP.Dashboard : '/'}
            className="font-bold text-xl sm:text-2xl text-white cursor-pointer transition-opacity hover:opacity-80"
          >
            {APP_TITLE}
          </NavLink>

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
                          className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200 ease-in-out ${
                              isViewActiveInDropdown(item) 
                              ? 'bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary shadow-lg' 
                              : 'text-muted-foreground hover:bg-card/70 hover:text-white'
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
                          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card/95 backdrop-blur-sm ring-1 ring-border/50 focus:outline-none z-50 py-1" role="menu">
                            {item.children.map((child) => child.viewName && (
                              <NavLink key={child.label} to={VIEW_PATH_MAP[child.viewName]} className={({ isActive }) => `block px-3 py-2 rounded-md text-sm font-medium cursor-pointer w-full text-left flex items-center ${isActive ? 'bg-primary/80 text-white' : 'text-foreground hover:bg-card/70 hover:text-white'}`}>
                                {child.icon && <span className="mr-2 inline-block align-middle">{child.icon}</span>}
                                {child.label}
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      item.viewName && <NavLink to={VIEW_PATH_MAP[item.viewName]} className={navLinkClasses}>
                        {item.icon && <span className="mr-2 inline-block align-middle">{item.icon}</span>}
                        {item.label}
                      </NavLink>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center ml-6 space-x-4">
                 <AiCreditCounter currentUser={currentUser} />
                {onLogout && ( <Button onClick={onLogout} variant="ghost" size="sm" className="text-muted-foreground hover:bg-primary/20 hover:text-white" leftIcon={<ArrowRightOnRectangleIcon className="h-5 w-5 transform rotate-180" />} title="Logout">Logout</Button> )}
              </div>
            </div>
          )}
          {isAuthenticated && (
            <div className="md:hidden flex items-center">
              {onLogout && !isMobileMenuOpen && ( <Button onClick={onLogout} variant="ghost" size="sm" className="text-muted-foreground hover:bg-primary/20 hover:text-white p-2 mr-2" aria-label="Logout" title="Logout"><ArrowRightOnRectangleIcon className="h-6 w-6 transform rotate-180" /></Button> )}
              <button id="mobile-menu-button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-muted-foreground hover:text-white hover:bg-primary/20 focus:outline-none" aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen} aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} title={isMobileMenuOpen ? "Close menu" : "Open menu"}>
                {isMobileMenuOpen ? <XMarkIcon className="block h-7 w-7" /> : <Bars3Icon className="block h-7 w-7" />}
              </button>
            </div>
          )}
        </div>
      </div>
      {isAuthenticated && isMobileMenuOpen && (
        <div id="mobile-menu" ref={mobileMenuRef} className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-sm z-40 pt-20 overflow-y-auto">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {visibleNavItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</h3>
                    {item.children.map((child) => child.viewName && (
                      <NavLink key={child.label} to={VIEW_PATH_MAP[child.viewName]} className={mobileNavLinkClasses}>
                        {child.icon && <span className="mr-2 inline-block align-middle">{child.icon}</span>}
                        {child.label}
                      </NavLink>
                    ))}
                  </>
                ) : (
                  item.viewName && <NavLink to={VIEW_PATH_MAP[item.viewName]} className={mobileNavLinkClasses}>
                    {item.icon && <span className="mr-2 inline-block align-middle">{item.icon}</span>}
                    {item.label}
                  </NavLink>
                )}
              </div>
            ))}
             <div className="py-4 px-2 border-t border-border"><AiCreditCounter currentUser={currentUser} /></div>
          </div>
          {onLogout && (
             <div className="py-4 px-2 border-t border-border"><Button onClick={() => { onLogout(); setIsMobileMenuOpen(false);}} variant="ghost" className="w-full text-muted-foreground hover:bg-primary/20 hover:text-white justify-start px-3 py-3" leftIcon={<ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 transform rotate-180" />} title="Logout">Logout</Button></div>
          )}
        </div>
      )}
    </nav>
  );
};