

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../components/ui/ToastProvider';
import { 
    Persona, Operator, ContentDraft, ScheduledPost, ScheduledPostDbRow, 
    ContentLibraryAsset, CustomChannel, UserProfile, ConnectedAccount, 
    SocialPlatformType, Database, Json
} from '../types';
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


export const useAppData = (currentUser: UserProfile | null) => {
    const { showToast } = useToast();
  
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([]);
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
    const [contentLibraryAssets, setContentLibraryAssets] = useState<ContentLibraryAsset[]>([]);
    const [customChannels, setCustomChannels] = useState<CustomChannel[]>([]);
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
    
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

    useEffect(() => {
        if (!currentUser) return;
        const fetchAllData = async () => {
            fetchPersonas();
            fetchOperators();
            const { data: rawDraftData } = await supabase.from('content_drafts').select('*').eq('user_id', currentUser.id);

            // Process raw data to create the client-side ContentDraft shape
            const processedDrafts = (rawDraftData || []).map(draft => {
                const processedDraft: any = { ...draft };
                const dbContents = processedDraft.platform_contents as any;
                if (dbContents && dbContents._media_overrides) {
                    processedDraft.platform_media_overrides = dbContents._media_overrides;
                    delete dbContents._media_overrides;
                } else {
                    processedDraft.platform_media_overrides = null;
                }
                processedDraft.platform_contents = dbContents;
                return processedDraft as ContentDraft;
            });
            setContentDrafts(processedDrafts);

            fetchContentLibraryAssets();
            fetchConnectedAccounts();
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
        };
        fetchAllData();
    }, [currentUser, fetchContentLibraryAssets, fetchConnectedAccounts, fetchPersonas, fetchOperators]);

    // --- Persona Handlers ---
    const handleAddPersona = useCallback(async (personaData: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { avatar_base64?: string }) => {
        if(!currentUser || !personaData.name) return;

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

        const newPersonaData: Database['public']['Tables']['personas']['Insert'] = {
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
        };
        const { data, error } = await supabase.from('personas').insert(newPersonaData).select().single();
        if (error) { showToast(`Failed to create persona: ${error.message}`, 'error'); } 
        else { setPersonas(prev => [data, ...prev]); showToast("Persona created.", "success"); }
    }, [currentUser, showToast]);

    const handleUpdatePersona = useCallback(async (personaId: number, personaData: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at'>> & { avatar_base64?: string }) => {
        let updatePayload = { ...personaData };
        delete updatePayload.avatar_base64; // Remove base64 before it goes to db

        if (personaData.avatar_base64 && currentUser) {
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

        const { data, error } = await supabase.from('personas').update({ ...updatePayload, updated_at: new Date().toISOString() }).eq('id', personaId).select().single();
        if (error) { showToast(`Failed to update persona: ${error.message}`, 'error'); } 
        else { setPersonas(prev => prev.map(p => p.id === data.id ? data : p)); showToast("Persona updated.", "success"); }
    }, [currentUser, showToast]);


    const handleDeletePersona = useCallback(async (personaId: number) => {
        const { error } = await supabase.from('personas').delete().eq('id', personaId);
        if (error) { showToast(`Failed to delete persona: ${error.message}`, 'error'); } 
        else { setPersonas(prev => prev.filter(p => p.id !== personaId)); showToast("Persona deleted.", "info"); }
    }, [showToast]);

    // --- Operator Handlers ---
    const handleAddOperator = useCallback(async (operatorData: Omit<Operator, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        if(!currentUser) return;
        const newOperatorData: Database['public']['Tables']['operators']['Insert'] = { ...operatorData, user_id: currentUser.id };
        const { data, error } = await supabase.from('operators').insert(newOperatorData).select().single();
        if (error) { showToast(`Failed to create operator: ${error.message}`, 'error'); } 
        else { setOperators(prev => [data, ...prev]); showToast("Operator created.", "success"); }
    }, [currentUser, showToast]);

    const handleUpdateOperator = useCallback(async (operatorId: number, operatorData: Partial<Omit<Operator, 'id' | 'user_id' | 'created_at'>>) => {
        const { data, error } = await supabase.from('operators').update({ ...operatorData, updated_at: new Date().toISOString() }).eq('id', operatorId).select().single();
        if (error) { showToast(`Failed to update operator: ${error.message}`, 'error'); } 
        else { setOperators(prev => prev.map(o => o.id === data.id ? data : o)); showToast("Operator updated.", "success"); }
    }, [showToast]);

    const handleDeleteOperator = useCallback(async (operatorId: number) => {
        const { error } = await supabase.from('operators').delete().eq('id', operatorId);
        if (error) { showToast(`Failed to delete operator: ${error.message}`, 'error'); } 
        else { setOperators(prev => prev.filter(o => o.id !== operatorId)); showToast("Operator deleted.", "info"); }
    }, [showToast]);

    // --- Other Handlers ---
    const handleAddContentDraft = useCallback(async (draftData: Omit<ContentDraft, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        if(!currentUser) return;

        const platformContentsForDb = {
            ...draftData.platform_contents,
            _media_overrides: draftData.platform_media_overrides || {},
        };

        const dataToInsert: Database['public']['Tables']['content_drafts']['Insert'] = {
            user_id: currentUser.id, 
            operator_id: draftData.operator_id,
            persona_id: draftData.persona_id, 
            key_message: draftData.key_message || null, 
            custom_prompt: draftData.custom_prompt,
            platform_contents: platformContentsForDb as Json,
        };
        
        const { data, error } = await supabase.from('content_drafts').insert(dataToInsert).select().single();
        if (error) { 
            showToast(`Failed to save draft: ${error.message}`, 'error');
        } else if (data) {
            const newDraft: any = { ...data };
            if (newDraft.platform_contents && (newDraft.platform_contents as any)._media_overrides) {
                newDraft.platform_media_overrides = (newDraft.platform_contents as any)._media_overrides;
                delete (newDraft.platform_contents as any)._media_overrides;
            } else {
                newDraft.platform_media_overrides = null;
            }
            setContentDrafts(prev => [...prev, newDraft as ContentDraft]);
            showToast("Draft saved successfully!", "success");
        }
    }, [currentUser, showToast]);

    const handleDeleteContentDraft = useCallback(async (draftId: string) => {
        if (window.confirm('Are you sure you want to delete this entire draft?')) {
            const { error } = await supabase.from('content_drafts').delete().eq('id', draftId);
            if (error) { showToast(`Failed to delete draft: ${error.message}`, 'error'); } 
            else { setContentDrafts(prev => prev.filter(d => d.id !== draftId)); showToast('Draft deleted.', 'info'); }
        }
    }, [showToast]);
  
    const handleDeletePlatformContent = useCallback(async (draftId: string, platformKey: string) => {
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
            delete platformContentsForDb._media_overrides[platformKey];
        }

        const { error } = await supabase
            .from('content_drafts')
            .update({ platform_contents: platformContentsForDb as Json })
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
        if(!currentUser) return;
        const { data, error } = await supabase.from('scheduled_posts').insert({
            user_id: currentUser.id, content_draft_id: post.resource.contentDraftId, platform_key: post.resource.platformKey,
            status: post.resource.status, notes: post.resource.notes || null, scheduled_at: post.start.toISOString(),
        }).select().single();
        if(error) { showToast(`Failed to schedule: ${error.message}`, 'error');
        } else {
            const newPostWithDbId = { ...post, db_id: data.id, id: `sch_${data.id}_${data.platform_key}` };
            setScheduledPosts(prev => [...prev, newPostWithDbId]);
            showToast("Post scheduled!", "success");
        }
    }, [currentUser, showToast]);

    const handleUpdateScheduledPost = useCallback(async (post: ScheduledPost) => {
        const { error } = await supabase.from('scheduled_posts').update({
            notes: post.resource.notes || null, status: post.resource.status, scheduled_at: post.start.toISOString(),
            error_message: post.resource.error_message || null, last_attempted_at: post.resource.last_attempted_at || null,
        }).eq('id', post.db_id);
        if (error) { showToast(`Failed to update schedule: ${error.message}`, 'error'); } 
        else { setScheduledPosts(prev => prev.map(p => p.id === post.id ? post : p)); }
    }, [showToast]);

    const handleDeleteScheduledPost = useCallback(async (postId: string) => {
        const postToDelete = scheduledPosts.find(p => p.id === postId);
        if (!postToDelete) return;
        const { error } = await supabase.from('scheduled_posts').delete().eq('id', postToDelete.db_id);
        if(error) { showToast(`Failed to delete schedule: ${error.message}`, 'error');
        } else {
            setScheduledPosts(prev => prev.filter(p => p.id !== postId));
            showToast("Schedule removed.", "info");
        }
    }, [scheduledPosts, showToast]);
  
    const handleAddConnectedAccount = useCallback(async (platform: SocialPlatformType, accountId: string, displayName: string) => {
        if(!currentUser) return;
        const { data, error } = await supabase.from('connected_accounts').insert({ 
            platform, accountid: accountId, accountname: displayName, user_id: currentUser.id, created_at: new Date().toISOString() 
        }).select().single();
        if(error) { showToast(`Failed to connect account: ${error.message}`, 'error');
        } else {
            setConnectedAccounts(prev => [...prev, data as ConnectedAccount]);
            showToast(`Account ${displayName} connected.`, "success");
        }
    }, [currentUser, showToast]);

    const handleDeleteConnectedAccount = useCallback(async (accountId: string, platformName: string) => {
        const { error } = await supabase.from('connected_accounts').delete().eq('id', accountId);
        if(error) { showToast(`Failed to disconnect: ${error.message}`, 'error');
        } else {
            fetchConnectedAccounts();
            showToast(`Account for ${platformName} disconnected.`, "info");
        }
    }, [showToast, fetchConnectedAccounts]);

    const handleAddAsset = useCallback(async (file: File, name: string, tags: string[]) => {
        if (!currentUser) return;
        const storagePath = `${currentUser.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('content-library').upload(storagePath, file);
        if (uploadError) { showToast(`Upload failed: ${uploadError.message}`, 'error'); return; }
        const { error: dbError } = await supabase.from('content_library_assets').insert({
            user_id: currentUser.id, name, type: file.type.startsWith('image/') ? 'image' : 'video',
            storage_path: storagePath, file_name: file.name, file_type: file.type, size: file.size,
            tags: tags.length > 0 ? tags : null,
        });
        if (dbError) { showToast(`Failed to save asset metadata: ${dbError.message}`, 'error');
        } else { showToast("Asset added to library!", "success"); fetchContentLibraryAssets(); }
    }, [currentUser, showToast, fetchContentLibraryAssets]);

    const handleUpdateAsset = useCallback(async (assetId: string, updates: Partial<Pick<ContentLibraryAsset, 'name' | 'tags'>>) => {
        const { error } = await supabase.from('content_library_assets').update(updates).eq('id', assetId);
        if (error) { showToast(`Failed to update asset: ${error.message}`, 'error');
        } else { showToast("Asset updated successfully!", "success"); fetchContentLibraryAssets(); }
    }, [showToast, fetchContentLibraryAssets]);

    const handleRemoveAsset = useCallback(async (assetId: string) => {
        const assetToDelete = contentLibraryAssets.find(a => a.id === assetId);
        if (!assetToDelete) return;
        await supabase.storage.from('content-library').remove([assetToDelete.storage_path]);
        const { error } = await supabase.from('content_library_assets').delete().eq('id', assetId);
        if (error) { showToast(`Failed to delete asset record: ${error.message}`, 'error');
        } else { showToast("Asset deleted successfully.", "info"); fetchContentLibraryAssets(); }
    }, [contentLibraryAssets, showToast, fetchContentLibraryAssets]);
  
    const handleAddCustomChannel = useCallback((name: string) => {
        if(!currentUser) return;
        const newChannel: CustomChannel = { id: `custom_${Date.now()}`, uuid: `uuid_${Date.now()}`, name, created_by: currentUser.id, created_at: new Date().toISOString() };
        const updatedChannels = [...customChannels, newChannel];
        setCustomChannels(updatedChannels);
        localStorage.setItem(`pixasocial_channels_${currentUser.id}`, JSON.stringify(updatedChannels));
        showToast(`Channel "${name}" created.`, "success");
    }, [customChannels, currentUser, showToast]);

    const handleRemoveCustomChannel = useCallback((channelId: string) => {
        if(!currentUser) return;
        const updatedChannels = customChannels.filter(c => c.id !== channelId);
        setCustomChannels(updatedChannels);
        localStorage.setItem(`pixasocial_channels_${currentUser.id}`, JSON.stringify(updatedChannels));
        showToast(`Channel removed.`, "info");
    }, [customChannels, currentUser, showToast]);

    return {
        personas, operators, contentDrafts, scheduledPosts,
        contentLibraryAssets, customChannels, connectedAccounts,
        handlers: {
            addPersona: handleAddPersona,
            updatePersona: handleUpdatePersona,
            deletePersona: handleDeletePersona,
            addOperator: handleAddOperator,
            updateOperator: handleUpdateOperator,
            deleteOperator: handleDeleteOperator,
            addContentDraft: handleAddContentDraft,
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
            removeCustomChannel: handleRemoveCustomChannel
        },
        fetchers: {
            fetchConnectedAccounts,
            fetchPersonas,
            fetchOperators,
        }
    };
};