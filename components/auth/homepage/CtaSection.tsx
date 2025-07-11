import React from 'react';
import { Button } from '../../ui/Button';
import { AuthViewType } from '../../../types';

interface CtaSectionProps {
  setAuthView: (view: AuthViewType) => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ setAuthView }) => {
  return (
    <div className="mt-16 sm:mt-20 lg:mt-24 max-w-4xl mx-auto text-center px-4 animate-fade-in-up" style={{ animationDelay: '800ms', opacity: 0 }}>
      <h3 className="text-3xl font-bold tracking-tight text-white mb-6">
        Get Started Today
      </h3>
      <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
        Join the future of social engagement. Sign up for a free trial and experience the most powerful platform where AI meets psychology to make your message unstoppable.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-x-6">
        <Button
          size="lg"
          variant="primary"
          className="w-full sm:w-auto"
          onClick={() => setAuthView('register')}
        >
          Get Started Free
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => setAuthView('login')}
        >
          Login to Your Account
        </Button>
      </div>
    </div>
  );
};