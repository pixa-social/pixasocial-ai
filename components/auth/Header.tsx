import React from 'react';
import { APP_TITLE } from '../../constants';
import { AuthViewType } from '../../types';

interface HeaderProps {
  authView: AuthViewType;
  setAuthView: (view: AuthViewType) => void;
}

export const Header: React.FC<HeaderProps> = ({ authView, setAuthView }) => {
  return (
    <header className="py-6 px-4 sm:px-6 lg:px-8 shadow-lg bg-gray-900 bg-opacity-30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 
          className="text-3xl font-bold tracking-tight cursor-pointer transition-opacity hover:opacity-80" 
          onClick={() => setAuthView('home')}
          aria-label={`${APP_TITLE} - Home`}
        >
          {APP_TITLE}
        </h1>
        <nav className="space-x-2 sm:space-x-4">
          {authView !== 'home' && (
              <button
              onClick={() => setAuthView('home')}
              className="px-3 py-2 text-sm font-medium hover:bg-blue-700 rounded-md transition-colors"
            >
              Home
            </button>
          )}
          {authView !== 'login' && (
            <button
              onClick={() => setAuthView('login')}
              className="px-3 py-2 text-sm font-medium hover:bg-blue-700 rounded-md transition-colors"
            >
              Login
            </button>
          )}
          {authView !== 'register' && (
            <button
              onClick={() => setAuthView('register')}
              className="px-3 py-2 text-sm font-medium bg-accent hover:bg-emerald-600 rounded-md transition-colors"
            >
              Sign Up
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;