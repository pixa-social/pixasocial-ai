
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AuthViewType, User } from '../../types';
import { LOCAL_STORAGE_USERS_KEY, APP_TITLE } from '../../constants';
import { useToast } from '../ui/ToastProvider'; // Import useToast

interface RegisterPageViewProps {
  setAuthView: (view: AuthViewType) => void;
  onRegisterSuccess: () => void;
}

export const RegisterPageView: React.FC<RegisterPageViewProps> = ({ setAuthView, onRegisterSuccess }) => {
  const { showToast } = useToast(); // Use the toast hook
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

      if (users.find(user => user.email === email)) {
        setError("An account with this email already exists.");
        setIsLoading(false);
        return;
      }

      const newUser: User = { id: Date.now().toString(), name, email, passwordHash: password };
      users.push(newUser);
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
      
      setIsLoading(false);
      // showToast is handled by onRegisterSuccess in App.tsx
      onRegisterSuccess(); 
      // setAuthView('login'); // Navigation is handled by onRegisterSuccess in App.tsx

    }, 1000);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card title={`Create an Account for ${APP_TITLE}`} className="max-w-md w-full space-y-8 bg-gray-800 bg-opacity-70 border border-gray-700 shadow-2xl p-8 sm:p-10">
        <form className="space-y-6" onSubmit={handleRegister}>
          <Input
            label="Full Name"
            id="name-register"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
          />
          <Input
            label="Email address"
            id="email-register"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            id="password-register"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••• (min. 6 characters)"
          />
          <Input
            label="Confirm Password"
            id="confirm-password-register"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <p className="text-sm text-danger text-center">{error}</p>}

          <Button type="submit" variant="primary" className="w-full bg-accent hover:bg-emerald-600" isLoading={isLoading} size="lg">
            {isLoading ? 'Registering...' : 'Create Account'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <button onClick={() => setAuthView('login')} className="font-medium text-accent hover:text-emerald-400 focus:outline-none">
            Sign in here
          </button>
        </p>
         <p className="mt-4 text-xs text-gray-500 text-center">
            Note: This is a prototype. Registration is simulated.
          </p>
      </Card>
    </div>
  );
};
