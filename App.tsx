
import React, { useState, useCallback, useEffect } from 'react';
import { AuthLayout } from './components/auth/AuthLayout';
import { MainAppLayout } from './components/MainAppLayout';
import { ViewName, Persona, Operator, ContentDraft, CampaignData, ScheduledPost, AuthViewType, User, ConnectedAccount, ContentLibraryAsset, ChatMessage, CustomChannel } from './types';
import { 
  LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, 
  LOCAL_STORAGE_AI_CONFIG_KEY, 
  LOCAL_STORAGE_CAMPAIGN_DATA_KEY,
  LOCAL_STORAGE_USERS_KEY,
  LOCAL_STORAGE_AUTH_TOKEN_KEY
} from './constants';
import { getStoredAiProviderConfigs, getActiveAiProviderType } from './services/aiService';
import { ToastProvider, useToast } from './components/ui/ToastProvider';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthViewType>('home');
  const [currentAppView, setCurrentAppView] = useState<ViewName>(ViewName.Dashboard);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const { showToast } = useToast();

  const [campaignData, setCampaignData] = useState<CampaignData>({
    personas: [],
    operators: [],
    contentDrafts: [],
    scheduledPosts: [],
    connectedAccounts: [],
    contentLibraryAssets: [],
    customChannels: [], // Initialize custom channels
    chatMessages: [],
  });

  const loadUserAndData = useCallback(() => {
    const authToken = localStorage.getItem(LOCAL_STORAGE_AUTH_TOKEN_KEY);
    if (authToken) {
      const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      const loggedInUser = users.find(user => user.email === authToken);
      if (loggedInUser) {
        setCurrentUser(loggedInUser);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_AUTH_TOKEN_KEY);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthView('login');
      }
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setAuthView('home');
    }

    if (!localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY)) {
      localStorage.setItem(LOCAL_STORAGE_AI_CONFIG_KEY, JSON.stringify(getStoredAiProviderConfigs()));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY)) {
       localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, getActiveAiProviderType());
    }

    const storedCampaignData = localStorage.getItem(LOCAL_STORAGE_CAMPAIGN_DATA_KEY);
    if (storedCampaignData) {
      try {
        const parsedData = JSON.parse(storedCampaignData) as CampaignData;
        const initializedData: CampaignData = {
          personas: parsedData.personas || [],
          operators: parsedData.operators || [],
          contentDrafts: parsedData.contentDrafts || [],
          scheduledPosts: (parsedData.scheduledPosts || []).map(post => ({
            ...post,
            start: new Date(post.start),
            end: new Date(post.end),
          })),
          connectedAccounts: parsedData.connectedAccounts || [],
          contentLibraryAssets: parsedData.contentLibraryAssets || [],
          customChannels: parsedData.customChannels || [], // Load custom channels
          chatMessages: parsedData.chatMessages || [],
        };
        setCampaignData(initializedData);
      } catch (error) {
        console.error("Failed to parse campaign data from localStorage:", error);
        setCampaignData({ personas: [], operators: [], contentDrafts: [], scheduledPosts: [], connectedAccounts: [], contentLibraryAssets: [], customChannels: [], chatMessages: [] });
      }
    }
  }, []);


  useEffect(() => {
    loadUserAndData();
  }, [loadUserAndData]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CAMPAIGN_DATA_KEY, JSON.stringify(campaignData));
    } catch (error) {
      console.error("Failed to save campaign data to local storage:", error);
      showToast("Error saving data. Storage might be full.", "error");
    }
  }, [campaignData, showToast]);

  const handleLoginSuccess = useCallback((email: string) => {
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    const loggedInUser = users.find(user => user.email === email);
    if (loggedInUser) {
        setCurrentUser(loggedInUser);
        setIsAuthenticated(true);
        setCurrentAppView(ViewName.Dashboard);
        showToast("Login successful!", "success");
    } else {
        showToast("Login failed: User data not found.", "error");
    }
  }, [showToast]);

  const handleRegisterSuccess = useCallback(() => {
    setAuthView('login');
    showToast("Registration successful! Please log in.", "success");
  }, [showToast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_AUTH_TOKEN_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthView('home');
    setCurrentAppView(ViewName.Dashboard);
    showToast("You have been logged out.", "info");
  }, [showToast]);

  const handleUpdateUser = useCallback((updatedUserData: Partial<User>) => {
    if (!currentUser) {
      showToast("No user logged in to update.", "error");
      return;
    }
    const updatedUser = { ...currentUser, ...updatedUserData };
    setCurrentUser(updatedUser);

    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    let users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    users = users.map(user => user.id === updatedUser.id ? updatedUser : user);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
    showToast("Profile updated successfully!", "success");
  }, [currentUser, showToast]);


  const handleNavigateAppView = (view: ViewName) => {
    setCurrentAppView(view);
  };

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

  const handleRemoveContentLibraryAsset = useCallback((assetId: string) => {
    setCampaignData(prev => ({ ...prev, contentLibraryAssets: prev.contentLibraryAssets.filter(asset => asset.id !== assetId)}));
    showToast("Asset removed from Content Library.", "info");
  }, [showToast]);

  const handleAddChatMessage = useCallback((message: ChatMessage) => {
    setCampaignData(prev => ({ ...prev, chatMessages: [...prev.chatMessages, message] }));
  }, []);

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
      // Optional: Add permission check here if needed (e.g., only creator can delete)
      if (channelToRemove) {
         showToast(`Channel "${channelToRemove.name}" removed.`, "info");
      }
      return {
        ...prev,
        customChannels: prev.customChannels.filter(c => c.id !== channelId),
        // Optional: Remove messages associated with this channel
        // chatMessages: prev.chatMessages.filter(msg => msg.channelId !== channelId),
      };
    });
  }, [showToast]);


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

  return (
    <MainAppLayout
      currentView={currentAppView}
      currentUser={currentUser} 
      campaignData={campaignData}
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
      handleRemoveContentLibraryAsset={handleRemoveContentLibraryAsset}
      handleAddChatMessage={handleAddChatMessage}
      handleAddCustomChannel={handleAddCustomChannel} // Pass new handlers
      handleRemoveCustomChannel={handleRemoveCustomChannel} // Pass new handlers
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
