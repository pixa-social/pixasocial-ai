
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    ScheduledPost, ViewName, UserProfile, ContentDraft, 
    ScheduledPostStatus, ConnectedAccount, Persona, Operator, SocialPlatformType 
} from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Tabs, Tab } from '../ui/Tabs';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/ToastProvider';
import { SOCIAL_PLATFORMS_TO_CONNECT, ACCEPTED_MEDIA_TYPES, MAX_FILE_UPLOAD_SIZE_MB } from '../../constants';
import { UploadCloudIcon } from '../ui/Icons';
import { generateText } from '../../services/aiService';
import { supabase } from '../../services/supabaseClient';

interface SocialPosterViewProps {
    currentUser: UserProfile;
    contentDrafts: ContentDraft[];
    personas: Persona[];
    operators: Operator[];
    onAddScheduledPost: (post: ScheduledPost) => void;
    // The following props are kept for API consistency but may be used less in this new UI
    scheduledPosts: ScheduledPost[];
    connectedAccounts: ConnectedAccount[];
    onUpdateScheduledPost: (post: ScheduledPost) => void;
    onDeleteScheduledPost: (postId: string) => void;
    onNavigate?: (view: ViewName) => void;
}

// Helper function to convert file to base64 data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const SocialPosterView: React.FC<SocialPosterViewProps> = ({
    currentUser, contentDrafts, personas, operators, onAddScheduledPost, onNavigate
}) => {
    const { showToast } = useToast();
    const [selectedNetworks, setSelectedNetworks] = useState<Set<SocialPlatformType>>(new Set([SocialPlatformType.Instagram]));
    const [postText, setPostText] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isShortenLinks, setIsShortenLinks] = useState(false);
    const [instagramPostType, setInstagramPostType] = useState('Regular Post');
    const [isDragging, setIsDragging] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const personaOptions = useMemo(() => personas.map(p => ({ value: p.id.toString(), label: p.name })), [personas]);
    const operatorOptions = useMemo(() => operators.map(o => ({ value: o.id.toString(), label: `${o.name} (${o.type})` })), [operators]);
    const draftOptions = useMemo(() => contentDrafts.map(d => ({ value: d.id, label: `Draft for ${personas.find(p => p.id === d.persona_id)?.name || 'N/A'} (ID: ${d.id.substring(0,6)})`})), [contentDrafts, personas]);

    const handleNetworkToggle = (platformId: SocialPlatformType) => {
        setSelectedNetworks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(platformId)) {
                newSet.delete(platformId);
            } else {
                newSet.add(platformId);
            }
            return newSet;
        });
    };
    
    const handleImportDraft = (draftId: string) => {
        if (!draftId) {
            setPostText('');
            setSelectedPersonaId('');
            setSelectedOperatorId('');
            return;
        }
        const draft = contentDrafts.find(d => d.id === draftId);
        if (draft) {
            const firstPlatformWithContent = Object.values(draft.platform_contents)[0];
            setPostText(firstPlatformWithContent?.content || '');
            setSelectedPersonaId(draft.persona_id.toString());
            setSelectedOperatorId(draft.operator_id.toString());
            const draftPlatforms = new Set(Object.keys(draft.platform_contents) as SocialPlatformType[]);
            setSelectedNetworks(draftPlatforms);
            showToast('Draft content imported!', 'success');
        }
    };

    const handleGenerateWithAi = async () => {
        if (!selectedPersonaId || !selectedOperatorId) {
            showToast("Please select a Persona and Operator for AI generation.", "error");
            return;
        }
        setIsLoadingAi(true);
        const persona = personas.find(p => p.id === parseInt(selectedPersonaId));
        const operator = operators.find(o => o.id === parseInt(selectedOperatorId));
        if (!persona || !operator) {
            showToast("Selected persona or operator not found.", "error");
            setIsLoadingAi(false);
            return;
        }
        
        const prompt = `Based on Persona "${persona.name}" and Operator "${operator.name} (${operator.type})", write a generic social media post. The target platforms are: ${Array.from(selectedNetworks).join(', ')}.`;
        const result = await generateText(prompt, currentUser, "You are a social media content creator.");
        
        if (result.text) {
            setPostText(result.text);
        } else {
            showToast(result.error || "AI failed to generate text.", "error");
        }
        setIsLoadingAi(false);
    };
    
    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setUploadedFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };

    const handlePublish = async () => {
        if (selectedNetworks.size === 0) {
            showToast("Please select at least one social network.", "error");
            return;
        }

        setIsPublishing(true);
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const network of Array.from(selectedNetworks)) {
             try {
                if (network === SocialPlatformType.Telegram) {
                    if (!postText.trim() && uploadedFiles.length === 0) {
                        throw new Error("Telegram requires either text or an image.");
                    }

                    if (uploadedFiles.length > 1) {
                        showToast("Telegram only supports one image per post. Using the first one.", "info");
                    }
                    
                    let imageData: string | undefined = undefined;
                    if (uploadedFiles.length > 0) {
                        // Convert the first file to a data URL (base64)
                        imageData = await fileToDataURL(uploadedFiles[0]);
                    }

                    const { data, error: postError } = await supabase.functions.invoke('post-to-telegram', {
                        body: { 
                            text: postText,
                            imageData: imageData
                        }
                    });

                    if (postError) throw postError;
                    if (data.error) throw new Error(data.error);
                    
                    successCount++;

                } else {
                    // Placeholder for other platforms
                    showToast(`Publishing to ${network} is not yet implemented for images/videos.`, "info");
                }
            } catch (e) {
                const error = e as Error;
                let errorMessage = error.message;
                // Check if it's an HTTP error from the function and try to parse the body for a more detailed message
                if ((error as any).context && typeof (error as any).context.json === 'function') {
                    try {
                        const functionError = await (error as any).context.json();
                        if (functionError.error) {
                            errorMessage = functionError.error;
                        }
                    } catch (parseErr) { /* ignore */ }
                }
                errors.push(`${network}: ${errorMessage}`);
                errorCount++;
            }
        }

        setIsPublishing(false);

        if (successCount > 0) {
            showToast(`Successfully published to ${successCount} network(s).`, 'success');
            // Clear inputs on success
            setPostText('');
            setUploadedFiles([]);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
        if (errorCount > 0) {
            showToast(`Failed to publish to ${errorCount} network(s). Errors: ${errors.join('; ')}`, 'error', 10000);
        }
    };

    const handleSchedule = () => {
        if (selectedNetworks.size === 0) {
            showToast("Please select at least one social network.", "error");
            return;
        }
        showToast("Opening scheduler... (Not implemented in this version)", "info");
        // In a real app, this would open a scheduling modal
    };

    const handleViewJson = () => {
        const jsonData = {
            platforms: Array.from(selectedNetworks),
            postText,
            mediaFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
            options: {
                isShortenLinks,
                instagramPostType: selectedNetworks.has(SocialPlatformType.Instagram) ? instagramPostType : undefined,
            }
        };
        console.log(JSON.stringify(jsonData, null, 2));
        showToast("Current post state logged to browser console.", "info");
    };


    const platformToggles = SOCIAL_PLATFORMS_TO_CONNECT.filter(p => p.name !== 'Discord').sort((a,b) => a.name.localeCompare(b.name));

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Card title="Social Networks">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
                    {platformToggles.map(platform => (
                        <div key={platform.id} className="flex items-center space-x-2">
                            <Switch
                                id={`switch-${platform.id}`}
                                checked={selectedNetworks.has(platform.id)}
                                onCheckedChange={() => handleNetworkToggle(platform.id)}
                            />
                            <label htmlFor={`switch-${platform.id}`} className="flex items-center space-x-1.5 text-sm font-medium text-textPrimary cursor-pointer">
                                <platform.icon className="w-5 h-5" />
                                <span>{platform.name}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <Select label="Target Persona (for AI)" options={[{value: '', label: 'Select...'}, ...personaOptions]} value={selectedPersonaId} onChange={e => setSelectedPersonaId(e.target.value)} containerClassName="mb-0" />
                             <Select label="Campaign Operator (for AI)" options={[{value: '', label: 'Select...'}, ...operatorOptions]} value={selectedOperatorId} onChange={e => setSelectedOperatorId(e.target.value)} containerClassName="mb-0" />
                            <Button onClick={handleGenerateWithAi} isLoading={isLoadingAi} disabled={!selectedPersonaId || !selectedOperatorId || isLoadingAi} className="self-end h-10">Generate with AI</Button>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                             <Select label="Import from Draft" options={[{value: '', label: 'Select a draft...'}, ...draftOptions]} onChange={e => handleImportDraft(e.target.value)} containerClassName="mb-0 md:col-span-2" />
                        </div>
                    </Card>

                    <Card>
                        <Textarea
                            label="Post Text"
                            placeholder="Enter post text"
                            value={postText}
                            onChange={(e) => setPostText(e.target.value)}
                            rows={8}
                            containerClassName="mb-4"
                        />
                        <h3 className="text-base font-semibold text-textPrimary mb-2">Add Images or a Video</h3>
                        <Tabs>
                            <Tab label="Upload Files">
                                <div 
                                    className={`mt-2 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-mediumBorder hover:border-primary'}`}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                                    onDrop={handleFileDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
                                        accept={ACCEPTED_MEDIA_TYPES.join(',')}
                                    />
                                    <UploadCloudIcon className="w-12 h-12 mx-auto text-textSecondary" />
                                    <p className="mt-2 text-sm text-textPrimary font-semibold">
                                        Click to Upload or Drag & Drop
                                    </p>
                                    <p className="text-xs text-textSecondary">PNG, JPG, GIF, WEBP, MP4, MOV or AVI up to {MAX_FILE_UPLOAD_SIZE_MB} MB</p>
                                </div>
                                {uploadedFiles.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium">Selected files:</p>
                                        <ul className="list-disc list-inside text-sm text-textSecondary">
                                            {uploadedFiles.map(file => <li key={file.name}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>)}
                                        </ul>
                                    </div>
                                )}
                            </Tab>
                            <Tab label="Use URLs">
                                <div className="mt-2 p-8 border-2 border-dashed border-mediumBorder rounded-lg text-center">
                                    <p className="text-textSecondary">Pasting URLs for media is coming soon!</p>
                                </div>
                            </Tab>
                        </Tabs>
                         {selectedNetworks.has(SocialPlatformType.Instagram) && <p className="text-xs text-danger mt-4">Media required for Instagram. <a href="#" className="underline">Media guidelines</a></p>}
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card title="Additional Options">
                        <div className="flex items-center justify-between">
                            <label htmlFor="shorten-links" className="text-sm font-medium text-textPrimary">Shorten Links</label>
                            <Switch id="shorten-links" checked={isShortenLinks} onCheckedChange={setIsShortenLinks} />
                        </div>
                        <p className="text-xs text-textSecondary mt-1">Track clicks and demographics</p>

                        {selectedNetworks.has(SocialPlatformType.Instagram) && (
                            <div className="mt-6">
                                <Select 
                                    label="Instagram Post Type"
                                    options={[
                                        { value: 'Regular Post', label: 'Regular Post'},
                                        { value: 'Reel', label: 'Reel'},
                                        { value: 'Story', label: 'Story'},
                                    ]}
                                    value={instagramPostType}
                                    onChange={e => setInstagramPostType(e.target.value)}
                                    containerClassName="mb-0"
                                />
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                 <Button variant="outline" onClick={handleViewJson}>
                    {'</> View JSON'}
                </Button>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={handleSchedule}>Schedule Post</Button>
                    <Button variant="primary" onClick={handlePublish} isLoading={isPublishing}>Publish Post</Button>
                </div>
            </div>
        </div>
    );
};
