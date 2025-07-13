

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './Navbar';
import { ViewName, User, Persona, Operator, ContentDraft, ScheduledPost, ScheduledPostDbRow, ContentLibraryAsset, CustomChannel, UserProfile, ConnectedAccount, SocialPlatformType, Json } from '../types';
import { APP_TITLE, CONTENT_PLATFORMS } from '../constants';
import { Breadcrumbs } from './ui/Breadcrumbs';

import { DashboardView } from './DashboardView';
import { AudienceModelingView } from './AudienceModelingView';
import { AnalyticsView } from './AnalyticsView';
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
  
  const fetchContentLibraryAssets = useCallback(async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('content_library_assets')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      showToast('Could not fetch content library assets.', 'error');
      setContentLibraryAssets([]);
      return;
    }

    if (data) {
       const assetsWithUrls = await Promise.all(
        data.map(async (asset) => {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('content-library')
            .createSignedUrl(asset.storage_path, 3600); // 1 hour expiry

          if (urlError) {
            console.error(`Error creating signed URL for ${asset.storage_path}:`, urlError.message);
            // Return the asset without a publicUrl so the UI can handle it gracefully if needed
            return { ...asset, publicUrl: undefined };
          }
          
          return { ...asset, publicUrl: urlData.signedUrl };
        })
      );
      setContentLibraryAssets(assetsWithUrls as ContentLibraryAsset[]);
    }
  }, [currentUser, showToast]);


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

      fetchContentLibraryAssets();
      
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
  }, [currentUser, fetchContentLibraryAssets]);

  const handleAddContentDraft = useCallback(async (draftData: Omit<ContentDraft, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const dataToInsert = {
      ...draftData,
      id: `draft_${Date.now()}`,
      user_id: currentUser.id,
    };
    
    const { data, error } = await supabase.from('content_drafts').insert(dataToInsert).select().single();

    if (error) { 
      showToast(`Failed to save draft: ${error.message}`, 'error');
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

  const handleDeleteContentDraft = useCallback(async (draftId: string) => {
    if (window.confirm('Are you sure you want to delete this entire draft? This action cannot be undone.')) {
        const { error } = await supabase.from('content_drafts').delete().eq('id', draftId);
        if (error) {
            showToast(`Failed to delete draft: ${error.message}`, 'error');
        } else {
            setContentDrafts(prev => prev.filter(d => d.id !== draftId));
            showToast('Entire draft deleted.', 'info');
        }
    }
  }, [showToast]);
  
  const handleDeletePlatformContent = useCallback(async (draftId: string, platformKey: string) => {
    const draft = contentDrafts.find(d => d.id === draftId);
    if (!draft) {
      showToast("Draft not found to modify.", "error");
      return;
    }

    const newPlatformContents = { ...draft.platform_contents };
    delete newPlatformContents[platformKey];

    const contentKeys = Object.keys(newPlatformContents).filter(k => k !== '_media_overrides');
    if (contentKeys.length === 0) {
      handleDeleteContentDraft(draftId);
      return;
    }

    const { error } = await supabase
        .from('content_drafts')
        .update({ platform_contents: newPlatformContents as Json })
        .eq('id', draftId);
    
    if (error) {
        showToast(`Failed to update draft: ${error.message}`, 'error');
    } else {
        setContentDrafts(prev => prev.map(d => 
            d.id === draftId 
            ? { ...d, platform_contents: newPlatformContents } 
            : d
        ));
        showToast(`Removed platform content from draft.`, 'success');
    }
  }, [contentDrafts, showToast, handleDeleteContentDraft]);
  
  const handleAddScheduledPost = useCallback(async (post: ScheduledPost) => {
    const payload = {
        user_id: currentUser.id, 
        content_draft_id: post.resource.contentDraftId, 
        platform_key: post.resource.platformKey,
        status: post.resource.status, 
        notes: post.resource.notes, 
        scheduled_at: post.start.toISOString(),
    };
    const { data, error } = await supabase.from('scheduled_posts').insert(payload).select().single();
    if(error) { showToast(`Failed to save schedule: ${error.message}`, 'error');
    } else {
        const newPostWithDbId = { ...post, db_id: data.id, id: `sch_${data.id}_${data.platform_key}` };
        setScheduledPosts(prev => [...prev, newPostWithDbId]);
        showToast("Post scheduled successfully!", "success");
    }
  }, [currentUser.id, showToast]);

  const handleUpdateScheduledPost = useCallback(async (post: ScheduledPost) => {
    const payload = {
        notes: post.resource.notes, 
        status: post.resource.status, 
        scheduled_at: post.start.toISOString(),
        error_message: post.resource.error_message, 
        last_attempted_at: post.resource.last_attempted_at,
    };
    const { error } = await supabase.from('scheduled_posts').update(payload).eq('id', post.db_id);
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
  
  const handleAddConnectedAccount = useCallback(async (platform: SocialPlatformType, accountId: string, displayName: string) => {
    const newAccount = {
        platform,
        accountid: accountId,
        accountname: displayName,
        user_id: currentUser.id,
        created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('connected_accounts').insert(newAccount).select().single();
    if(error) { showToast(`Failed to connect account: ${error.message}`, 'error');
    } else {
        setConnectedAccounts(prev => [...prev, data as ConnectedAccount]);
        showToast(`Account ${displayName} connected.`, "success");
    }
  }, [currentUser.id, showToast]);

  const handleDeleteConnectedAccount = useCallback(async (accountId: string, platformName: string) => {
    const { error } = await supabase.from('connected_accounts').delete().eq('id', accountId);
    if(error) { showToast(`Failed to disconnect account: ${error.message}`, 'error');
    } else {
        setConnectedAccounts(prev => prev.filter(acc => acc.id !== accountId));
        showToast(`Account for ${platformName} disconnected.`, "info");
    }
  }, [showToast]);

  const handleAddAsset = useCallback(async (file: File, name: string, tags: string[]) => {
    if (!currentUser) return;

    const storagePath = `${currentUser.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('content-library')
      .upload(storagePath, file);

    if (uploadError) {
      showToast(`Upload failed: ${uploadError.message}`, 'error');
      return;
    }

    const payload = {
      user_id: currentUser.id,
      name,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      storage_path: storagePath,
      file_name: file.name,
      file_type: file.type,
      size: file.size,
      tags,
    };

    const { error: dbError } = await supabase.from('content_library_assets').insert(payload);

    if (dbError) {
      showToast(`Failed to save asset metadata: ${dbError.message}`, 'error');
    } else {
      showToast("Asset added to library!", "success");
      fetchContentLibraryAssets();
    }
  }, [currentUser, showToast, fetchContentLibraryAssets]);

  const handleUpdateAsset = useCallback(async (assetId: string, updates: Partial<Pick<ContentLibraryAsset, 'name' | 'tags'>>) => {
    const { error } = await supabase
      .from('content_library_assets')
      .update(updates)
      .eq('id', assetId);

    if (error) {
      showToast(`Failed to update asset: ${error.message}`, 'error');
    } else {
      showToast("Asset updated successfully!", "success");
      fetchContentLibraryAssets();
    }
  }, [showToast, fetchContentLibraryAssets]);

  const handleRemoveAsset = useCallback(async (assetId: string) => {
    const assetToDelete = contentLibraryAssets.find(a => a.id === assetId);
    if (!assetToDelete) return;
    
    const { error: storageError } = await supabase.storage
      .from('content-library')
      .remove([assetToDelete.storage_path]);

    if (storageError) {
      showToast(`Failed to delete file from storage: ${storageError.message}`, 'error');
    }

    const { error: dbError } = await supabase
      .from('content_library_assets')
      .delete()
      .eq('id', assetId);

    if (dbError) {
      showToast(`Failed to delete asset record: ${dbError.message}`, 'error');
    } else {
      showToast("Asset deleted successfully.", "info");
      fetchContentLibraryAssets();
    }
  }, [contentLibraryAssets, showToast, fetchContentLibraryAssets]);
  
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
      case ViewName.Analytics:
        return <AnalyticsView currentUser={currentUser} personas={personas} onNavigate={onNavigate} />;
      case ViewName.OperatorBuilder:
        return <OperatorBuilderView currentUser={currentUser} onNavigate={onNavigate} />;
      case ViewName.ContentPlanner:
        return <ContentPlannerView 
                  currentUser={currentUser} contentDrafts={contentDrafts} personas={personas} operators={operators} 
                  onAddContentDraft={handleAddContentDraft}
                  onDeleteContentDraft={handleDeleteContentDraft}
                  onDeletePlatformContent={handleDeletePlatformContent}
                  onAddScheduledPost={handleAddScheduledPost}
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
        &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.
      </footer>
    </div>
  );
};
