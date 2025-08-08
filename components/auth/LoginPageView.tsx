
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AuthViewType } from '../../types';
import { APP_TITLE } from '../../constants';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../ui/ToastProvider';
import { UserCircleIcon, LockClosedIcon } from '../ui/Icons';

interface LoginPageViewProps {
  setAuthView: (view: AuthViewType) => void;
}

export const LoginPageView: React.FC<LoginPageViewProps> = ({ setAuthView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      setError(signInError.message);
      showToast(signInError.message, 'error');
    } else {
      showToast('Login successful!', 'success');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card title={`Login to ${APP_TITLE}`} className="max-w-md w-full space-y-8 p-8 sm:p-10">
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
            leftIcon={<UserCircleIcon className="h-5 w-5 text-gray-400" />}
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
            leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          />

          {error && <p className="text-sm text-danger text-center">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} size="lg">
            {isLoading ? 'Logging in...' : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-sm text-textSecondary">
          Don't have an account?{' '}
          <button onClick={() => setAuthView('register')} className="font-medium text-primary hover:text-accent focus:outline-none">
            Sign up here
          </button>
        </p>
         <p className="mt-4 text-xs text-textSecondary text-center">
            Secure and reliable login.
          </p>
      </Card>
    </div>
  );
};
