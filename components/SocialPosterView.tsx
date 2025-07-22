// SocialPosterView.tsx  – improved design, same contract
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ScheduledPost, ViewName, UserProfile, ContentDraft,
  ScheduledPostStatus, ConnectedAccount, Persona, Operator, SocialPlatformType
} from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Switch } from './ui/Switch';
import { Tabs, Tab } from './ui/Tabs';
import { useToast } from './ui/ToastProvider';
import { SOCIAL_PLATFORMS_TO_CONNECT, ACCEPTED_MEDIA_TYPES, MAX_FILE_UPLOAD_SIZE_MB } from '../constants';
import { UploadCloudIcon } from './ui/Icons';
import { generateText } from '../services/aiService';
import { supabase } from '../services/supabaseClient';
import { SocialPostPreview } from './social-poster/SocialPostPreview';
import { useAppDataContext } from './MainAppLayout';

const fileToDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const SocialPosterView: React.FC = () => {
  const { 
    currentUser, 
    contentDrafts, 
    personas, 
    operators, 
    handlers, 
  } = useAppDataContext();
  const { addScheduledPost } = handlers;

  const { showToast } = useToast();
  const [selectedNetworks, setSelectedNetworks] = useState<Set<SocialPlatformType>>(new Set([SocialPlatformType.Instagram]));
  const [postText, setPostText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isShortenLinks, setIsShortenLinks] = useState(false);
  const [instagramPostType, setInstagramPostType] = useState('Regular Post');
  const [isDragging, setIsDragging] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- data ---------- */
  const personaOptions   = useMemo(() => personas.map(p => ({ value: p.id.toString(), label: p.name })), [personas]);
  const operatorOptions  = useMemo(() => operators.map(o => ({ value: o.id.toString(), label: `${o.name} (${o.type})` })), [operators]);
  const draftOptions     = useMemo(() => contentDrafts.map(d => ({ value: d.id, label: `Draft for ${personas.find(p => p.id === d.persona_id)?.name || 'N/A'}` })), [contentDrafts, personas]);
  const hasNoCredits = currentUser.ai_usage_count_monthly >= currentUser.role.max_ai_uses_monthly;

  const platformToggles = SOCIAL_PLATFORMS_TO_CONNECT.filter(p => p.name !== 'Discord').sort((a, b) => a.name.localeCompare(b.name));

  /* ---------- handlers ---------- */
  const handleNetworkToggle = (platformId: SocialPlatformType) => {
    setSelectedNetworks(prev => {
      const next = new Set(prev);
      next.has(platformId) ? next.delete(platformId) : next.add(platformId);
      return next;
    });
  };

  const handleImportDraft = (draftId: string) => {
    if (!draftId) return setPostText('');
    const draft = contentDrafts.find(d => d.id === draftId);
    if (draft) {
      const [first] = Object.values(draft.platform_contents);
      setPostText(first?.content || '');
      setSelectedPersonaId(draft.persona_id.toString());
      setSelectedOperatorId(draft.operator_id.toString());
      setSelectedNetworks(new Set(Object.keys(draft.platform_contents) as SocialPlatformType[]));
      showToast('Draft imported ✨', 'success');
    }
  };

  const handleGenerateWithAi = async () => {
    if (!selectedPersonaId || !selectedOperatorId) return showToast('Pick persona + operator', 'error');
    setIsLoadingAi(true);
    const persona  = personas.find(p => p.id === +selectedPersonaId);
    const operator = operators.find(o => o.id === +selectedOperatorId);
    const prompt   = `Write a social post for ${persona?.name} using ${operator?.name} (${operator?.type}) targeting ${Array.from(selectedNetworks).join(', ')}`;
    const result   = await generateText(prompt, currentUser, 'You are a social media expert');
    if (result.text) setPostText(result.text); else showToast(result.error || 'AI failed', 'error');
    setIsLoadingAi(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) setUploadedFiles(Array.from(e.dataTransfer.files));
  };

  const handlePublish = async () => {
    if (!selectedNetworks.size) return showToast('Pick at least one network', 'error');
    setIsPublishing(true);
    let ok = 0, err = 0;
    for (const n of selectedNetworks) {
      try {
        if (n === SocialPlatformType.Telegram) {
          let img: string | undefined;
          if (uploadedFiles.length) img = await fileToDataURL(uploadedFiles[0]);
          const { data, error } = await supabase.functions.invoke('post-to-telegram', { body: { text: postText, imageData: img } });
          if (error || data?.error) throw new Error(data?.error || error?.message);
          ok++;
        } else {
          showToast(`${n} publishing placeholder`, 'info');
        }
      } catch (e) {
        showToast(`${n}: ${(e as Error).message}`, 'error');
        err++;
      }
    }
    if (ok) {
      setPostText('');
      setUploadedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast(`Published to ${ok} network(s)`, 'success');
    }
    setIsPublishing(false);
  };

  const handleSchedule = () => showToast('Scheduler coming soon', 'info');

  /* ---------- preview helpers ---------- */
    useEffect(() => {
        if (uploadedFiles.length === 0) {
            setImagePreviews([]);
            return;
        }

        const imageFiles = uploadedFiles.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            setImagePreviews([]);
            return;
        }

        const generatePreviews = async () => {
            try {
                const previewPromises = imageFiles.map(file => fileToDataURL(file));
                const previews = await Promise.all(previewPromises);
                setImagePreviews(previews);
            } catch (error) {
                showToast('Could not generate image previews.', 'error');
                setImagePreviews([]);
            }
        };

        generatePreviews();
    }, [uploadedFiles, showToast]);

    const previewText = useMemo(() => {
        if (!isShortenLinks) {
            return postText;
        }
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let urlCount = 0;
        return postText.replace(urlRegex, () => {
            urlCount++;
            return `https://pixa.so/${(Math.random() + 1).toString(36).substring(7)}${urlCount}`;
        });
    }, [postText, isShortenLinks]);

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handlePublish();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [handlePublish]);

  return (
    <div className="p-2 md:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------- LEFT – CONFIG ---------- */}
        <div className="lg:col-span-2 space-y-6">
          {/* networks */}
          <Card title="1. Choose Networks">
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {platformToggles.map((p) => {
                const active = selectedNetworks.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleNetworkToggle(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all
                      ${active ? 'bg-primary text-white border-primary shadow-md' : 'bg-card border-lightBorder hover:border-primary'}`}
                  >
                    <p.icon className="w-4 h-4" />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ai & draft */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <Select
                label="Target Persona"
                options={[{ value: '', label: 'Select…' }, ...personaOptions]}
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
              />
              <Select
                label="Operator"
                options={[{ value: '', label: 'Select…' }, ...operatorOptions]}
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
              />
              <Button
                onClick={handleGenerateWithAi}
                isLoading={isLoadingAi}
                disabled={!selectedPersonaId || !selectedOperatorId}
              >
                Generate
              </Button>
            </div>

            <Select
              label="Import from draft"
              className="mt-3"
              options={[{ value: '', label: 'Select…' }, ...draftOptions]}
              onChange={(e) => handleImportDraft(e.target.value)}
            />
          </Card>

          {/* post text */}
          <Card title="2. Post Text">
            <Textarea
              placeholder="What's on your mind?"
              rows={6}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            {selectedNetworks.has(SocialPlatformType.Instagram) && (
              <Select
                label="Instagram post type"
                className="mt-3"
                options={[
                  { value: 'Regular Post', label: 'Regular Post' },
                  { value: 'Reel', label: 'Reel' },
                  { value: 'Story', label: 'Story' },
                ]}
                value={instagramPostType}
                onChange={(e) => setInstagramPostType(e.target.value)}
              />
            )}
          </Card>

          {/* media */}
          <Card title="3. Media">
            <Tabs>
              <Tab label="Upload">
                <div
                  className={`mt-2 p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-mediumBorder hover:border-primary'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_MEDIA_TYPES.join(',')}
                    className="hidden"
                    onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
                  />
                  <UploadCloudIcon className="w-10 h-10 mx-auto text-textSecondary" />
                  <p className="mt-2 font-semibold">Drag & drop or click</p>
                  <p className="text-xs text-textSecondary">
                    PNG, JPG, GIF, WEBP, MP4, MOV, AVI (max {MAX_FILE_UPLOAD_SIZE_MB}MB)
                  </p>
                </div>
                {uploadedFiles.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {uploadedFiles.map((f) => (
                      <li key={f.name} className="flex items-center justify-between">
                        <span className="truncate">{f.name}</span>
                        <span className="text-xs text-textSecondary">
                          {(f.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Tab>
              <Tab label="URLs (soon)">
                <div className="p-6 text-center text-textSecondary">Paste media URLs coming soon…</div>
              </Tab>
            </Tabs>
          </Card>
        </div>

        {/* ---------- RIGHT – PREVIEW & ACTIONS ---------- */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card title="Live preview">
            <SocialPostPreview
                user={currentUser}
                text={previewText}
                imagePreviews={imagePreviews}
                nonImageFileCount={uploadedFiles.length - imagePreviews.length}
            />
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Shorten links</span>
              <Switch checked={isShortenLinks} onCheckedChange={setIsShortenLinks} />
            </div>
            <p className="text-xs text-textSecondary mt-1">Track clicks & demographics</p>
          </Card>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" onClick={handleSchedule} className="flex-1">
              Schedule
            </Button>
            <Button
              variant="primary"
              onClick={handlePublish}
              isLoading={isPublishing}
              disabled={
                !selectedNetworks.size ||
                isPublishing ||
                hasNoCredits
              }
              className="flex-1"
            >
              {isPublishing ? 'Publishing…' : 'Publish now'}
            </Button>
          </div>

          {hasNoCredits && (
            <p className="text-center text-sm text-yellow-400 mt-1">
              You’ve used all AI credits this month.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
