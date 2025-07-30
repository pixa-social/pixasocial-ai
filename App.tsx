



import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthLayout } from './components/auth/AuthLayout';
import { MainAppLayout } from './components/MainAppLayout';
import { ViewName, RoleName } from './types/app';
import { User, UserProfile, RoleType } from './types/user';
import { Database, TablesUpdate } from './types/supabase';
import { VIEW_PATH_MAP } from './constants';
import { ToastProvider, useToast } from './components/ui/ToastProvider';
import { supabase } from './services/supabaseClient';
import type { AuthSession } from '@supabase/supabase-js';

import { DashboardView } from './components/DashboardView';
import { AIAgentsView } from './components/ai-agents/AIAgentsView';
import { AudienceModelingView } from './components/audience-modeling/AudienceModelingView';
import { AnalyticsView } from './components/AnalyticsView';
import { OperatorBuilderView } from './components/OperatorBuilderView';
import { ContentPlannerView } from './components/ContentPlannerView';
import { CalendarView } from './components/CalendarView';
import { FeedbackSimulatorView } from './components/FeedbackSimulatorView';
import { AuditToolView } from './components/AuditToolView';
import { AdminPanelView } from './components/AdminPanelView';
import { SettingsView } from './components/SettingsView';
import { ContentLibraryView } from './components/ContentLibraryView';
import { ChatView } from './components/ChatView';
import { SocialPosterView } from './components/social-poster/SocialPosterView';
import { AISpeechGenerationView } from './components/AISpeechGenerationView';
import { MethodologyView } from './components/MethodologyView';
import { PaymentsView } from './components/PaymentsView';

