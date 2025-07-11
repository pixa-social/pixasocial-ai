

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './Navbar';
import { ViewName, User, Persona, Operator, ContentDraft, ScheduledPost, ScheduledPostDbRow, ContentLibraryAsset, CustomChannel, UserProfile, ConnectedAccount, SocialPlatformType } from '../types';
import { APP_TITLE, CONTENT_PLATFORMS } from '../constants';
import { Breadcrumbs } from './ui/Breadcrumbs';

import { DashboardView } from './DashboardView';
import { AudienceModelingView } from './AudienceModelingView';
import { OperatorBuilderView } from './OperatorBuilderView';
import { ContentPlannerView } from './ContentPlannerView';
import { CalendarView } from './CalendarView'; 
import { FeedbackSimulatorView } from './FeedbackSimulatorView';
import { AuditToolView } from './AuditToolView';
import { AdminPanelView } from './AdminPanelView';
import { SettingsView } from './SettingsView';
import { ContentLibraryView } from './ContentLibraryView';
import { ChatView } from './ChatView';
import { SocialPosterView } from './social-poster/SocialPosterView';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ui/ToastProvider';

interface MainAppLayoutProps {
  currentView: ViewName;
  currentUser: UserProfile; 
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onUpdateUser: (updatedUserData: Partial<User>) => void;
}

