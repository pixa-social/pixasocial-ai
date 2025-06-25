
import React from 'react';
import { APP_TITLE } from '../../constants';
import { AuthViewType } from '../../types';
import { HomePageView } from './HomePageView';
import { LoginPageView } from './LoginPageView';
import { RegisterPageView } from './RegisterPageView';

interface AuthLayoutProps {
  authView: AuthViewType;
  setAuthView: (view: AuthViewType) => void;
  onLoginSuccess: (email: string) => void; // email or mock token
  onRegisterSuccess: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ authView, setAuthView, onLoginSuccess, onRegisterSuccess }) => {
  const renderAuthView = () => {
    switch (authView) {
      case 'login':
        return <LoginPageView setAuthView={setAuthView} onLoginSuccess={onLoginSuccess} />;
      case 'register':
        return <RegisterPageView setAuthView={setAuthView} onRegisterSuccess={onRegisterSuccess} />;
      case 'home':
      default:
        return <HomePageView setAuthView={setAuthView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-primary to-gray-900 text-white">
      <header className="py-6 px-4 sm:px-6 lg:px-8 shadow-lg bg-gray-900 bg-opacity-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight cursor-pointer" onClick={() => setAuthView('home')}>
            {APP_TITLE}
          </h1>
          <nav className="space-x-4">
            {authView !== 'login' && (
              <button
                onClick={() => setAuthView('login')}
                className="px-4 py-2 text-sm font-medium hover:bg-blue-700 rounded-md transition-colors"
              >
                Login
              </button>
            )}
            {authView !== 'register' && (
              <button
                onClick={() => setAuthView('register')}
                className="px-4 py-2 text-sm font-medium bg-accent hover:bg-emerald-600 rounded-md transition-colors"
              >
                Sign Up
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="w-full"> 
          {renderAuthView()}
        </div>
      </main>

      <footer className="py-8 text-center text-gray-400 text-sm bg-gray-900 bg-opacity-30">
        &copy; {new Date().getFullYear()} {APP_TITLE}. Advanced AI for Strategic Social Engagement.
        <p className="mt-1">This is a prototype. Authentication is simulated and not secure for production use.</p>
      </footer>
    </div>
  );
};
