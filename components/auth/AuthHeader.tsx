import React from 'react';
import { APP_TITLE } from '../../constants';
import { AuthViewType } from '../../types';
import { Button } from '../ui/Button';

interface AuthHeaderProps {
  authView: AuthViewType;
  setAuthView: (view: AuthViewType) => void;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ authView, setAuthView }) => {
  const navLinks: { view: AuthViewType, label: string }[] = [
    { view: 'features', label: 'Features' },
    { view: 'pricing', label: 'Pricing' },
    { view: 'documentation', label: 'Docs' },
  ];

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1
          className="text-2xl font-bold tracking-tight cursor-pointer text-foreground transition-opacity hover:opacity-80"
          onClick={() => setAuthView('home')}
          aria-label={`${APP_TITLE} - Home`}
        >
          {APP_TITLE}
        </h1>
        <div className="flex items-center space-x-2">
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map(link => (
                <Button
                  key={link.view}
                  variant='ghost'
                  onClick={() => setAuthView(link.view)}
                  className={`${authView === link.view ? 'text-foreground bg-accent' : 'text-muted-foreground'}`}
                >
                  {link.label}
                </Button>
              ))}
            </nav>
            <div className='hidden md:block w-px h-6 bg-border mx-2'></div>
            <Button
              variant='ghost'
              onClick={() => setAuthView('login')}
              className={`${authView === 'login' ? 'text-foreground bg-accent' : 'text-muted-foreground'}`}
            >
              Login
            </Button>
            <Button
              variant='primary'
              onClick={() => setAuthView('register')}
            >
              Sign Up
            </Button>
        </div>
      </div>
    </header>
  );
};
