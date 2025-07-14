

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
    ContentDraft, Persona, Operator, PlatformContentMap, PlatformContentDetail, 
    MediaType, ScheduledPost, ImageSourceType, UserProfile, RSTProfile 
} from '../types';
import { useToast } from '../components/ui/ToastProvider';
import { generateJson, generateImages } from '../services/aiService';
import { 
    CONTENT_PLATFORMS, DEFAULT_FONT_FAMILY, DEFAULT_FONT_COLOR, 
    FONT_CATEGORY_MAP, ACCEPTED_IMAGE_TYPES,
    MAX_FILE_UPLOAD_SIZE_BYTES, MAX_FILE_UPLOAD_SIZE_MB
} from '../constants';

interface UseContentPlannerProps {
  currentUser: UserProfile;
  contentDrafts: ContentDraft[];
  personas: Persona[];
  operators: Operator[];
  onAddContentDraft: (draft: Omit<ContentDraft, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onAddScheduledPost: (post: ScheduledPost) => void;
  onAddContentLibraryAsset: (file: File, name: string, tags: string[]) => Promise<void>;
}

const initialSelectedPlatforms = Object.fromEntries(CONTENT_PLATFORMS.map(p => [p.key, true]));
const initialPlatformMediaOverrides: Record<string, MediaType | 'global'> = Object.fromEntries(
    CONTENT_PLATFORMS.map(p => [p.key, 'global' as const])
);


export const useContentPlanner = ({
  currentUser, contentDrafts, personas, operators,
  onAddContentDraft, onAddScheduledPost, onAddContentLibraryAsset,
}: UseContentPlannerProps) => {
  const { showToast } = useToast();
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<number | null>(null);
  const [keyMessage, setKeyMessage] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [globalMediaType, setGlobalMediaType] = useState<MediaType>('none');
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [defaultFontFamily, setDefaultFontFamily] = useState<string>(DEFAULT_FONT_FAMILY);
  const [defaultFontColor, setDefaultFontColor] = useState<string>(DEFAULT_FONT_COLOR);
  
  const [selectedPlatformsForGeneration, setSelectedPlatformsForGeneration] = useState<Record<string, boolean>>(initialSelectedPlatforms);
  const [platformMediaOverrides, setPlatformMediaOverrides] = useState<Record<string, MediaType | 'global'>>(initialPlatformMediaOverrides);

  const [platformContents, setPlatformContents] = useState<PlatformContentMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState<Record<string, boolean>>({});
  const [isRegeneratingPlatform, setIsRegeneratingPlatform] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [schedulingPostInfo, setSchedulingPostInfo] = useState<{draft: ContentDraft, platformKey: string, platformDetail: PlatformContentDetail} | null>(null);
  
  const imageUploadRefs = useRef<Record<string, React.RefObject<HTMLInputElement>>>({});
  CONTENT_PLATFORMS.forEach(platform => {
    if (!imageUploadRefs.current[platform.key]) {
      imageUploadRefs.current[platform.key] = React.createRef<HTMLInputElement>();
    }
  });
  
  const isAnyPlatformSelectedForGeneration = useMemo(() => Object.values(selectedPlatformsForGeneration).some(isSelected => isSelected), [selectedPlatformsForGeneration]);

  const getEffectiveMediaType = useCallback((platformKey: string): MediaType => {
      const platformOverride = platformMediaOverrides[platformKey];
      const isPoster = CONTENT_PLATFORMS.find(p => p.key === platformKey)?.isPoster;
      if (isPoster) return 'image';
      return platformOverride && platformOverride !== 'global' ? platformOverride : globalMediaType;
  }, [platformMediaOverrides, globalMediaType]);

  const handleGenerateOrRegenerate = useCallback(async (forSpecificPlatformKey?: string) => {
    if (!selectedPersonaId || !selectedOperatorId) {
        showToast("Please select a Persona and Operator first.", "error"); return;
    }
    const persona = personas.find(p => p.id === selectedPersonaId);
    const operator = operators.find(o => o.id === selectedOperatorId);
    if (!persona || !operator) {
        showToast("Selected Persona or Operator not found.", "error"); return;
    }

    const platformsToGenerateFor = forSpecificPlatformKey 
        ? [CONTENT_PLATFORMS.find(p => p.key === forSpecificPlatformKey)].filter(Boolean) as typeof CONTENT_PLATFORMS
        : CONTENT_PLATFORMS.filter(p => selectedPlatformsForGeneration[p.key]);

    if (platformsToGenerateFor.length === 0) {
        showToast("Please select at least one platform to generate content for.", "error"); return;
    }

    if(forSpecificPlatformKey) { setIsRegeneratingPlatform(prev => ({ ...prev, [forSpecificPlatformKey]: true })); } 
    else { setIsLoading(true); setPlatformContents({}); }
    setError(null);
    
    const rstProfile = persona.rst_profile as unknown as RSTProfile | null;

    const platformGuidelines = platformsToGenerateFor.map(p => {
        const mediaType = getEffectiveMediaType(p.key);
        return `"${p.key}": { "guideline": "${p.styleGuideline}", "mediaType": "${mediaType}" }`;
    }).join(',\n');
    
    const systemInstruction = "You are an expert social media content strategist. Generate tailored content for multiple platforms based on deep psychological insights. Your entire response must be a single, valid JSON object where keys are platform identifiers (e.g., 'X', 'Facebook'). Each key's value must be an object containing the requested content fields like 'content', 'hashtags', 'subject', 'imagePrompt', 'videoIdea', 'memeText', etc. Adhere strictly to the guidelines and requested media type for each platform.";
    
    const prompt = `
      Persona Profile:
      - Name: ${persona.name}
      - Demographics: ${persona.demographics}
      - Psychographics: ${persona.psychographics}
      - Initial Beliefs: ${persona.initial_beliefs}
      - Vulnerabilities: ${persona.vulnerabilities?.join(', ') || 'Not specified'}
      - RST Profile: BAS: ${rstProfile?.bas || 'N/A'}, BIS: ${rstProfile?.bis || 'N/A'}, FFFS: ${rstProfile?.fffs || 'N/A'}

      Campaign Operator:
      - Name: ${operator.name}
      - Type: ${operator.type}
      - Desired Response: ${operator.desired_conditioned_response}
      - Reinforcement Loop: ${operator.reinforcement_loop}

      Content Directives:
      - Key Message: ${keyMessage || "Based on the operator's desired response."}
      - Tone of Voice: ${selectedTone || 'Neutral'}
      - Additional Instructions: ${customPrompt || 'None'}
      
      Platform-Specific Generation Request:
      Generate content for the following platforms based on their unique guidelines and media types.
      Your response MUST be a JSON object with a key for each platform requested below.
      
      {
        ${platformGuidelines}
      }

      For each platform, provide the appropriate fields. For example:
      - For 'X', 'Facebook', etc., provide "content" (string) and "hashtags" (array of strings).
      - For 'Email', provide "subject" (string) and "content" (string).
      - For 'Poster' types, focus on "imagePrompt" (string for DALL-E/Imagen) and "memeText" (string).
      - For "video" mediaType, provide "videoIdea" (string).
      - If you suggest a font, add an "aiSuggestedFontCategory" field with one of these values: ${Object.keys(FONT_CATEGORY_MAP).join(', ')}.
    `;
    
    try {
        const result = await generateJson<PlatformContentMap>(prompt, currentUser, systemInstruction);
        if (result.data) {
            const requestedPlatformKeys = platformsToGenerateFor.map(p => p.key);
            const filteredResultData = Object.fromEntries(
                Object.entries(result.data).filter(([key]) => requestedPlatformKeys.includes(key))
            );

            const processedData = Object.entries(filteredResultData).reduce((acc, [key, value]) => {
                const effectiveMediaType = getEffectiveMediaType(key);
                const valueWithDefaults: PlatformContentDetail = {
                    ...value,
                    mediaType: effectiveMediaType,
                    fontFamily: value.aiSuggestedFontCategory && FONT_CATEGORY_MAP[value.aiSuggestedFontCategory] ? FONT_CATEGORY_MAP[value.aiSuggestedFontCategory] : defaultFontFamily,
                    fontColor: DEFAULT_FONT_COLOR,
                };
                if (effectiveMediaType === 'image') {
                    valueWithDefaults.imageSourceType = 'generate';
                }
                acc[key] = valueWithDefaults;
                return acc;
            }, {} as PlatformContentMap);

            if (forSpecificPlatformKey) {
                setPlatformContents(prev => ({...prev, ...processedData}));
            } else {
                setPlatformContents(processedData);
            }
        } else {
            throw new Error(result.error || "AI failed to generate content. The response was empty.");
        }
    } catch (e) {
        setError((e as Error).message);
        showToast((e as Error).message, 'error');
    } finally {
        if(forSpecificPlatformKey) { setIsRegeneratingPlatform(prev => ({ ...prev, [forSpecificPlatformKey]: false })); } 
        else { setIsLoading(false); }
    }
  }, [selectedPersonaId, selectedOperatorId, personas, operators, selectedPlatformsForGeneration, getEffectiveMediaType, keyMessage, selectedTone, customPrompt, defaultFontFamily, currentUser, showToast]);
  
  const handleFieldChange = useCallback((platformKey: string, field: keyof PlatformContentDetail, value: any) => {
    setPlatformContents(prev => {
        if (!prev[platformKey]) return prev;
        return {
            ...prev,
            [platformKey]: {
                ...prev[platformKey],
                [field]: value
            }
        };
    });
  }, []);
  
  const handleHashtagsChange = useCallback((platformKey: string, newHashtagsString: string) => {
    const hashtags = newHashtagsString.split(',').map(h => h.trim());
    handleFieldChange(platformKey, 'hashtags', hashtags);
  }, [handleFieldChange]);
  
  const handleImageSourceTypeChange = useCallback((platformKey: string, sourceType: ImageSourceType) => {
    handleFieldChange(platformKey, 'imageSourceType', sourceType);
  }, [handleFieldChange]);

  const handleCustomImageUpload = useCallback((platformKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        showToast(`Unsupported file type: ${file.type}. Please upload images (JPEG, PNG, GIF, WEBP).`, 'error');
        return;
      }
      if (file.size > MAX_FILE_UPLOAD_SIZE_BYTES) {
        showToast(`File is too large (${(file.size / (1024*1024)).toFixed(2)}MB). Maximum size is ${MAX_FILE_UPLOAD_SIZE_MB}MB.`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleFieldChange(platformKey, 'uploadedImageBase64', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [showToast, handleFieldChange]);
  
  const handleProcessImage = useCallback(async (platformKey: string) => {
    const content = platformContents[platformKey];
    if (!content || !content.imageSourceType) return;
    
    setIsProcessingMedia(prev => ({ ...prev, [platformKey]: true }));
    let finalBase64Image: string | null = null;
    let errorMsg: string | undefined = undefined;

    if (content.imageSourceType === 'generate' && content.imagePrompt) {
      const result = await generateImages(content.imagePrompt, currentUser, 1);
      if (result.images && result.images.length > 0) {
        finalBase64Image = result.images[0];
      } else {
        errorMsg = result.error || "AI image generation failed.";
      }
    } else if (content.imageSourceType === 'upload' && content.uploadedImageBase64) {
      finalBase64Image = content.uploadedImageBase64.split(',')[1];
    }
    
    if (finalBase64Image) {
      // Create a canvas to draw the image and text
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.drawImage(img, 0, 0);

        if (content.memeText && content.memeText.trim() !== '') {
            const fontSize = Math.floor(img.width / 14);
            ctx!.font = `bold ${fontSize}px ${(content.fontFamily || DEFAULT_FONT_FAMILY).split("'").join('')}`;
            ctx!.fillStyle = content.fontColor || DEFAULT_FONT_COLOR;
            ctx!.textAlign = 'center';
            ctx!.textBaseline = 'middle';
            ctx!.strokeStyle = 'black';
            ctx!.lineWidth = fontSize / 12;

            const text = content.memeText!.toUpperCase();
            const x = canvas.width / 2;
            const y = canvas.height * 0.85; // Lower part of the image
            ctx!.strokeText(text, x, y);
            ctx!.fillText(text, x, y);
        }
        handleFieldChange(platformKey, 'processedImageUrl', canvas.toDataURL('image/png'));
        setIsProcessingMedia(prev => ({ ...prev, [platformKey]: false }));
      };
      img.onerror = () => {
          showToast("Failed to load image for processing.", 'error');
          setIsProcessingMedia(prev => ({ ...prev, [platformKey]: false }));
      };
      img.src = `data:image/jpeg;base64,${finalBase64Image}`;
    } else {
        showToast(errorMsg || "No image source available to process.", 'error');
        if (errorMsg) handleFieldChange(platformKey, 'imagePrompt', `${content.imagePrompt} (Error: ${errorMsg})`);
        setIsProcessingMedia(prev => ({ ...prev, [platformKey]: false }));
    }
  }, [platformContents, currentUser, handleFieldChange, showToast]);
  
  const handleDownloadImage = useCallback((platformKey: string) => {
    const url = platformContents[platformKey]?.processedImageUrl;
    const name = platformContents[platformKey]?.imagePrompt?.substring(0, 20) || 'processed-image';
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/ /g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [platformContents]);

  const handlePushToLibrary = useCallback(async (platformKey: string) => {
    const dataUrl = platformContents[platformKey]?.processedImageUrl;
    if (!dataUrl) { showToast("No processed image to save.", 'error'); return; }
    
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const fileName = `${platformContents[platformKey]?.imagePrompt?.substring(0,30) || 'generated-image'}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        
        await onAddContentLibraryAsset(file, fileName.replace('.png', ''), ['generated', platformKey]);
        showToast("Image saved to Content Library!", "success");
    } catch (e) {
        showToast(`Error saving to library: ${(e as Error).message}`, 'error');
    }
  }, [platformContents, onAddContentLibraryAsset, showToast]);


  const handleSaveDraft = useCallback(async () => {
    if (!selectedPersonaId || !selectedOperatorId || Object.keys(platformContents).length === 0) {
      showToast("Cannot save empty draft or draft without persona/operator and content.", "error"); return;
    }
    await onAddContentDraft({
      persona_id: selectedPersonaId, operator_id: selectedOperatorId, key_message: keyMessage,
      custom_prompt: customPrompt, platform_contents: platformContents, platform_media_overrides: platformMediaOverrides,
    });
    // Reset state
    setSelectedPersonaId(null); setSelectedOperatorId(null); setKeyMessage(''); setCustomPrompt('');
    setPlatformContents({}); setGlobalMediaType('none'); setSelectedTone('');
    setDefaultFontFamily(DEFAULT_FONT_FAMILY); setDefaultFontColor(DEFAULT_FONT_COLOR);
    setSelectedPlatformsForGeneration(initialSelectedPlatforms); setPlatformMediaOverrides(initialPlatformMediaOverrides);
  }, [
    platformContents, selectedPersonaId, selectedOperatorId, keyMessage, customPrompt, 
    platformMediaOverrides, onAddContentDraft, showToast
  ]);

  const handleConfirmSchedule = useCallback((draftId: string, platformKey: string, scheduledDateTime: string, notes: string) => {
    const draft = contentDrafts.find(d => d.id === draftId);
    if (!draft || !draft.platform_contents[platformKey]) return;

    const scheduledDate = new Date(scheduledDateTime);
    let titleContent = draft.platform_contents[platformKey].subject || draft.platform_contents[platformKey].content || 'Content';
    const title = `${platformKey}: ${titleContent.substring(0, 20)}...`;

    onAddScheduledPost({
      id: `sch_${Date.now()}`, db_id: 0, title, start: scheduledDate,
      end: new Date(scheduledDate.getTime() + 60 * 60 * 1000),
      resource: { contentDraftId: draft.id, platformKey, status: 'Scheduled', notes, personaId: draft.persona_id, operatorId: draft.operator_id }
    });
  }, [contentDrafts, onAddScheduledPost]);


  return {
    state: {
      selectedPersonaId, selectedOperatorId, keyMessage, customPrompt, globalMediaType,
      selectedTone, defaultFontFamily, defaultFontColor, selectedPlatformsForGeneration,
      platformMediaOverrides, platformContents, isLoading, isProcessingMedia,
      isRegeneratingPlatform, error, schedulingPostInfo, isAnyPlatformSelectedForGeneration
    },
    handlers: {
      setSelectedPersonaId, setSelectedOperatorId, setKeyMessage, setCustomPrompt,
      setGlobalMediaType, setSelectedTone, setDefaultFontFamily, setDefaultFontColor,
      setSelectedPlatformsForGeneration, setPlatformMediaOverrides, handleGenerateOrRegenerate,
      handleSaveDraft, setSchedulingPostInfo, handleConfirmSchedule,
      handleFieldChange, handleHashtagsChange, handleImageSourceTypeChange,
      handleCustomImageUpload, handleProcessImage, handleDownloadImage, handlePushToLibrary,
      setPlatformContents
    },
    refs: {
      imageUploadRefs
    }
  };
};
