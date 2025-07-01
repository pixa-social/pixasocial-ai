import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { SupabaseAuthLayout } from './auth/SupabaseAuthLayout';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { SupabaseMainApp } from './SupabaseMainApp';

export const SupabaseApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading PixaSocial AI..." />
      </div>
    );
  }

  if (!user) {
    return <SupabaseAuthLayout />;
  }

  return <SupabaseMainApp user={user} profile={profile} />;
};