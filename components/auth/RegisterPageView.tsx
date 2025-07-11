import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AuthViewType } from '../../types';
import { APP_TITLE } from '../../constants';
import { useToast } from '../ui/ToastProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../services/supabaseClient';
import { IdentificationIcon, EnvelopeIcon, LockClosedIcon } from '../ui/Icons';

interface RegisterPageViewProps {
  setAuthView: (view: AuthViewType) => void;
}

const registerSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Confirm password is required")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPageView: React.FC<RegisterPageViewProps> = ({ setAuthView }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const handleRegister = async (data: RegisterFormData) => {
    setServerError(null);
    setIsLoading(true);

    const { data: { user }, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        }
      }
    });

    if (error) {
      setServerError(error.message);
      showToast(error.message, "error");
    } else if (user) {
      showToast("Registration successful! Check your email for confirmation.", "success");
      setAuthView('login');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card title={`Create an Account for ${APP_TITLE}`} className="max-w-md w-full space-y-8 p-8 sm:p-10">
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
            leftIcon={<IdentificationIcon className="w-5 h-5 text-gray-400" />}
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
            leftIcon={<EnvelopeIcon className="w-5 h-5 text-gray-400" />}
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
            leftIcon={<LockClosedIcon className="w-5 h-5 text-gray-400" />}
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
            leftIcon={<LockClosedIcon className="w-5 h-5 text-gray-400" />}
          />

          {serverError && <p className="text-sm text-danger text-center">{serverError}</p>}

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} size="lg">
            {isLoading ? 'Registering...' : 'Create Account'}
          </Button>
        </form>
        <p className="text-center text-sm text-textSecondary">
          Already have an account?{' '}
          <button 
            onClick={() => setAuthView('login')} 
            className="font-medium text-primary hover:text-accent focus:outline-none focus:ring-2 focus:ring-primary rounded"
            type="button"
          >
            Sign in here
          </button>
        </p>
         <p className="mt-4 text-xs text-textSecondary text-center">
            You'll receive a confirmation email to verify your account.
          </p>
      </Card>
    </div>
  );
};