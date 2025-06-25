
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AuthViewType, User } from '../../types';
import { LOCAL_STORAGE_USERS_KEY, LOCAL_STORAGE_AUTH_TOKEN_KEY, APP_TITLE } from '../../constants';
import { LockClosedIcon, UserCircleIcon } from '../ui/Icons'; // Assuming you have these icons

interface LoginPageViewProps {
  setAuthView: (view: AuthViewType) => void;
  onLoginSuccess: (email: string) => void;
}

export const LoginPageView: React.FC<LoginPageViewProps> = ({ setAuthView, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      
      const foundUser = users.find(user => user.email === email);

      // IMPORTANT: This is a MOCK password check.
      // In a real app, never store or compare plaintext passwords.
      // Hashing would be done on the backend. Here, we assume passwordHash is the "password" for simplicity.
      if (foundUser && foundUser.passwordHash === password) {
        localStorage.setItem(LOCAL_STORAGE_AUTH_TOKEN_KEY, email); // Store email as mock token
        onLoginSuccess(email);
      } else {
        setError('Invalid email or password.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card title={`Login to ${APP_TITLE}`} className="max-w-md w-full space-y-8 bg-gray-800 bg-opacity-70 border border-gray-700 shadow-2xl p-8 sm:p-10">
        <form className="space-y-6" onSubmit={handleLogin}>
          <Input
            label="Email address"
            id="email-login"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            // leftIcon={<UserCircleIcon className="h-5 w-5 text-gray-400" />}
          />
          <Input
            label="Password"
            id="password-login"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            // leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          />

          {error && <p className="text-sm text-danger text-center">{error}</p>}

          <Button type="submit" variant="primary" className="w-full bg-accent hover:bg-emerald-600" isLoading={isLoading} size="lg">
            {isLoading ? 'Logging in...' : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <button onClick={() => setAuthView('register')} className="font-medium text-accent hover:text-emerald-400 focus:outline-none">
            Sign up here
          </button>
        </p>
         <p className="mt-4 text-xs text-gray-500 text-center">
            Note: This is a prototype. Login is simulated.
          </p>
      </Card>
    </div>
  );
};