export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  currentView,
  currentUser, 
  onNavigate,
  onLogout,
  onUpdateUser,
}) => {
  const { showToast } = useToast();
  
  // Centralized state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [contentLibraryAssets, setContentLibraryAssets] = useState<ContentLibraryAsset[]>([]);
  const [customChannels, setCustomChannels] = useState<CustomChannel[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  
  // Data fetching
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchAllData = async () => {
      const { data: personaData } = await supabase.from('personas').select('*').eq('user_id', currentUser.id);
      setPersonas(personaData || []);

      const { data: operatorData } = await supabase.from('operators').select('*').eq('user_id', currentUser.id);
      setOperators(operatorData || []);

      const { data: rawDraftData } = await supabase.from('content_drafts').select('*').eq('user_id', currentUser.id);
      
      const processedDrafts = (rawDraftData || []).map(draft => {
        const processedDraft: any = { ...draft };
        if (processedDraft.platform_contents && (processedDraft.platform_contents as any)._media_overrides) {
            processedDraft.platform_media_overrides = (processedDraft.platform_contents as any)._media_overrides;
            delete (processedDraft.platform_contents as any)._media_overrides;
        }
        return processedDraft as ContentDraft;
      });
      setContentDrafts(processedDrafts);

      const assetsFromStorage = JSON.parse(localStorage.getItem(`pixasocial_assets_${currentUser.id}`) || '[]');
      setContentLibraryAssets(assetsFromStorage);
      
      const channelsFromStorage = JSON.parse(localStorage.getItem(`pixasocial_channels_${currentUser.id}`) || '[]');
      setCustomChannels(channelsFromStorage);

      const { data: scheduleData } = await supabase.from('scheduled_posts').select('*').eq('user_id', currentUser.id);
      const scheduledPostsFromDb: ScheduledPost[] = (scheduleData || []).map((p: ScheduledPostDbRow) => {
        const draft = processedDrafts.find((d: ContentDraft) => d.id === p.content_draft_id);
        const platformInfo = CONTENT_PLATFORMS.find(plat => plat.key === p.platform_key);
        let titleContent = "Untitled";
        if (draft) {
          const platformDetail = draft.platform_contents[p.platform_key];
          titleContent = platformDetail?.subject || platformDetail?.content?.substring(0, 20) || draft.key_message?.substring(0,20) || 'Content Draft';
        }
        const title = `${typeof platformInfo?.icon === 'string' ? platformInfo.icon : ''} ${platformInfo?.label || p.platform_key}: ${titleContent}...`;
        const startDate = new Date(p.scheduled_at);
        return {
          id: `sch_${p.id}_${p.platform_key}`, db_id: p.id, title: title, start: startDate,
          end: new Date(startDate.getTime() + 60 * 60 * 1000), allDay: false,
          resource: {
            contentDraftId: p.content_draft_id, platformKey: p.platform_key, status: p.status, notes: p.notes,
            personaId: draft?.persona_id || 0, operatorId: draft?.operator_id || 0, error_message: p.error_message, last_attempted_at: p.last_attempted_at,
          }
        };
      });
      setScheduledPosts(scheduledPostsFromDb);
      
      const { data: accountData } = await supabase.from('connected_accounts').select('*').eq('user_id', currentUser.id);
      setConnectedAccounts(accountData || []);
    };
    fetchAllData();
  }, [currentUser]);

  const handleAddContentDraft = useCallback(async (draftData: Omit<ContentDraft, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const dbPayload: any = { ...draftData };
    if (dbPayload.platform_media_overrides) {
        dbPayload.platform_contents = { ...dbPayload.platform_contents, _media_overrides: dbPayload.platform_media_overrides };
        delete dbPayload.platform_media_overrides;
    }
    const dataToInsert = { ...dbPayload, user_id: currentUser.id };
    const { data, error } = await supabase.from('content_drafts').insert(dataToInsert).select().single();
    if (error) { showToast(`Failed to save draft: ${error.message}`, 'error');
    } else if (data) {
        const newDraft: any = { ...data };
        if (newDraft.platform_contents && (newDraft.platform_contents as any)._media_overrides) {
            newDraft.platform_media_overrides = (newDraft.platform_contents as any)._media_overrides;
            delete (newDraft.platform_contents as any)._media_overrides;
        }
        setContentDrafts(prev => [...prev, newDraft as ContentDraft]);
        showToast("Draft saved successfully to your account!", "success");
    }
  }, [currentUser.id, showToast]);
  
  const handleAddScheduledPost = useCallback(async (post: ScheduledPost) => {
    const { data, error } = await supabase.from('scheduled_posts').insert({
        user_id: currentUser.id, content_draft_id: post.resource.contentDraftId, platform_key: post.resource.platformKey,
        status: post.resource.status, notes: post.resource.notes, scheduled_at: post.start.toISOString(),
    }).select().single();
    if(error) { showToast(`Failed to save schedule: ${error.message}`, 'error');
    } else {
        const newPostWithDbId = { ...post, db_id: data.id, id: `sch_${data.id}_${data.platform_key}` };
        setScheduledPosts(prev => [...prev, newPostWithDbId]);
        showToast("Post scheduled successfully!", "success");
    }
  }, [currentUser.id, showToast]);

  const handleUpdateScheduledPost = useCallback(async (post: ScheduledPost) => {
    const { error } = await supabase.from('scheduled_posts').update({
        notes: post.resource.notes, status: post.resource.status, scheduled_at: post.start.toISOString(),
        error_message: post.resource.error_message, last_attempted_at: post.resource.last_attempted_at,
    }).eq('id', post.db_id);
    if (error) { showToast(`Failed to update schedule: ${error.message}`, 'error');
    } else {
        setScheduledPosts(prev => prev.map(p => p.id === post.id ? post : p));
    }
  }, [showToast]);

  const handleDeleteScheduledPost = useCallback(async (postId: string) => {
    const postToDelete = scheduledPosts.find(p => p.id === postId);
    if (!postToDelete) return;
    const { error } = await supabase.from('scheduled_posts').delete().eq('id', postToDelete.db_id);
    if(error) { showToast(`Failed to delete schedule: ${error.message}`, 'error');
    } else {
        setScheduledPosts(prev => prev.filter(p => p.id !== postId));
        showToast("Scheduled post removed.", "info");
    }
  }, [scheduledPosts, showToast]);
  
  const handleAddConnectedAccount = useCallback(async (platform: SocialPlatformType, accountId: string, displayName: string, profileImageUrl?: string) => {
    const newAccount = { platform, accountId, displayName, profileImageUrl: profileImageUrl || undefined, user_id: currentUser.id, connectedAt: new Date().toISOString() };
    const { data, error } = await supabase.from('connected_accounts').insert(newAccount).select().single();
    if(error) { showToast(`Failed to connect account: ${error.message}`, 'error');
    } else {
        setConnectedAccounts(prev => [...prev, data]);
        showToast(`Account ${displayName} connected.`, "success");
    }
  }, [currentUser.id, showToast]);

  const handleDeleteConnectedAccount = useCallback(async (accountId: number, platformName: string) => {
    const { error } = await supabase.from('connected_accounts').delete().eq('id', accountId);
    if(error) { showToast(`Failed to disconnect account: ${error.message}`, 'error');
    } else {
        setConnectedAccounts(prev => prev.filter(acc => acc.id !== accountId));
        showToast(`Account for ${platformName} disconnected.`, "info");
    }
  }, [showToast]);

  const handleAddAsset = useCallback((asset: ContentLibraryAsset) => {
    const updatedAssets = [...contentLibraryAssets, asset];
    setContentLibraryAssets(updatedAssets);
    localStorage.setItem(`pixasocial_assets_${currentUser.id}`, JSON.stringify(updatedAssets));
    showToast("Asset added to local library!", "success");
  }, [contentLibraryAssets, currentUser.id, showToast]);

  const handleUpdateAsset = useCallback((asset: ContentLibraryAsset) => {
    const updatedAssets = contentLibraryAssets.map(a => a.id === asset.id ? asset : a);
    setContentLibraryAssets(updatedAssets);
    localStorage.setItem(`pixasocial_assets_${currentUser.id}`, JSON.stringify(updatedAssets));
    showToast("Asset updated!", "success");
  }, [contentLibraryAssets, currentUser.id, showToast]);

  const handleRemoveAsset = useCallback((assetId: string) => {
    const updatedAssets = contentLibraryAssets.filter(a => a.id !== assetId);
    setContentLibraryAssets(updatedAssets);
    localStorage.setItem(`pixasocial_assets_${currentUser.id}`, JSON.stringify(updatedAssets));
    showToast("Asset removed from local library.", "info");
  }, [contentLibraryAssets, currentUser.id, showToast]);
  
  const handleAddCustomChannel = useCallback((name: string) => {
    const newChannel: CustomChannel = {
      id: `custom_${Date.now()}`, uuid: `uuid_${Date.now()}`, name: name,
      created_by: currentUser.id, created_at: new Date().toISOString()
    };
    const updatedChannels = [...customChannels, newChannel];
    setCustomChannels(updatedChannels);
    localStorage.setItem(`pixasocial_channels_${currentUser.id}`, JSON.stringify(updatedChannels));
    showToast(`Channel "${name}" created.`, "success");
  }, [customChannels, currentUser.id, showToast]);

  const handleRemoveCustomChannel = useCallback((channelId: string) => {
    const updatedChannels = customChannels.filter(c => c.id !== channelId);
    setCustomChannels(updatedChannels);
    localStorage.setItem(`pixasocial_channels_${currentUser.id}`, JSON.stringify(updatedChannels));
    showToast(`Channel removed.`, "info");
  }, [customChannels, currentUser.id, showToast]);


  const renderView = () => {
    switch (currentView) {
      case ViewName.Dashboard:
        return <DashboardView currentUser={currentUser} onNavigate={onNavigate} connectedAccounts={connectedAccounts} />;
      case ViewName.AudienceModeling:
        return <AudienceModelingView currentUser={currentUser} onNavigate={onNavigate} />;
      case ViewName.OperatorBuilder:
        return <OperatorBuilderView currentUser={currentUser} onNavigate={onNavigate} />;
      case ViewName.ContentPlanner:
        return <ContentPlannerView 
                  currentUser={currentUser} contentDrafts={contentDrafts} personas={personas} operators={operators} 
                  onAddContentDraft={handleAddContentDraft} onAddScheduledPost={handleAddScheduledPost}
                  onAddContentLibraryAsset={handleAddAsset} onNavigate={onNavigate} 
                />;
      case ViewName.Calendar:
        return <CalendarView 
                  scheduledPosts={scheduledPosts} contentDrafts={contentDrafts} personas={personas} operators={operators}
                  onUpdateScheduledPost={handleUpdateScheduledPost} onDeleteScheduledPost={handleDeleteScheduledPost}
                  onNavigate={onNavigate} 
                />;
       case ViewName.ContentLibrary:
        return <ContentLibraryView 
                  assets={contentLibraryAssets} onAddAsset={handleAddAsset}
                  onUpdateAsset={handleUpdateAsset} onRemoveAsset={handleRemoveAsset}
                />;
      case ViewName.FeedbackSimulator:
        return <FeedbackSimulatorView 
                  currentUser={currentUser} personas={personas} operators={operators} contentDrafts={contentDrafts}
                  onNavigate={onNavigate} 
                />;
      case ViewName.AuditTool:
        return <AuditToolView currentUser={currentUser} />;
      case ViewName.SocialPoster:
        return <SocialPosterView
                  currentUser={currentUser} scheduledPosts={scheduledPosts} contentDrafts={contentDrafts}
                  personas={personas} operators={operators} connectedAccounts={connectedAccounts} 
                  onUpdateScheduledPost={handleUpdateScheduledPost}
                  onDeleteScheduledPost={handleDeleteScheduledPost} onNavigate={onNavigate}
                />;
      case ViewName.AdminPanel:
        return <AdminPanelView />;
      case ViewName.Settings: 
        return <SettingsView 
                  currentUser={currentUser} onUpdateUser={onUpdateUser}
                  connectedAccounts={connectedAccounts} onAddConnectedAccount={handleAddConnectedAccount}
                  onDeleteConnectedAccount={handleDeleteConnectedAccount}
                />;
      case ViewName.TeamChat:
        return <ChatView
                  currentUser={currentUser} teamMembers={currentUser.teamMembers || []}
                  customChannels={customChannels} onAddCustomChannel={handleAddCustomChannel}
                  onRemoveCustomChannel={handleRemoveCustomChannel}
                />;
      default:
        return <DashboardView currentUser={currentUser} onNavigate={onNavigate} connectedAccounts={connectedAccounts} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentView={currentView} onNavigate={onNavigate} onLogout={onLogout} isAuthenticated={!!currentUser} currentUser={currentUser} />
      <Breadcrumbs currentView={currentView} onNavigate={onNavigate} />
      <main className="flex-grow container mx-auto px-4 pb-8 max-w-7xl">
        {renderView()}
      </main>
      <footer className="bg-gray-900 text-gray-400 text-center p-4 text-sm border-t border-lightBorder">
        &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved. For planning and educational purposes.
      </footer>
    </div>
  );
};
