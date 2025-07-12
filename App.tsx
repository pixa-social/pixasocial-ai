import React, { useState, useCallback, useEffect } from 'react';
import { AuthLayout } from './components/auth/AuthLayout';
import { MainAppLayout } from './components/MainAppLayout';
import { ViewName, User, AuthViewType, UserProfile, RoleName, RoleType, Database } from './types';
import { 
  LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, 
  LOCAL_STORAGE_AI_CONFIG_KEY, 
  AI_PROVIDERS_CONFIG_TEMPLATE
} from './constants';
import { getActiveAiProviderType } from './services/ai/aiUtils';
import { ToastProvider, useToast } from './components/ui/ToastProvider';
import { supabase } from './services/supabaseClient';
import type { AuthSession } from '@supabase/supabase-js';

const AppContent: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authView, setAuthView] = useState<AuthViewType>('home');
  const [currentAppView, setCurrentAppView] = useState<ViewName>(ViewName.Dashboard);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    if (!localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY)) {
      localStorage.setItem(LOCAL_STORAGE_AI_CONFIG_KEY, JSON.stringify(AI_PROVIDERS_CONFIG_TEMPLATE));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY)) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, getActiveAiProviderType());
    }

    return () => {
        subscription?.unsubscribe();
    };
  }, []);

  // Inject global SEO scripts
  useEffect(() => {
    const injectScripts = async () => {
      try {
        const { data, error } = await supabase
          .from('seo_settings')
          .select('header_scripts, footer_scripts')
          .single();

        if (error || !data) {
          if (error && error.code !== 'PGRST116') { // Don't log "no rows" error
            console.error('Error fetching SEO settings:', error.message);
          }
          return;
        }
        
        const inject = (content: string, target: 'head' | 'body') => {
          if (!content) return;
          // Use a temporary div to parse the string into DOM nodes
          const scriptContainer = document.createElement('div');
          scriptContainer.innerHTML = content;
          
          // Find all script tags within the parsed content
          const scripts = Array.from(scriptContainer.querySelectorAll('script'));
          scripts.forEach(s => {
            const newScript = document.createElement('script');
            // Copy src if it exists, otherwise copy inline content
            if (s.src) {
              newScript.src = s.src;
            } else {
              newScript.innerHTML = s.innerHTML;
            }
            // Copy async, defer, and type attributes
            if (s.async) newScript.async = true;
            if (s.defer) newScript.defer = true;
            if (s.type) newScript.type = s.type;

            // Append the new script to the specified target
            if (target === 'head') document.head.appendChild(newScript);
            else document.body.appendChild(newScript);
          });
        };
        
        inject(data.header_scripts || '', 'head');
        inject(data.footer_scripts || '', 'body');
        
      } catch (e) {
        console.error('Failed to inject SEO scripts:', e);
      }
    };

    injectScripts();
  }, []); // Run only once when the app loads

  useEffect(() => {
    const fetchUserProfile = async (supabaseUser: any) => {
        setIsLoading(true);
        try {
            // Step 1: Fetch core profile data
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // Ignore "no rows" error
                throw new Error(`Profile fetch error: ${profileError.message}`);
            }

            // Step 2: Fetch the user's role assignment from the join table
            const { data: userRole, error: userRoleError } = await supabase
                .from('user_roles')
                .select('role_id')
                .eq('user_id', supabaseUser.id)
                .single();
            
            let roleData: RoleType | null = null;
            if (userRoleError && userRoleError.code !== 'PGRST116') {
                console.warn(`Could not fetch user role: ${userRoleError.message}`);
            } else if (userRole) {
                // Step 3: Fetch the details of that role
                const { data: roleTypeData, error: roleTypeError } = await supabase
                    .from('role_types')
                    .select('*')
                    .eq('id', userRole.role_id)
                    .single();
                
                if (roleTypeError) {
                    console.error(`Could not fetch role type details: ${roleTypeError.message}`);
                } else {
                    roleData = roleTypeData as RoleType;
                }
            }
            
            const defaultRole: RoleType = {
                id: 'default-free-role-id', name: RoleName.Free, max_personas: 1, max_ai_uses_monthly: 10, 
                price_monthly: 0, price_yearly: 0, features: ['Basic Access'], created_at: new Date().toISOString(), updated_at: null
            };

            const user: UserProfile = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email,
                walletAddress: profile?.wallet_address,
                teamMembers: profile?.team_members || [],
                role_name: (roleData?.name as RoleName) || RoleName.Free,
                role: roleData ? { ...roleData, name: roleData.name as RoleName } : defaultRole,
                ai_usage_count_monthly: profile?.ai_usage_count_monthly || 0,
                assigned_ai_model_text: profile?.assigned_ai_model_text,
                assigned_ai_model_image: profile?.assigned_ai_model_image,
            };
            setCurrentUser(user);

        } catch (error) {
            console.error("Error building user profile:", error);
            showToast("Error fetching your profile. A default 'Free' role will be applied.", "error");
            // Still create a default user object so the app doesn't crash
            const defaultRole: RoleType = {
                id: 'default-free-role-id', name: RoleName.Free, max_personas: 1, max_ai_uses_monthly: 10, 
                price_monthly: 0, price_yearly: 0, features: ['Basic Access'], created_at: new Date().toISOString(), updated_at: null
            };
            const user: UserProfile = {
                id: supabaseUser.id, email: supabaseUser.email,
                name: supabaseUser.user_metadata?.name || supabaseUser.email,
                role: defaultRole, role_name: RoleName.Free,
                ai_usage_count_monthly: 0, teamMembers: [], walletAddress: undefined,
            };
            setCurrentUser(user);
        } finally {
            setIsLoading(false);
        }
    };

    if (session?.user) {
        fetchUserProfile(session.user);
    } else {
        setCurrentUser(null);
        setIsLoading(false);
    }
  }, [session, showToast]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast(`Logout failed: ${error.message}`, 'error');
    } else {
      setAuthView('home');
      setCurrentAppView(ViewName.Dashboard);
      showToast("You have been logged out.", "info");
    }
  }, [showToast]);

  const handleNavigateAppView = useCallback((view: ViewName) => {
    setCurrentAppView(view);
  }, []);
  
  const handleUpdateUser = useCallback(async (updatedUserData: Partial<User>) => {
    if (!currentUser) {
        showToast("No user logged in to update.", "error");
        return;
    }
    
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
        wallet_address: updatedUserData.walletAddress || null,
        team_members: updatedUserData.teamMembers || [],
        name: updatedUserData.name || null,
        updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', currentUser.id);

    if (profileError) {
        showToast(`Error saving profile details: ${profileError.message}`, "error");
    } else {
        setCurrentUser(prev => ({
            ...prev!,
            ...updatedUserData,
        }));
       showToast("Profile updated successfully!", "success");
    }
  }, [currentUser, showToast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <AuthLayout 
        authView={authView} 
        setAuthView={setAuthView}
      />
    );
  }

  return (
    <MainAppLayout
      currentView={currentAppView}
      currentUser={currentUser} 
      onNavigate={handleNavigateAppView}
      onLogout={handleLogout}
      onUpdateUser={handleUpdateUser}
    />
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