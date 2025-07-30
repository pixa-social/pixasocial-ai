


import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../components/ui/ToastProvider';
import * as dataService from '../services/dataService';
import { 
    Persona, Operator, ContentDraft, ScheduledPost, ScheduledPostDbRow, 
    KanbanStatus, AdminPersona
} from '../types/campaign';
import { UserProfile } from '../types/user';
import { CustomChannel } from '../types/chat';
import { ConnectedAccount, ContentLibraryAsset } from '../types/social';
import { SocialPlatformType, ScheduledPostStatus } from '../types/app';
import { Database, Json, TablesInsert, TablesUpdate } from '../types/supabase';
import { CONTENT_PLATFORMS } from '../constants';

const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

const processRawDraftData = (drafts: any[]): ContentDraft[] => {
    return (drafts || []).map(draft => {
        const processedDraft: any = { ...draft };
        const dbContents = processedDraft.platform_contents as any;
        if (dbContents && dbContents._media_overrides) {
            processedDraft.platform_media_overrides = dbContents._media_overrides;
            delete dbContents._media_overrides;
        } else {
            processedDraft.platform_media_overrides = null;
        }
        processedDraft.platform_contents = dbContents;
        processedDraft.status = draft.status || 'Draft'; // Set default status if null
        return processedDraft as ContentDraft;
    });
};

