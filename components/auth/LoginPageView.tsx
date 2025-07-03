import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AuthViewType } from '../../types';
import { APP_TITLE } from '../../constants';
import { supabase } from '../../services/supabaseClient';

interface LoginPageViewProps {
  setAuthView: (view: AuthViewType) => void;
  onLoginSuccess: (email: string) => void;
}

export const LoginPageView: React.FC<LoginPageViewProps> = ({ setAuthView, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        onLoginSuccess(email);
      } else {
        setError('Login failed. No session returned.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
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
      </Card>
    </div>
  );
};
