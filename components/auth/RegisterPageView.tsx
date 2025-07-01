import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AuthViewType, User } from '../../types';
import { LOCAL_STORAGE_USERS_KEY, APP_TITLE } from '../../constants';
import { useToast } from '../ui/ToastProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface RegisterPageViewProps {
  setAuthView: (view: AuthViewType) => void;
  onRegisterSuccess: () => void;
}

const registerSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Confirm password is required")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // path of error
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPageView: React.FC<RegisterPageViewProps> = ({ setAuthView, onRegisterSuccess }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const handleRegister = (data: RegisterFormData) => {
    setServerError(null);
    setIsLoading(true);

    setTimeout(() => {
      const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

      if (users.find(user => user.email === data.email)) {
        setServerError("An account with this email already exists.");
        setIsLoading(false);
        return;
      }

      const newUser: User = { 
        id: Date.now().toString(), 
        name: data.name, 
        email: data.email, 
        passwordHash: data.password // In a real app, hash this on the backend
      };
      users.push(newUser);
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
      
      setIsLoading(false);
      onRegisterSuccess(); 

    }, 1000);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card title={`Create an Account for ${APP_TITLE}`} className="max-w-md w-full space-y-8 bg-gray-800 bg-opacity-70 border border-gray-700 shadow-2xl p-8 sm:p-10">
        <form className="space-y-6" onSubmit={handleSubmit(handleRegister)}>
          <Input
            label="Full Name"
            id="name-register"
            type="text"
            autoComplete="name"
            {...register("name")}
            error={errors.name?.message}
            aria-invalid={errors.name ? "true" : "false"}
            placeholder="Your Name"
          />
          <Input
            label="Email address"
            id="email-register"
            type="email"
            autoComplete="email"
            {...register("email")}
            error={errors.email?.message}
            aria-invalid={errors.email ? "true" : "false"}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            id="password-register"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
            aria-invalid={errors.password ? "true" : "false"}
            placeholder="•••••••• (min. 6 characters)"
          />
          <Input
            label="Confirm Password"
            id="confirm-password-register"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
            placeholder="••••••••"
          />

          {serverError && <p className="text-sm text-danger text-center">{serverError}</p>}

          <Button type="submit" variant="primary" className="w-full bg-accent hover:bg-emerald-600" isLoading={isLoading} size="lg">
            {isLoading ? 'Registering...' : 'Create Account'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <button 
            onClick={() => setAuthView('login')} 
            className="font-medium text-accent hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-accent rounded"
            type="button"
          >
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