export const useAppData = (currentUser: UserProfile | null) => {
    const { showToast } = useToast();
  
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([]);
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
    const [contentLibraryAssets, setContentLibraryAssets] = useState<ContentLibraryAsset[]>([]);
    const [customChannels, setCustomChannels] = useState<CustomChannel[]>([]);
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
    const [adminPersonas, setAdminPersonas] = useState<AdminPersona[]>([]);
    
    const fetchPersonas = useCallback(async () => {
        if (!currentUser) return;
        const { data } = await supabase.from('personas').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        setPersonas(data || []);
    }, [currentUser]);

    const fetchOperators = useCallback(async () => {
        if (!currentUser) return;
        const { data } = await supabase.from('operators').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        setOperators(data || []);
    }, [currentUser]);

    const fetchContentLibraryAssets = useCallback(async () => {
        if (!currentUser) return;
        const { data, error } = await supabase.from('content_library_assets').select('*').eq('user_id', currentUser.id).order('uploaded_at', { ascending: false });
        if (error) { showToast('Could not fetch content library assets.', 'error'); return; }
        if (data) {
           const assetsWithUrls = await Promise.all(
            data.map(async (asset) => {
              const { data: urlData } = await supabase.storage.from('content-library').createSignedUrl(asset.storage_path, 3600);
              return { ...asset, publicUrl: urlData?.signedUrl || undefined };
            })
          );
          setContentLibraryAssets(assetsWithUrls);
        }
    }, [currentUser, showToast]);
  
    const fetchConnectedAccounts = useCallback(async () => {
        if (!currentUser) return;
        const { data, error } = await supabase.from('connected_accounts').select('*').eq('user_id', currentUser.id);
        if (error) { showToast('Could not refresh connected accounts.', 'error'); } 
        else { setConnectedAccounts(data || []); }
    }, [currentUser, showToast]);

    const fetchAdminPersonas = useCallback(async () => {
        const { data, error } = await supabase.from('admin_personas').select('*').order('name', { ascending: true });
        if (error) { showToast('Could not fetch template agent personas.', 'error'); }
        else { setAdminPersonas(data || []); }
    }, [showToast]);

    useEffect(() => {
        if (!currentUser) return;
        const fetchAllData = async () => {
            fetchPersonas();
            fetchOperators();
            fetchAdminPersonas();
            const { data: rawDraftData } = await supabase.from('content_drafts').select('*').eq('user_id', currentUser.id);
            const processedDrafts = processRawDraftData(rawDraftData || []);
            setContentDrafts(processedDrafts);

            fetchContentLibraryAssets();
            fetchConnectedAccounts();
            const channelsFromStorage = JSON.parse(localStorage.getItem(`pixasocial_channels_${currentUser.id}`) || '[]');
            setCustomChannels(channelsFromStorage);

            const { data: scheduleData } = await supabase.from('scheduled_posts').select('*').eq('user_id', currentUser.id);
            const scheduledPostsFromDb: ScheduledPost[] = (scheduleData || []).map((p: ScheduledPostDbRow) => {
                const draft = processedDrafts.find((d: ContentDraft) => d.id === p.content_draft_id);
                const title = draft ? `${p.platform_key}: ${draft.title}` : 'Scheduled Post';
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
        };
        fetchAllData();
    }, [currentUser, fetchContentLibraryAssets, fetchConnectedAccounts, fetchPersonas, fetchOperators, fetchAdminPersonas]);

    // --- Persona Handlers ---
    const handleAddPersona = useCallback(async (personaData: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { name: string, avatar_base64?: string }) => {
        if(!currentUser) return { data: null, error: { message: "No user found." } as any };

        let avatarUrl = personaData.avatar_url;
        if (personaData.avatar_base64) {
            const blob = dataURLtoBlob(personaData.avatar_base64);
            if (blob) {
                const fileName = `avatar_${currentUser.id}_${Date.now()}.png`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, blob, { contentType: 'image/png', upsert: true });

                if (uploadError) {
                    showToast(`Avatar upload failed: ${uploadError.message}`, 'error');
                } else {
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
                    avatarUrl = urlData.publicUrl;
                }
            }
        } else if (!avatarUrl) {
            avatarUrl = `https://picsum.photos/seed/${personaData.name.trim().toLowerCase().replace(/[^a-z0-9]/gi, '')}/100/100`;
        }
        
        const newPersonaData: TablesInsert<'personas'> = {
            name: personaData.name,
            demographics: personaData.demographics || null,
            psychographics: personaData.psychographics || null,
            initial_beliefs: personaData.initial_beliefs || null,
            vulnerabilities: personaData.vulnerabilities || null,
            goals: personaData.goals || null,
            fears: personaData.fears || null,
            rst_profile: personaData.rst_profile || null,
            user_id: currentUser.id,
            avatar_url: avatarUrl,
            source_admin_persona_id: (personaData as any).source_admin_persona_id || null,
        };
        const { data, error } = await supabase.from('personas').insert(newPersonaData).select().single();
        if (error) { 
            showToast(`Failed to create persona: ${error.message}`, 'error'); 
        } 
        else if(data) { 
            setPersonas(prev => [data, ...prev]); 
            showToast("Persona created.", "success"); 
        }
        return { data, error };
    }, [currentUser, showToast]);

    const handleUpdatePersona = useCallback(async (personaId: number, personaData: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at'>> & { avatar_base64?: string }) => {
        if (!currentUser) return;
        let updatePayload: TablesUpdate<'personas'> = { ...personaData };
        delete (updatePayload as any).avatar_base64; // Remove base64 before it goes to db

        if (personaData.avatar_base64) {
            const blob = dataURLtoBlob(personaData.avatar_base64);
            if (blob) {
                const fileName = `avatar_${currentUser.id}_${personaId}_${Date.now()}.png`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, blob, { contentType: 'image/png', upsert: true });

                if (uploadError) {
                    showToast(`Avatar upload failed: ${uploadError.message}`, 'error');
                } else {
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
                    updatePayload.avatar_url = urlData.publicUrl;
                }
            }
        }

        const { data, error } = await supabase.from('personas').update(updatePayload).eq('id', personaId).select().single();
        if (error) { showToast(`Failed to update persona: ${error.message}`, 'error'); } 
        else { setPersonas(prev => prev.map(p => p.id === data.id ? data : p)); showToast("Persona updated.", "success"); }
    }, [currentUser, showToast]);

    const handleDeletePersona = useCallback(async (personaId: number) => {
        const { error } = await dataService.deletePersona(personaId);
        if (error) {
            showToast(`Failed to delete persona: ${error.message}`, "error");
        } else {
            setPersonas(prev => prev.filter(p => p.id !== personaId));
            showToast("Persona deleted.", "info");
        }
    }, [showToast]);

    // --- Operator Handlers ---
    const handleAddOperator = useCallback(async (operatorData: Omit<Operator, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        if(!currentUser) return;
        const newOperatorData: TablesInsert<'operators'> = { ...operatorData, user_id: currentUser.id };
        const { data, error } = await supabase.from('operators').insert(newOperatorData).select().single();
        if (error) { showToast(`Failed to create operator: ${error.message}`, 'error'); } 
        else { setOperators(prev => [data, ...prev]); showToast("Operator created.", "success"); }
    }, [currentUser, showToast]);

    const handleUpdateOperator = useCallback(async (operatorId: number, operatorData: Partial<Omit<Operator, 'id' | 'user_id' | 'created_at'>>) => {
        if (!currentUser) return;
        const payload: TablesUpdate<'operators'> = { ...operatorData, updated_at: new Date().toISOString() };
        const { data, error } = await supabase.from('operators').update(payload).eq('id', operatorId).select().single();
        if (error) { showToast(`Failed to update operator: ${error.message}`, 'error'); } 
        else { setOperators(prev => prev.map(o => o.id === data.id ? data : o)); showToast("Operator updated.", "success"); }
    }, [currentUser, showToast]);

    const handleDeleteOperator = useCallback(async (operatorId: number) => {
        const { error } = await dataService.deleteOperator(operatorId);
        if (error) {
            showToast(`Failed to delete operator: ${error.message}`, "error");
        } else {
            setOperators(prev => prev.filter(o => o.id !== operatorId));
            showToast("Operator deleted.", "info");
        }
    }, [showToast]);

    // --- Content Draft Handlers ---
    const handleAddContentDraft = useCallback(async (draftData: Omit<ContentDraft, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'> & { status?: KanbanStatus }) => {
        if(!currentUser) return;

        const platformContentsForDb = {
            ...draftData.platform_contents,
            _media_overrides: draftData.platform_media_overrides || {},
        };

        const dataToInsert: TablesInsert<'content_drafts'> = {
            user_id: currentUser.id, 
            title: draftData.title,
            operator_id: draftData.operator_id,
            persona_id: draftData.persona_id, 
            key_message: draftData.key_message || null, 
            custom_prompt: draftData.custom_prompt,
            platform_contents: platformContentsForDb,
            tags: draftData.tags || [],
            status: draftData.status || 'Draft',
        };
        
        const { data, error } = await supabase.from('content_drafts').insert(dataToInsert).select().single();
        if (error) { 
            showToast(`Failed to save draft: ${error.message}`, 'error');
        } else if (data) {
            const [ newDraft ] = processRawDraftData([data]);
            setContentDrafts(prev => [...prev, newDraft]);
            showToast("Draft saved successfully!", "success");
        }
    }, [currentUser, showToast]);

    const handleUpdateContentDraft = useCallback(async (draftId: string, updates: TablesUpdate<'content_drafts'>) => {
        if (!currentUser) return;
        const { data, error } = await supabase.from('content_drafts').update(updates).eq('id', draftId).select().single();
        if (error) {
            showToast(`Failed to update draft: ${error.message}`, 'error');
        } else if (data) {
            const [ updatedDraft ] = processRawDraftData([data]);
            setContentDrafts(prev => prev.map(d => d.id === draftId ? updatedDraft : d));
            showToast('Draft updated.', 'success');
        }
    }, [currentUser, showToast]);

    const handleDeleteContentDraft = useCallback(async (draftId: string) => {
        if (window.confirm('Are you sure you want to delete this entire draft?')) {
            const { error } = await dataService.deleteContentDraft(draftId);
            if (error) {
                showToast(`Failed to delete draft: ${error.message}`, 'error');
            } else {
                setContentDrafts(prev => prev.filter(d => d.id !== draftId));
                showToast('Draft deleted.', 'info');
            }
        }
    }, [showToast]);
  
    const handleDeletePlatformContent = useCallback(async (draftId: string, platformKey: string) => {
        if (!currentUser) return;
        const draft = contentDrafts.find(d => d.id === draftId);
        if (!draft) return;

        const newPlatformContents = { ...draft.platform_contents };
        delete newPlatformContents[platformKey];
        
        const contentKeys = Object.keys(newPlatformContents);
        if (contentKeys.length === 0) {
            handleDeleteContentDraft(draftId);
            return;
        }

        const platformContentsForDb = {
            ...newPlatformContents,
            _media_overrides: draft.platform_media_overrides || {},
        };
        if (platformContentsForDb._media_overrides) {
            delete (platformContentsForDb._media_overrides as any)[platformKey];
        }

        try {
            const payload: TablesUpdate<'content_drafts'> = { platform_contents: platformContentsForDb };
            await supabase
                .from('content_drafts')
                .update(payload)
                .eq('id', draftId)
                .throwOnError();
            
            setContentDrafts(prev => prev.map(d => 
                d.id === draftId 
                ? { ...d, platform_contents: newPlatformContents } 
                : d 
            ));
            showToast(`Removed platform content from draft.`, 'success');
        } catch (error) {
            showToast(`Failed to update draft: ${(error as Error).message}`, 'error');
        }
    }, [currentUser, contentDrafts, showToast, handleDeleteContentDraft]);
  
    const handleAddScheduledPost = useCallback(async (post: Omit<ScheduledPost, 'id' | 'db_id' | 'title' | 'end'> & { title: string, end?: Date }) => {
        if(!currentUser) return;

        const draft = contentDrafts.find(d => d.id === post.resource.contentDraftId);
        if (!draft) {
            showToast("Associated content draft not found.", "error");
            return;
        }
        
        const payload: TablesInsert<'scheduled_posts'> = {
             user_id: currentUser.id, content_draft_id: post.resource.contentDraftId, platform_key: post.resource.platformKey,
            status: post.resource.status, notes: post.resource.notes || null, scheduled_at: post.start.toISOString(),
        };

        const { data, error } = await supabase.from('scheduled_posts').insert(payload).select().single();
        if(error) { showToast(`Failed to schedule: ${error.message}`, 'error');
        } else {
            
            const newPostForState: ScheduledPost = {
                id: `sch_${data.id}_${data.platform_key}`,
                db_id: data.id,
                title: post.title, // Title is already passed in from the hook with correct format
                start: new Date(data.scheduled_at),
                end: new Date(new Date(data.scheduled_at).getTime() + 60 * 60 * 1000), // Default 1 hr duration
                resource: {
                    ...post.resource,
                    notes: data.notes,
                    status: data.status,
                }
            };
            setScheduledPosts(prev => [...prev, newPostForState]);
            
            // Also update the draft's status
            await handleUpdateContentDraft(post.resource.contentDraftId, { status: 'Scheduled' });

            showToast("Post scheduled!", "success");
        }
    }, [currentUser, showToast, contentDrafts, handleUpdateContentDraft]);

    const handleUpdateScheduledPost = useCallback(async (post: ScheduledPost, updates: Partial<{start: Date, end: Date, notes: string, status: ScheduledPostStatus}>) => {
        if (!currentUser) return;
    
        // Optimistic UI update
        const updatedPostForState: ScheduledPost = {
            ...post,
            start: updates.start ?? post.start,
            end: updates.end ?? post.end,
            resource: {
                ...post.resource,
                notes: 'notes' in updates ? updates.notes : post.resource.notes,
                status: updates.status ?? post.resource.status,
            }
        };
        setScheduledPosts(prev => prev.map(p => p.id === post.id ? updatedPostForState : p));
    
        // Build database payload with only changed fields
        const updatePayload: TablesUpdate<'scheduled_posts'> = {};
        if (updates.start) {
            updatePayload.scheduled_at = updates.start.toISOString();
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'notes')) {
            updatePayload.notes = updates.notes || null;
        }
        if (updates.status) {
            updatePayload.status = updates.status;
        }
    
        // If there's nothing to update in the DB, just return
        if (Object.keys(updatePayload).length === 0) {
            showToast("Schedule updated.", "success");
            return;
        }
    
        // Make the database call
        const { error } = await supabase
            .from('scheduled_posts')
            .update(updatePayload)
            .eq('id', post.db_id);
    
        if (error) { 
            showToast(`Failed to update schedule: ${error.message}`, 'error'); 
            // Revert optimistic update on error
            setScheduledPosts(prev => prev.map(p => p.id === post.id ? post : p)); 
        } else { 
            showToast("Schedule updated.", "success");
        }
    }, [currentUser, showToast]);

    const handleDeleteScheduledPost = useCallback(async (postId: string) => {
        const post = scheduledPosts.find(p => p.id === postId);
        if (!post) return;
        const dbId = post.db_id;
        
        const { error } = await dataService.deleteScheduledPost(dbId);
        if (error) {
            showToast(`Failed to delete schedule: ${error.message}`, 'error');
        } else {
            setScheduledPosts(prev => prev.filter(p => p.id !== postId));
            // Revert draft status to 'Approved'
            await handleUpdateContentDraft(post.resource.contentDraftId, { status: 'Approved' });
            showToast("Schedule removed.", "info");
        }
    }, [showToast, scheduledPosts, handleUpdateContentDraft]);
  
    const handleAddConnectedAccount = useCallback(async (platform: SocialPlatformType, accountId: string, displayName: string) => {
        if(!currentUser) return;
        const payload: TablesInsert<'connected_accounts'> = { 
            platform, accountid: accountId, accountname: displayName, user_id: currentUser.id, created_at: new Date().toISOString() 
        };
        const { data, error } = await supabase.from('connected_accounts').insert(payload).select().single();
        if(error) { showToast(`Failed to connect account: ${error.message}`, 'error');
        } else {
            setConnectedAccounts(prev => [...prev, data as ConnectedAccount]);
            showToast(`Account ${displayName} connected.`, "success");
        }
    }, [currentUser, showToast]);

    const handleDeleteConnectedAccount = useCallback(async (accountId: string, platformName: string) => {
        const { error } = await dataService.deleteConnectedAccount(accountId);
        if (error) {
            showToast(`Failed to disconnect: ${error.message}`, 'error');
        } else {
            setConnectedAccounts(prev => prev.filter(acc => acc.id !== accountId));
            showToast(`Account for ${platformName} disconnected.`, "info");
        }
    }, [showToast]);

    const handleAddAsset = useCallback(async (file: File, name: string, tags: string[]) => {
        if (!currentUser) return;
        const storagePath = `${currentUser.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('content-library').upload(storagePath, file);
        if (uploadError) { showToast(`Upload failed: ${uploadError.message}`, 'error'); return; }
        
        const payload: TablesInsert<'content_library_assets'> = {
            user_id: currentUser.id, name, type: file.type.startsWith('image/') ? 'image' : 'video',
            storage_path: storagePath, file_name: file.name, file_type: file.type, size: file.size,
            tags: tags.length > 0 ? tags : null,
        };
        const { error: dbError } = await supabase.from('content_library_assets').insert(payload);
        if (dbError) { showToast(`Failed to save asset metadata: ${dbError.message}`, 'error');
        } else { showToast("Asset added to library!", "success"); fetchContentLibraryAssets(); }
    }, [currentUser, showToast, fetchContentLibraryAssets]);

    const handleUpdateAsset = useCallback(async (assetId: string, updates: Partial<Pick<ContentLibraryAsset, 'name' | 'tags'>>) => {
        if (!currentUser) return;
        const payload: TablesUpdate<'content_library_assets'> = updates;
        const { error } = await supabase.from('content_library_assets').update(payload).eq('id', assetId);
        if (error) { showToast(`Failed to update asset: ${error.message}`, 'error');
        } else { showToast("Asset updated successfully!", "success"); fetchContentLibraryAssets(); }
    }, [currentUser, showToast, fetchContentLibraryAssets]);

    const handleRemoveAsset = useCallback(async (assetId: string, storagePath: string) => {
        const { error } = await dataService.deleteContentLibraryAsset(assetId, storagePath);

        if (error) {
            showToast(`Failed to delete asset: ${error.message}`, 'error');
        } else {
            setContentLibraryAssets(prev => prev.filter(asset => asset.id !== assetId));
            showToast("Asset deleted successfully.", "success");
        }
    }, [showToast]);

    const handleAddCustomChannel = useCallback((name: string) => {
        if (!currentUser) return;
        const newChannel: CustomChannel = { id: `custom_${Date.now()}`, uuid: `uuid_${Date.now()}`, name, created_by: currentUser.id, created_at: new Date().toISOString() };
        const updatedChannels = [...customChannels, newChannel];
        setCustomChannels(updatedChannels);
        localStorage.setItem(`pixasocial_channels_${currentUser.id}`, JSON.stringify(updatedChannels));
        showToast(`Channel "${name}" created.`, 'success');
    }, [currentUser, customChannels, showToast]);

    const handleRemoveCustomChannel = useCallback((channelId: string) => {
        if (!currentUser) return;
        const updatedChannels = customChannels.filter(c => c.id !== channelId);
        setCustomChannels(updatedChannels);
        localStorage.setItem(`pixasocial_channels_${currentUser.id}`, JSON.stringify(updatedChannels));
        showToast(`Channel removed.`, 'info');
    }, [currentUser, customChannels, showToast]);
    
    return {
        personas,
        operators,
        contentDrafts,
        scheduledPosts,
        contentLibraryAssets,
        customChannels,
        connectedAccounts,
        adminPersonas,
        fetchers: {
            fetchPersonas,
            fetchOperators,
            fetchContentLibraryAssets,
            fetchConnectedAccounts,
            fetchAdminPersonas,
        },
        handlers: {
            addPersona: handleAddPersona,
            updatePersona: handleUpdatePersona,
            deletePersona: handleDeletePersona,
            addOperator: handleAddOperator,
            updateOperator: handleUpdateOperator,
            deleteOperator: handleDeleteOperator,
            addContentDraft: handleAddContentDraft,
            updateContentDraft: handleUpdateContentDraft,
            deleteContentDraft: handleDeleteContentDraft,
            deletePlatformContent: handleDeletePlatformContent,
            addScheduledPost: handleAddScheduledPost,
            updateScheduledPost: handleUpdateScheduledPost,
            deleteScheduledPost: handleDeleteScheduledPost,
            addConnectedAccount: handleAddConnectedAccount,
            deleteConnectedAccount: handleDeleteConnectedAccount,
            addAsset: handleAddAsset,
            updateAsset: handleUpdateAsset,
            removeAsset: handleRemoveAsset,
            addCustomChannel: handleAddCustomChannel,
            removeCustomChannel: handleRemoveCustomChannel,
        }
    };
};