const AppContent: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
          setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
       if (!session) {
          setCurrentUser(null);
          setIsLoading(false);
      }
    });

    return () => {
        subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const injectScriptsAndFavicon = async () => {
      try {
        const { data, error } = await supabase.from('seo_settings').select('header_scripts, footer_scripts, favicon_url').single();
        if (error) { if (error.code !== 'PGRST116') console.warn('Could not fetch SEO settings:', error.message); return; }
        if (!data) return;

        // Favicon injection logic
        if (data.favicon_url) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.favicon_url;
        }

        // Script injection logic
        const inject = (content: string, target: 'head' | 'body') => {
          if (!content) return;
          const scriptContainer = document.createElement('div');
          scriptContainer.innerHTML = content;
          const scripts = Array.from(scriptContainer.querySelectorAll('script'));
          scripts.forEach(s => {
            const newScript = document.createElement('script');
            if (s.src) newScript.src = s.src; else newScript.innerHTML = s.innerHTML;
            if (s.async) newScript.async = true; if (s.defer) newScript.defer = true; if (s.type) newScript.type = s.type;
            if (target === 'head') document.head.appendChild(newScript); else document.body.appendChild(newScript);
          });
        };
        inject(data.header_scripts || '', 'head');
        inject(data.footer_scripts || '', 'body');
      } catch (e) { console.warn('Failed to fetch or inject SEO settings:', (e as Error).message); }
    };
    injectScriptsAndFavicon();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async (supabaseUser: any) => {
        setIsLoading(true);
        try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).single();
            const { data: userRole } = await supabase.from('user_roles').select('role_id').eq('user_id', supabaseUser.id).single();
            let roleData: RoleType | null = null;
            if (userRole) {
                const { data: roleTypeData } = await supabase.from('role_types').select('*').eq('id', userRole.role_id).single();
                roleData = roleTypeData as RoleType;
            }
            const defaultRole: RoleType = {
                id: 'default-free-role-id', name: RoleName.Free, max_personas: 1, max_ai_uses_monthly: 10,
                price_monthly: 0, price_yearly: 0, features: ['Basic Access'], created_at: new Date().toISOString(), updated_at: null
            };
            const user: UserProfile = {
                id: supabaseUser.id, email: supabaseUser.email, name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email,
                walletAddress: profile?.wallet_address, teamMembers: profile?.team_members || [],
                role_name: (roleData?.name as RoleName) || RoleName.Free, role: roleData ? { ...roleData, name: roleData.name as RoleName } : defaultRole,
                ai_usage_count_monthly: profile?.ai_usage_count_monthly || 0, assigned_ai_model_text: profile?.assigned_ai_model_text, assigned_ai_model_image: profile?.assigned_ai_model_image,
            };
            setCurrentUser(user);
        } catch (error) {
            console.error("Error building user profile:", error);
            showToast("Error fetching your profile.", "error");
        } finally {
            setIsLoading(false);
        }
    };
    if (session?.user) { fetchUserProfile(session.user); }
    else { setIsLoading(false); setCurrentUser(null); }
  }, [session, showToast]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { showToast(`Logout failed: ${error.message}`, 'error'); }
    else { navigate('/', { replace: true }); showToast("You have been logged out.", "info"); }
  }, [showToast, navigate]);

  const handleUpdateUser = useCallback(async (updatedUserData: Partial<UserProfile>) => {
    if (!currentUser) { showToast("No user to update.", "error"); return; }
    const updatePayload: TablesUpdate<'profiles'> = {
        wallet_address: updatedUserData.walletAddress || null, team_members: updatedUserData.teamMembers || [], name: updatedUserData.name || null, updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', currentUser.id);
    if (error) { showToast(`Error saving profile: ${error.message}`, "error"); }
    else { setCurrentUser(prev => prev ? ({ ...prev, ...updatedUserData }) : null); showToast("Profile updated successfully!", "success"); }
  }, [currentUser, showToast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {currentUser ? (
        <Route element={<MainAppLayout currentUser={currentUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />}>
          <Route index element={<Navigate to={VIEW_PATH_MAP[ViewName.Dashboard]} replace />} />
          <Route path={VIEW_PATH_MAP[ViewName.Dashboard]} element={<DashboardView />} />
          <Route path={VIEW_PATH_MAP[ViewName.AIAgents]} element={<AIAgentsView />} />
          <Route path={VIEW_PATH_MAP[ViewName.AudienceModeling]} element={<AudienceModelingView />} />
          <Route path={VIEW_PATH_MAP[ViewName.Analytics]} element={<AnalyticsView />} />
          <Route path={VIEW_PATH_MAP[ViewName.OperatorBuilder]} element={<OperatorBuilderView />} />
          <Route path={VIEW_PATH_MAP[ViewName.ContentPlanner]} element={<ContentPlannerView />} />
          <Route path={VIEW_PATH_MAP[ViewName.Calendar]} element={<CalendarView />} />
          <Route path={VIEW_PATH_MAP[ViewName.ContentLibrary]} element={<ContentLibraryView />} />
          <Route path={VIEW_PATH_MAP[ViewName.FeedbackSimulator]} element={<FeedbackSimulatorView />} />
          <Route path={VIEW_PATH_MAP[ViewName.AuditTool]} element={<AuditToolView />} />
          <Route path={VIEW_PATH_MAP[ViewName.SocialPoster]} element={<SocialPosterView />} />
          <Route path={VIEW_PATH_MAP[ViewName.AISpeechGeneration]} element={<AISpeechGenerationView />} />
          <Route path={VIEW_PATH_MAP[ViewName.Methodology]} element={<MethodologyView />} />
          {currentUser.role_name === RoleName.Admin && <Route path={VIEW_PATH_MAP[ViewName.AdminPanel]} element={<AdminPanelView />} />}
          <Route path={VIEW_PATH_MAP[ViewName.Settings]} element={<SettingsView />} />
          <Route path={VIEW_PATH_MAP[ViewName.TeamChat]} element={<ChatView />} />
          <Route path={VIEW_PATH_MAP[ViewName.Payments]} element={<PaymentsView />} />
          <Route path="*" element={<Navigate to={VIEW_PATH_MAP[ViewName.Dashboard]} replace />} />
        </Route>
      ) : (
        <Route path="*" element={<AuthLayout />} />
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;