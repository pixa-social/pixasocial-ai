import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { AuthLayout } from './components/auth/AuthLayout';
import { MainAppLayout } from './components/MainAppLayout';
import { ViewName, Persona, Operator, ContentDraft, CampaignData, ScheduledPost, AuthViewType, User, ConnectedAccount, ContentLibraryAsset, CustomChannel, AiProviderConfig } from './types';
import { 
  LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, 
  LOCAL_STORAGE_AI_CONFIG_KEY, 
  LOCAL_STORAGE_CAMPAIGN_DATA_KEY,
  LOCAL_STORAGE_USERS_KEY,
  LOCAL_STORAGE_AUTH_TOKEN_KEY,
  AI_PROVIDERS_CONFIG_TEMPLATE
} from './constants';
import { getStoredAiProviderConfigs, getStoredAiProviderConfigsSync, getActiveAiProviderType } from './services/ai/aiUtils';
import { ToastProvider, useToast } from './components/ui/ToastProvider';

// Reviewed for aliased import error "@/ui/Icons" - no such alias found in provided files.
// Ensure all icon imports use relative paths (e.g., './ui/Icons' or '../ui/Icons').

const AppContent: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthViewType>('home');
  const [currentAppView, setCurrentAppView] = useState<ViewName>(ViewName.Dashboard);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const { showToast } = useToast();

  const [campaignData, setCampaignData] = useState<Omit<CampaignData, 'chatMessages'>>({ // chatMessages removed
    personas: [],
    operators: [],
    contentDrafts: [],
    scheduledPosts: [],
    connectedAccounts: [],
    contentLibraryAssets: [],
    customChannels: [], 
  });

    useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { user } = session;
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          showToast('Error fetching user data.', 'error');
          setIsAuthenticated(false);
          setCurrentUser(null);
        } else if (userData) {
          setCurrentUser({
            id: userData.id,
            supabaseId: user.id,
            name: userData.name,
            email: user.email || '',
            walletAddress: userData.wallet_address,
            teamMembers: userData.team_members,
          });
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        // Fetch user profile here if needed
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [showToast]);

  const loadUserAndData = useCallback(() => {

    if (!localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY)) {
      localStorage.setItem(LOCAL_STORAGE_AI_CONFIG_KEY, JSON.stringify(getStoredAiProviderConfigsSync()));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY)) {
       localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, getActiveAiProviderType());
    }

    const storedCampaignData = localStorage.getItem(LOCAL_STORAGE_CAMPAIGN_DATA_KEY);
    if (storedCampaignData) {
      try {
        const parsedData = JSON.parse(storedCampaignData) as CampaignData; // Still parse as CampaignData
        const initializedData: Omit<CampaignData, 'chatMessages'> = { // Assign to Omit type
          personas: parsedData.personas || [],
          operators: parsedData.operators || [],
          contentDrafts: parsedData.contentDrafts || [],
          scheduledPosts: (parsedData.scheduledPosts || []).map(post => ({
            ...post,
            start: new Date(post.start), // Ensure dates are Date objects
            end: new Date(post.end),     // Ensure dates are Date objects
          })),
          connectedAccounts: parsedData.connectedAccounts || [],
          contentLibraryAssets: parsedData.contentLibraryAssets || [],
          customChannels: parsedData.customChannels || [], 
          // chatMessages are no longer managed here
        };
        setCampaignData(initializedData);
      } catch (error) {
        console.error("Failed to parse campaign data from localStorage:", error);
        setCampaignData({ personas: [], operators: [], contentDrafts: [], scheduledPosts: [], connectedAccounts: [], contentLibraryAssets: [], customChannels: [] });
      }
    }
  }, []);


  useEffect(() => {
    try {
      // Create an object that matches the full CampaignData structure for saving,
      // converting dates in scheduledPosts to ISO strings for consistent storage.
      const dataToStore: CampaignData = {
        ...campaignData,
        scheduledPosts: campaignData.scheduledPosts.map(post => ({
          ...post,
          start: post.start.toISOString() as any, // Store as ISO string
          end: post.end.toISOString() as any,     // Store as ISO string
        })),
        chatMessages: [], // Store empty array for chatMessages,
        aiProviderConfigs: undefined, // Should not be persisted here this way; managed separately
      };
      localStorage.setItem(LOCAL_STORAGE_CAMPAIGN_DATA_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error("Failed to save campaign data to local storage:", error);
      showToast("Error saving data. Storage might be full.", "error");
    }
  }, [campaignData, showToast]);

  const handleLoginSuccess = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast("Login successful!", "success");
    }
  }, [showToast]);

  const handleRegisterSuccess = useCallback(async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    });

    if (error) {
      showToast(error.message, 'error');
    } else if (data.user) {
        const { error: insertError } = await supabase.from('users').insert([{ id: data.user.id, name: name, email: email }]);
        if(insertError){
            showToast(insertError.message, 'error');
        } else {
            setAuthView('login');
            showToast("Registration successful! Please check your email to verify your account and log in.", "success");
        }
    }
  }, [showToast]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast(error.message, 'error');
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setAuthView('home');
      setCurrentAppView(ViewName.Dashboard);
      showToast("You have been logged out.", "info");
    }
  }, [showToast]);

  const handleUpdateUser = useCallback(async (updatedUserData: Partial<User>) => {
    if (!currentUser || !currentUser.supabaseId) {
      showToast("No user logged in to update.", "error");
      return;
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        name: updatedUserData.name, 
        wallet_address: updatedUserData.walletAddress,
        team_members: updatedUserData.teamMembers
      })
      .eq('id', currentUser.supabaseId)
      .select()
      .single();

    if (error) {
      showToast(error.message, 'error');
    } else if (data) {
      setCurrentUser({
        id: data.id,
        supabaseId: data.id,
        name: data.name,
        email: currentUser.email, // email is not updated here
        walletAddress: data.wallet_address,
        teamMembers: data.team_members,
      });
      showToast("Profile updated successfully!", "success");
    }
  }, [currentUser, showToast]);


  const handleNavigateAppView = useCallback((view: ViewName) => {
    setCurrentAppView(view);
  }, []);

  const handleAddPersona = useCallback((persona: Persona) => {
    setCampaignData(prev => ({ ...prev, personas: [...prev.personas, persona] }));
    showToast("Persona created successfully!", "success");
  }, [showToast]);
  const handleUpdatePersona = useCallback((updatedPersona: Persona) => {
    setCampaignData(prev => ({ ...prev, personas: prev.personas.map(p => p.id === updatedPersona.id ? updatedPersona : p) }));
    showToast("Persona updated successfully!", "success");
  }, [showToast]);
  const handleAddOperator = useCallback((operator: Operator) => {
    setCampaignData(prev => ({ ...prev, operators: [...prev.operators, operator] }));
    showToast("Operator created successfully!", "success");
  }, [showToast]);
  const handleUpdateOperator = useCallback((updatedOperator: Operator) => {
    setCampaignData(prev => ({ ...prev, operators: prev.operators.map(o => o.id === updatedOperator.id ? updatedOperator : o) }));
    showToast("Operator updated successfully!", "success");
  }, [showToast]);
  const handleAddContentDraft = useCallback((draft: ContentDraft) => {
    setCampaignData(prev => ({ ...prev, contentDrafts: [...prev.contentDrafts, draft] }));
  }, []);
  const handleAddScheduledPost = useCallback((post: ScheduledPost) => {
    setCampaignData(prev => ({ ...prev, scheduledPosts: [...prev.scheduledPosts, post] }));
  }, []);
  const handleUpdateScheduledPost = useCallback((updatedPost: ScheduledPost) => {
    setCampaignData(prev => ({ ...prev, scheduledPosts: prev.scheduledPosts.map(p => p.id === updatedPost.id ? updatedPost : p) }));
    showToast("Scheduled post updated!", "success");
  }, [showToast]);
  const handleDeleteScheduledPost = useCallback((postId: string) => {
    setCampaignData(prev => ({ ...prev, scheduledPosts: prev.scheduledPosts.filter(p => p.id !== postId) }));
    showToast("Scheduled post removed!", "info");
  }, [showToast]);

  const handleAddConnectedAccount = useCallback((account: ConnectedAccount) => {
    setCampaignData(prev => {
      const existing = prev.connectedAccounts.find(acc => acc.platform === account.platform);
      if (existing) {
        showToast(`${account.platform} account updated.`, "success");
        return { ...prev, connectedAccounts: prev.connectedAccounts.map(acc => acc.platform === account.platform ? account : acc) };
      }
      showToast(`${account.platform} account connected.`, "success");
      return { ...prev, connectedAccounts: [...prev.connectedAccounts, account] };
    });
  }, [showToast]);

  const handleRemoveConnectedAccount = useCallback((platform: ConnectedAccount['platform']) => {
    setCampaignData(prev => ({
      ...prev,
      connectedAccounts: prev.connectedAccounts.filter(acc => acc.platform !== platform),
    }));
    showToast(`${platform} account disconnected.`, "info");
  }, [showToast]);

  const handleAddContentLibraryAsset = useCallback((asset: ContentLibraryAsset) => {
    setCampaignData(prev => ({ ...prev, contentLibraryAssets: [...prev.contentLibraryAssets, asset]}));
    showToast(`"${asset.name}" added to Content Library!`, "success");
  }, [showToast]);

  const handleUpdateContentLibraryAsset = useCallback((updatedAsset: ContentLibraryAsset) => {
    setCampaignData(prev => ({
      ...prev,
      contentLibraryAssets: prev.contentLibraryAssets.map(asset =>
        asset.id === updatedAsset.id ? updatedAsset : asset
      ),
    }));
    showToast(`Asset "${updatedAsset.name}" updated successfully!`, "success");
  }, [showToast]);

  const handleRemoveContentLibraryAsset = useCallback((assetId: string) => {
    setCampaignData(prev => ({ ...prev, contentLibraryAssets: prev.contentLibraryAssets.filter(asset => asset.id !== assetId)}));
    showToast("Asset removed from Content Library.", "info");
  }, [showToast]);

  const handleAddCustomChannel = useCallback((name: string) => {
    if (!currentUser) {
      showToast("User not found.", "error");
      return;
    }
    const newChannel: CustomChannel = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.startsWith('#') ? name : `#${name}`,
      createdBy: currentUser.email,
      createdAt: new Date().toISOString(),
    };
    setCampaignData(prev => ({ ...prev, customChannels: [...prev.customChannels, newChannel] }));
    showToast(`Channel "${newChannel.name}" created!`, "success");
  }, [currentUser, showToast]);

  const handleRemoveCustomChannel = useCallback((channelId: string) => {
    setCampaignData(prev => {
      const channelToRemove = prev.customChannels.find(c => c.id === channelId);
      if (channelToRemove) {
         showToast(`Channel "${channelToRemove.name}" removed.`, "info");
      }
      return {
        ...prev,
        customChannels: prev.customChannels.filter(c => c.id !== channelId),
      };
    });
  }, [showToast]);
  
  const handleImportCampaignData = useCallback((importedData: CampaignData) => {
    try {
      // Basic validation
      if (!importedData || typeof importedData !== 'object' ||
          !Array.isArray(importedData.personas) ||
          !Array.isArray(importedData.operators) ||
          !Array.isArray(importedData.contentDrafts) ||
          !Array.isArray(importedData.scheduledPosts) ||
          !Array.isArray(importedData.contentLibraryAssets) ||
          !Array.isArray(importedData.customChannels) ||
          !Array.isArray(importedData.connectedAccounts)
      ) {
        throw new Error("Invalid campaign data structure.");
      }

      // Merge AI Provider Configs carefully
      const currentStoredAiConfigs = getStoredAiProviderConfigsSync();
      const importedAiConfigs = importedData.aiProviderConfigs || []; 
      
      const mergedAiConfigs = currentStoredAiConfigs.map(currentConfig => {
        const importedConfig = importedAiConfigs.find(ic => ic.id === currentConfig.id);
        if (importedConfig) {
          return {
            ...currentConfig,
            isEnabled: typeof importedConfig.isEnabled === 'boolean' ? importedConfig.isEnabled : currentConfig.isEnabled,
            models: importedConfig.models || currentConfig.models,
            baseURL: importedConfig.baseURL || currentConfig.baseURL,
          };
        }
        return currentConfig;
      });

      localStorage.setItem(LOCAL_STORAGE_AI_CONFIG_KEY, JSON.stringify(mergedAiConfigs));
      const activeProviderType = getActiveAiProviderType();
      const activeProviderConfig = mergedAiConfigs.find(c => c.id === activeProviderType);
      if (!activeProviderConfig || !activeProviderConfig.isEnabled) {
          const firstEnabled = mergedAiConfigs.find(c => c.isEnabled);
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, firstEnabled ? firstEnabled.id : AI_PROVIDERS_CONFIG_TEMPLATE[0].id);
      }


      setCampaignData({
        personas: importedData.personas,
        operators: importedData.operators,
        contentDrafts: importedData.contentDrafts,
        scheduledPosts: (importedData.scheduledPosts || []).map(post => ({
          ...post,
          start: new Date(post.start), 
          end: new Date(post.end),     
        })),
        connectedAccounts: importedData.connectedAccounts,
        contentLibraryAssets: importedData.contentLibraryAssets,
        customChannels: importedData.customChannels,
      });

      showToast("Campaign data imported successfully! Your previous data has been replaced.", "success");
      loadUserAndData(); 
    } catch (error) {
      console.error("Error importing campaign data:", error);
      showToast(`Failed to import data: ${(error as Error).message}`, "error");
    }
  }, [showToast, loadUserAndData]);


  if (!isAuthenticated || !currentUser) {
    return (
      <AuthLayout 
        authView={authView} 
        setAuthView={setAuthView} 
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  const fullCampaignDataForLayout: CampaignData = {
    ...campaignData,
    chatMessages: [], 
    aiProviderConfigs: getStoredAiProviderConfigsSync().map(config => { // Use synchronous version to avoid async issues in render
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { apiKey, ...rest } = config;
        return rest;
    }),
  };


  return (
    <MainAppLayout
      currentView={currentAppView}
      currentUser={currentUser} 
      campaignData={fullCampaignDataForLayout}
      onNavigate={handleNavigateAppView}
      onLogout={handleLogout}
      onUpdateUser={handleUpdateUser} 
      handleAddPersona={handleAddPersona}
      handleUpdatePersona={handleUpdatePersona}
      handleAddOperator={handleAddOperator}
      handleUpdateOperator={handleUpdateOperator}
      handleAddContentDraft={handleAddContentDraft}
      handleAddScheduledPost={handleAddScheduledPost}
      handleUpdateScheduledPost={handleUpdateScheduledPost}
      handleDeleteScheduledPost={handleDeleteScheduledPost}
      handleAddConnectedAccount={handleAddConnectedAccount}
      handleRemoveConnectedAccount={handleRemoveConnectedAccount}
      handleAddContentLibraryAsset={handleAddContentLibraryAsset}
      handleUpdateContentLibraryAsset={handleUpdateContentLibraryAsset} 
      handleRemoveContentLibraryAsset={handleRemoveContentLibraryAsset}
      handleAddCustomChannel={handleAddCustomChannel} 
      handleRemoveCustomChannel={handleRemoveCustomChannel} 
      handleImportCampaignData={handleImportCampaignData}
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
