
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ContentDraft, Persona, Operator, PlatformContentMap, PlatformContentDetail, MediaType, ScheduledPost, ImageSourceType, ContentLibraryAsset } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Input } from './ui/Input';
import { generateJson, generateImages } from '../services/aiService'; 
import { CONTENT_PLATFORMS, MEDIA_TYPE_OPTIONS, TONE_OF_VOICE_OPTIONS, MAX_FILE_UPLOAD_SIZE_BYTES, MAX_FILE_UPLOAD_SIZE_MB, ACCEPTED_IMAGE_TYPES } from '../constants';
import { format } from 'date-fns';
import { useToast } from './ui/ToastProvider';
import { CalendarDaysIcon, RefreshIcon, ArrowUpTrayIcon, PhotoIcon, ArrowDownTrayIcon, ArrowDownOnSquareIcon } from './ui/Icons';


interface ScheduleModalProps {
  draft: ContentDraft;
  platformKey: string;
  platformDetail: PlatformContentDetail;
  onClose: () => void;
  onSchedule: (postId: string, platformKey: string, scheduledDateTime: string, notes: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ draft, platformKey, platformDetail, onClose, onSchedule, showToast }) => {
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState<string>('');
  const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);

  const handleSubmit = () => {
    if (!scheduledDateTime) {
      showToast("Please select a date and time to schedule.", "error");
      return;
    }
    onSchedule(draft.id, platformKey, scheduledDateTime, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <Card title={`Schedule Post for ${platformInfo?.label}`} className="w-full max-w-md bg-card">
        <div className="mb-4">
          <h4 className="font-semibold text-textPrimary">Content Preview:</h4>
          {platformDetail.subject && <p className="text-sm font-medium text-textPrimary">Subject: {platformDetail.subject}</p>}
          <pre className="text-sm whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-32 overflow-y-auto text-textPrimary">{platformDetail.content}</pre>
           {platformDetail.processedImageUrl && (
            <img src={platformDetail.processedImageUrl} alt="Processed media" className="mt-2 max-w-xs w-full h-auto max-h-24 rounded border border-mediumBorder object-contain"/>
          )}
        </div>
        <Input
          label="Scheduled Date & Time"
          type="datetime-local"
          value={scheduledDateTime}
          onChange={e => setScheduledDateTime(e.target.value)}
          required
        />
        <Textarea
          label="Notes (Optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g., Target specific event, follow-up to previous post."
        />
        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-lightBorder">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Confirm Schedule</Button>
        </div>
      </Card>
    </div>
  );
};


interface ContentPlannerViewProps {
  contentDrafts: ContentDraft[];
  personas: Persona[];
  operators: Operator[];
  onAddContentDraft: (draft: ContentDraft) => void;
  onAddScheduledPost: (post: ScheduledPost) => void;
  onAddContentLibraryAsset: (asset: ContentLibraryAsset) => void;
}

interface AiPlatformContentSuggestion {
  content?: string; // Optional for Poster types
  hashtags?: string[]; // Optional for Poster types
  subject?: string;
  imagePrompt?: string; 
  memeText?: string;    
  videoIdea?: string;   
}
type AiPlatformContentResponse = Record<string, AiPlatformContentSuggestion>;


export const ContentPlannerView: React.FC<ContentPlannerViewProps> = ({ 
    contentDrafts, personas, operators, onAddContentDraft, onAddScheduledPost, onAddContentLibraryAsset 
}) => {
  const { showToast } = useToast();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [globalMediaType, setGlobalMediaType] = useState<MediaType>('none');
  const [selectedTone, setSelectedTone] = useState<string>('');
  
  const initialSelectedPlatforms = CONTENT_PLATFORMS.reduce((acc, p) => {
    acc[p.key] = true; 
    return acc;
  }, {} as Record<string, boolean>);
  const [selectedPlatformsForGeneration, setSelectedPlatformsForGeneration] = useState<Record<string, boolean>>(initialSelectedPlatforms);

  const [platformContents, setPlatformContents] = useState<PlatformContentMap>({});
  const [isLoading, setIsLoading] = useState(false); 
  const [isProcessingMedia, setIsProcessingMedia] = useState<Record<string, boolean>>({}); 
  const [isRegeneratingPlatform, setIsRegeneratingPlatform] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [schedulingPostInfo, setSchedulingPostInfo] = useState<{draft: ContentDraft, platformKey: string, platformDetail: PlatformContentDetail} | null>(null);
  const imageUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});


  const personaOptions = personas.map(p => ({ value: p.id, label: p.name }));
  const operatorOptions = operators.map(o => ({ value: o.id, label: `${o.name} (${o.type})` }));

  const handleSelectedPlatformChange = (platformKey: string) => {
    setSelectedPlatformsForGeneration(prev => ({
      ...prev,
      [platformKey]: !prev[platformKey],
    }));
  };

  const isAnyPlatformSelectedForGeneration = Object.values(selectedPlatformsForGeneration).some(isSelected => isSelected);


  const handleGenerateOrRegenerate = useCallback(async (
    forSpecificPlatformKey?: string 
  ) => {
    if (!selectedPersonaId || !selectedOperatorId) {
      setError("Please select a Persona and an Operator.");
      return;
    }
    const persona = personas.find(p => p.id === selectedPersonaId);
    const operator = operators.find(o => o.id === selectedOperatorId);

    if (!persona || !operator) {
      setError("Selected Persona or Operator not found.");
      return;
    }
    
    const platformsToProcess = forSpecificPlatformKey 
      ? CONTENT_PLATFORMS.filter(p => p.key === forSpecificPlatformKey)
      : CONTENT_PLATFORMS.filter(p => selectedPlatformsForGeneration[p.key]);

    if (platformsToProcess.length === 0 && !forSpecificPlatformKey) {
        setError("Please select at least one platform to generate content for.");
        return;
    }
    
    if (forSpecificPlatformKey) {
        setIsRegeneratingPlatform(prev => ({ ...prev, [forSpecificPlatformKey]: true }));
    } else {
        setIsLoading(true);
        setPlatformContents({}); 
    }
    setError(null);
    
    let globalMediaInstruction = '';
    let globalMediaRequestDescription = '';
    let exampleFieldsForSocial = '';
    const currentGlobalMediaTypeToUse = forSpecificPlatformKey ? (platformContents[forSpecificPlatformKey]?.mediaType || globalMediaType) : globalMediaType;


    if (currentGlobalMediaTypeToUse === 'image') {
        globalMediaInstruction = "For EACH selected social media platform (not Email, unless custom prompt asks for an image concept for an email), also provide an 'imagePrompt' (a detailed textual description for an image generation model, e.g., 'A futuristic cityscape at sunset with flying cars, photorealistic style') AND 'memeText' (a short, catchy text for the image). For Email and Poster platforms, these fields are handled specially or are the primary request.";
        globalMediaRequestDescription = "Image with Meme Text (if applicable to platform)";
        exampleFieldsForSocial = ', "imagePrompt": "Image description for X", "memeText": "Meme text for X"';
    } else if (currentGlobalMediaTypeToUse === 'video') {
        globalMediaInstruction = "For EACH selected social media platform (not Email, unless custom prompt asks for video concept for an email), also provide a 'videoIdea' (a short script, storyboard concept, or detailed description for a short video). For Email and Poster platforms, these fields are handled specially or are not applicable.";
        globalMediaRequestDescription = "Video Idea/Script (if applicable to platform)";
        exampleFieldsForSocial = ', "videoIdea": "Video concept for X"';
    } else { 
        globalMediaInstruction = "For EACH selected platform, provide only text content and hashtags (or subject and content for Email). Do NOT provide imagePrompt, memeText, or videoIdea unless custom prompt specifically asks for it for a given platform, or if the platform is a Poster type (which only needs imagePrompt and memeText).";
        globalMediaRequestDescription = "Text Only (or Subject & Body for Email)";
    }

    const platformGuidelineInstructions = platformsToProcess.map(p => {
        let platformSpecificMediaInstruction = "";
        const platformMediaType = p.isPoster ? 'image' : (forSpecificPlatformKey && platformContents[p.key] ? platformContents[p.key]?.mediaType : currentGlobalMediaTypeToUse);

        if (p.isPoster) {
             platformSpecificMediaInstruction = `
It MUST include 'imagePrompt' and 'memeText'.
The 'imagePrompt' should describe ONLY the visual elements, background, composition, and style of a ${p.label.toLowerCase()} image. Crucially, this imagePrompt MUST NOT include any text, words, or letters to be rendered within the image by the image generator. All text for the poster will come from the 'memeText' field and will be added later by a separate process.
The 'memeText' must be short, catchy, clear, grammatically correct English (or the campaign's target language if specified), and suitable for a poster. Avoid any gibberish, misspellings, or nonsensical phrases in the memeText.
No 'content' or 'hashtags' fields are needed for Poster types.`;
        } else if (p.key === 'Email') {
            platformSpecificMediaInstruction = "It MUST include 'subject' and 'content' (for the email body). It should generally not include hashtags.";
        } else if (platformMediaType === 'image') {
             platformSpecificMediaInstruction = `It MUST include 'content' and 'hashtags', and 'imagePrompt', 'memeText'. The 'imagePrompt' should describe visual elements only and not contain text to be rendered by the image model. The 'memeText' should be clear and correct.`;
        } else if (platformMediaType === 'video') {
            platformSpecificMediaInstruction = `It MUST include 'content' and 'hashtags', and 'videoIdea'.`;
        } else { // text only
            platformSpecificMediaInstruction = `It MUST include 'content' and 'hashtags'.`;
        }
      return `- ${p.label} (${p.key}): ${p.styleGuideline} ${platformSpecificMediaInstruction}`;
    }).join("\n      ");
    
    const emailExample = platformsToProcess.some(p => p.key === 'Email') ? `"Email": { "subject": "Compelling Email Subject", "content": "Full email body content here..." }` : '';
    const firstSocialPlatform = platformsToProcess.find(p => p.key !== 'Email' && !p.isPoster);
    const socialExample = firstSocialPlatform ? `"${firstSocialPlatform.key}": { "content": "Post text for ${firstSocialPlatform.key}", "hashtags": ["#tag${firstSocialPlatform.key}"]${exampleFieldsForSocial} }` : '';
    const firstPosterPlatform = platformsToProcess.find(p => p.isPoster);
    const posterExample = firstPosterPlatform ? `"${firstPosterPlatform.key}": { "imagePrompt": "Purely visual description for ${firstPosterPlatform.label}, no text elements.", "memeText": "Short, clear, catchy meme text" }` : '';
    
    const exampleStructureParts = [socialExample, emailExample, posterExample].filter(Boolean).join(",\n        ");

    const systemInstruction = `You are a master propagandist and psychological operations content creator. Your goal is to be subtle yet effective, tailoring messages, media concepts, email subjects, and email bodies for different platforms based on a global media request and platform-specific needs. 
For 'Poster' platforms: 
  - The 'imagePrompt' MUST describe visual elements ONLY (background, subject, style, colors, composition). It MUST NOT contain any words, letters, or instructions for the image generator to render text. All text is added later from 'memeText'.
  - The 'memeText' MUST be short, catchy, clear, grammatically correct English (or target language if specified), and suitable for a poster. Avoid gibberish, misspellings, or nonsensical phrases.
  - Do NOT generate 'content' or 'hashtags' fields for Poster types.
For all platforms, ensure 'imagePrompt' (if requested) describes visuals only, without text to be rendered by the image model.
Ensure you return valid JSON for all requested platforms and all required fields for each platform. Adhere strictly to the requested JSON format and field names.
All text, especially 'memeText', must be clear, legible, and make sense. Avoid gibberish or nonsensical phrases for memeText fields.`;

    const prompt = `
      Persona: ${persona.name} (Demographics: ${persona.demographics}, Psychographics: ${persona.psychographics}, Beliefs: ${persona.initialBeliefs}, Vulnerabilities: ${persona.vulnerabilities?.join(', ') || 'N/A'})
      Operator: ${operator.name} (Type: ${operator.type})
      Conditioned Stimulus (CS): ${operator.conditionedStimulus}
      Unconditioned Stimulus (US): ${operator.unconditionedStimulus}
      Desired Conditioned Response (CR): ${operator.desiredConditionedResponse}
      Desired Tone of Voice: ${selectedTone || "Default/Neutral"}
      
      Additional Instructions from User: ${customPrompt || "None"}
      Global Media Request for applicable non-Poster platforms: ${globalMediaRequestDescription}
      Platform Specific Style Guidelines & Requirements (generate content for each of these SELECTED platforms):
      ${platformGuidelineInstructions}
      ${globalMediaInstruction}
      Return your response as a single JSON object. The keys of this object should be the platform keys for the platforms listed above (e.g., "X", "Facebook", "Email", "Poster11").
      Each value should be an object containing ONLY the fields as specified in the guidelines above for that platform.
      Do not include any other text or fields outside of the specified JSON structure for each platform. Stick strictly to the defined fields and their values.
      Example structure: { 
        ${exampleStructureParts} 
      }
    `;
    
    const result = await generateJson<AiPlatformContentResponse>(prompt, systemInstruction);
    
    if (forSpecificPlatformKey) {
        setIsRegeneratingPlatform(prev => ({ ...prev, [forSpecificPlatformKey]: false }));
    } else {
        setIsLoading(false);
    }

    if (result.data) {
        const updatedContents: PlatformContentMap = forSpecificPlatformKey ? { ...platformContents } : {};
        platformsToProcess.forEach(platform => {
            const suggestion = result.data?.[platform.key];
            const platformMediaType = platform.isPoster ? 'image' : (forSpecificPlatformKey && platformContents[platform.key] ? platformContents[platform.key]?.mediaType : currentGlobalMediaTypeToUse);
            const platformImageSourceType = platform.isPoster || platformMediaType === 'image' ? 'generate' : undefined;

            if (suggestion) {
                updatedContents[platform.key] = {
                    content: platform.isPoster ? '' : (suggestion.content || (platform.key === 'Email' ? 'AI did not provide email body.' : `AI did not provide content for ${platform.label}.`)),
                    subject: platform.key === 'Email' ? (suggestion.subject || 'AI did not provide subject.') : undefined,
                    hashtags: platform.isPoster ? [] : (suggestion.hashtags || []),
                    mediaType: platformMediaType, 
                    imageSourceType: platformImageSourceType,
                    imagePrompt: (platform.key !== 'Email' && platformMediaType === 'image') ? suggestion.imagePrompt : undefined,
                    memeText: (platform.key !== 'Email' && platformMediaType === 'image') ? suggestion.memeText : undefined,
                    videoIdea: (platform.key !== 'Email' && platformMediaType === 'video' && !platform.isPoster) ? suggestion.videoIdea : undefined,
                    uploadedImageBase64: (forSpecificPlatformKey && platformContents[platform.key]?.imageSourceType === 'upload') 
                                        ? platformContents[platform.key]?.uploadedImageBase64
                                        : undefined,
                    processedImageUrl: (forSpecificPlatformKey && platformContents[platform.key]?.processedImageUrl && suggestion.imagePrompt === platformContents[platform.key]?.imagePrompt) 
                                       ? platformContents[platform.key]?.processedImageUrl 
                                       : undefined,
                };
            } else { // AI didn't provide any suggestion for this platform key
                 updatedContents[platform.key] = { 
                     content: platform.isPoster ? '' : `AI did not provide content for ${platform.label}.`, 
                     hashtags: platform.isPoster ? [] : [], 
                     mediaType: platformMediaType, 
                     subject: platform.key === 'Email' ? 'AI did not provide subject.' : undefined,
                     imageSourceType: platformImageSourceType,
                     imagePrompt: (platform.key !== 'Email' && platformMediaType === 'image') ? `Failed to get image prompt for ${platform.label}` : undefined,
                    };
            }
        });
        setPlatformContents(updatedContents);
    } else {
        setError(result.error || "Failed to generate content. AI might not have returned data or provider not fully implemented.");
    }
  }, [selectedPersonaId, selectedOperatorId, customPrompt, personas, operators, globalMediaType, platformContents, selectedTone, selectedPlatformsForGeneration]);


  const handleProcessImageForPlatform = useCallback(async (platformKey: string) => {
    const currentPlatformDetail = platformContents[platformKey];
    const platformConfig = CONTENT_PLATFORMS.find(p => p.key === platformKey);

    if (!currentPlatformDetail || currentPlatformDetail.mediaType !== 'image' || !platformConfig) {
        showToast("Cannot process image: Not an image type, details missing, or platform config not found.", "error");
        return;
    }

    const { imageSourceType, imagePrompt, uploadedImageBase64, memeText } = currentPlatformDetail;
    let sourceImageUrl = ''; 

    setIsProcessingMedia(prev => ({ ...prev, [platformKey]: true }));
    setError(null);

    try {
        if (imageSourceType === 'generate') {
            if (!imagePrompt || imagePrompt.startsWith('Image gen failed') || imagePrompt.startsWith('Failed to get image prompt')) {
                showToast("No valid image prompt available for AI generation.", "error");
                setIsProcessingMedia(prev => ({ ...prev, [platformKey]: false }));
                return;
            }
            const imageResult = await generateImages(imagePrompt, 1);
            if (imageResult.images && imageResult.images[0]) {
                sourceImageUrl = `data:image/jpeg;base64,${imageResult.images[0]}`;
            } else {
                const errorMsg = `AI Image generation failed: ${imageResult.error || 'Unknown error'}`;
                setPlatformContents(prev => ({...prev, [platformKey]: {...prev[platformKey]!, imagePrompt: `${imagePrompt} (Error: ${errorMsg})`, processedImageUrl: undefined }}));
                showToast(errorMsg, "error");
                setIsProcessingMedia(prev => ({ ...prev, [platformKey]: false }));
                return;
            }
        } else if (imageSourceType === 'upload') {
            if (!uploadedImageBase64) {
                showToast("No uploaded image found to process.", "error");
                setIsProcessingMedia(prev => ({ ...prev, [platformKey]: false }));
                return;
            }
            sourceImageUrl = uploadedImageBase64;
        } else {
            showToast("Invalid image source type.", "error");
            setIsProcessingMedia(prev => ({ ...prev, [platformKey]: false }));
            return;
        }

        const image = new Image();
        image.onload = () => {
            const finalCanvas = document.createElement('canvas');
            const finalCtx = finalCanvas.getContext('2d');

            if (!finalCtx) {
                showToast("Failed to get canvas context for image processing.", "error");
                setIsProcessingMedia(prev => ({ ...prev, [platformKey]: false }));
                setPlatformContents(prev => ({...prev, [platformKey]: {...prev[platformKey]!, processedImageUrl: sourceImageUrl }}));
                return;
            }
            
            let canvasWidth = image.width;
            let canvasHeight = image.height;

            if (platformConfig.isPoster && platformConfig.targetWidth && platformConfig.targetHeight) {
                canvasWidth = platformConfig.targetWidth;
                canvasHeight = platformConfig.targetHeight;
                finalCanvas.width = canvasWidth;
                finalCanvas.height = canvasHeight;

                const imgAspectRatio = image.width / image.height;
                const canvasAspectRatio = canvasWidth / canvasHeight;
                let drawWidth, drawHeight, offsetX, offsetY;

                if (imgAspectRatio > canvasAspectRatio) { // Image is wider than canvas ratio
                    drawHeight = canvasHeight;
                    drawWidth = imgAspectRatio * drawHeight;
                    offsetX = (canvasWidth - drawWidth) / 2;
                    offsetY = 0;
                } else { // Image is taller or same ratio
                    drawWidth = canvasWidth;
                    drawHeight = drawWidth / imgAspectRatio;
                    offsetX = 0;
                    offsetY = (canvasHeight - drawHeight) / 2;
                }
                finalCtx.fillStyle = 'black'; // Background for letter/pillar-boxing if image is smaller
                finalCtx.fillRect(0,0, canvasWidth, canvasHeight);
                finalCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

            } else {
                finalCanvas.width = canvasWidth;
                finalCanvas.height = canvasHeight;
                finalCtx.drawImage(image, 0, 0);
            }


            if (memeText && memeText.trim() !== "") {
                const baseFontSize = Math.max(16, Math.min(60, Math.floor(canvasHeight * 0.08)));
                finalCtx.font = `bold ${baseFontSize}px Arial, sans-serif`;
                finalCtx.textAlign = 'center';
                finalCtx.textBaseline = 'bottom'; 
                finalCtx.fillStyle = 'white';
                finalCtx.strokeStyle = 'black';
                finalCtx.lineWidth = Math.max(1, Math.floor(baseFontSize / 10)); 
                const x = canvasWidth / 2;
                const maxWidth = canvasWidth * 0.90;
                const lineHeight = baseFontSize * 1.15; 
                const bottomPadding = baseFontSize * 0.5;

                const getWrappedLines = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
                    const words = text.split(' ');
                    const lines: string[] = [];
                    let currentLine = '';
                    if (words.length === 0) return [];
                    for (let i = 0; i < words.length; i++) {
                        const word = words[i];
                        const testLine = currentLine ? currentLine + ' ' + word : word;
                        if (context.measureText(testLine).width > maxWidth && i > 0 && currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else { currentLine = testLine; }
                    }
                    if (currentLine) { lines.push(currentLine); }
                    return lines;
                };
                
                const lines = getWrappedLines(finalCtx, memeText, maxWidth);
                const totalLines = lines.length;
                if (totalLines > 0) {
                    const yOfLastLine = canvasHeight - bottomPadding;
                    const yOfFirstLine = yOfLastLine - ((totalLines - 1) * lineHeight);
                    for (let i = 0; i < totalLines; i++) {
                        const line = lines[i];
                        const currentY = yOfFirstLine + (i * lineHeight);
                        finalCtx.strokeText(line, x, currentY);
                        finalCtx.fillText(line, x, currentY);
                    }
                }
            }
            
            const finalProcessedImageUrl = finalCanvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller size
            setPlatformContents(prev => ({...prev, [platformKey]: {...prev[platformKey]!, processedImageUrl: finalProcessedImageUrl }}));
            showToast("Image processed successfully!", "success");
        };
        image.onerror = () => {
            showToast("Failed to load source image for processing.", "error");
            setPlatformContents(prev => ({...prev, [platformKey]: {...prev[platformKey]!, processedImageUrl: sourceImageUrl }}));
        };
        image.src = sourceImageUrl;

    } catch (err) {
        const errorMsg = `Image processing error: ${(err as Error).message}`;
        setPlatformContents(prev => ({...prev, [platformKey]: {...prev[platformKey]!, imagePrompt: imageSourceType === 'generate' ? `${currentPlatformDetail.imagePrompt} (Error: ${errorMsg})` : undefined, processedImageUrl: undefined}}));
        showToast(errorMsg, "error");
    } finally {
        setIsProcessingMedia(prev => ({ ...prev, [platformKey]: false }));
    }
  }, [platformContents, showToast]);

  const handleImageSourceTypeChange = (platformKey: string, newSourceType: ImageSourceType) => {
    const platformConfig = CONTENT_PLATFORMS.find(p => p.key === platformKey);
    const mediaType = platformConfig?.isPoster ? 'image' : globalMediaType;

    setPlatformContents(prev => ({
        ...prev,
        [platformKey]: {
            ...(prev[platformKey] || { content: '', hashtags: [], mediaType: mediaType}),
            imageSourceType: newSourceType,
            imagePrompt: newSourceType === 'generate' ? prev[platformKey]?.imagePrompt || '' : undefined,
            uploadedImageBase64: newSourceType === 'upload' ? prev[platformKey]?.uploadedImageBase64 : undefined,
            processedImageUrl: undefined, 
        }
    }));
    if (newSourceType !== 'upload' && imageUploadRefs.current[platformKey]) {
        imageUploadRefs.current[platformKey]!.value = '';
    }
};

const handleCustomImageUpload = (platformKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            showToast(`Unsupported image type: ${file.type}. Please upload JPEG, PNG, GIF, or WEBP.`, "error");
            return;
        }
        if (file.size > MAX_FILE_UPLOAD_SIZE_BYTES) {
            showToast(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is ${MAX_FILE_UPLOAD_SIZE_MB}MB.`, 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setPlatformContents(prev => ({
                ...prev,
                [platformKey]: {
                    ...(prev[platformKey]!),
                    uploadedImageBase64: reader.result as string,
                    processedImageUrl: undefined, 
                    imageSourceType: 'upload', 
                }
            }));
        };
        reader.onerror = () => showToast("Failed to read uploaded image.", "error");
        reader.readAsDataURL(file);
    }
};

const handleDownloadImage = (platformKey: string) => {
    const platformData = platformContents[platformKey];
    const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
    if (platformData?.processedImageUrl && platformInfo) {
        const link = document.createElement('a');
        link.href = platformData.processedImageUrl;
        const namePart = platformData.memeText || platformData.imagePrompt?.substring(0,20) || 'image';
        link.download = `${platformInfo.label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${namePart.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Image download started.", "success");
    } else {
        showToast("No processed image available to download.", "error");
    }
};

const handlePushToLibrary = (platformKey: string) => {
    const platformData = platformContents[platformKey];
    const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
    if (platformData?.processedImageUrl && platformInfo) {
        const base64Data = platformData.processedImageUrl;
        let assetName = platformData.memeText || platformData.imagePrompt?.substring(0, 30) || `${platformInfo.label} Image`;
        if (assetName.length > 50) assetName = assetName.substring(0, 50) + "...";
        
        // Calculate size from base64
        let size = 0;
        if (base64Data.includes(',')) {
            try {
                size = atob(base64Data.split(',')[1]).length;
            } catch (e) { console.error("Error decoding base64 for size calculation", e); }
        }

        const newAsset: ContentLibraryAsset = {
            id: Date.now().toString() + Math.random().toString(36).substring(2,9),
            name: assetName.trim(),
            type: 'image',
            dataUrl: base64Data,
            fileName: `${assetName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`,
            fileType: 'image/jpeg', // Since we convert to JPEG in processing
            size: size,
            uploadedAt: new Date().toISOString(),
        };
        onAddContentLibraryAsset(newAsset);
        // Toast for this is handled by onAddContentLibraryAsset in App.tsx
    } else {
        showToast("No processed image available to push to library.", "error");
    }
};


  const handleSaveDraft = () => {
    if (Object.keys(platformContents).length === 0 || !selectedPersonaId || !selectedOperatorId) {
      setError("Cannot save empty draft or draft without persona/operator and generated content.");
      return;
    }
    const newDraft: ContentDraft = {
      id: Date.now().toString(),
      personaId: selectedPersonaId,
      operatorId: selectedOperatorId,
      customPrompt: customPrompt,
      platformContents: platformContents,
    };
    onAddContentDraft(newDraft);
    setSelectedPersonaId('');
    setSelectedOperatorId('');
    setCustomPrompt('');
    setPlatformContents({});
    setGlobalMediaType('none');
    setSelectedTone('');
    setSelectedPlatformsForGeneration(initialSelectedPlatforms); 
    showToast("Draft saved successfully!", "success");
  };

  const handlePlatformFieldChange = (platformKey: string, field: keyof PlatformContentDetail, value: string) => {
    setPlatformContents(prev => {
        const platformConfig = CONTENT_PLATFORMS.find(p => p.key === platformKey);
        const mediaType = platformConfig?.isPoster ? 'image' : (prev[platformKey]?.mediaType || globalMediaType);
        const currentPlatform = prev[platformKey] || { hashtags: [], mediaType: mediaType, content: '', subject: platformKey === 'Email' ? '' : undefined };
        return { ...prev, [platformKey]: { ...currentPlatform, [field]: value } };
    });
  };
  
   const handlePlatformHashtagsChange = (platformKey: string, newHashtagsString: string) => {
    setPlatformContents(prev => {
        const platformConfig = CONTENT_PLATFORMS.find(p => p.key === platformKey);
        const mediaType = platformConfig?.isPoster ? 'image' : (prev[platformKey]?.mediaType || globalMediaType);
        return { ...prev, [platformKey]: { ...(prev[platformKey] || { content: '', mediaType: mediaType, hashtags: [] }), hashtags: newHashtagsString.split(',').map(h => h.trim()).filter(h => h.startsWith('#')) } };
    });
  };

  const handleOpenScheduleModal = (draft: ContentDraft, platformKey: string, platformDetail: PlatformContentDetail) => {
    setSchedulingPostInfo({ draft, platformKey, platformDetail });
  };

  const handleConfirmSchedule = (draftId: string, platformKey: string, scheduledDateTime: string, notes: string) => {
    const draft = contentDrafts.find(d => d.id === draftId);
    const platformDetail = draft?.platformContents[platformKey];
    const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
    
    if (!draft || !platformDetail || !platformInfo) {
      showToast("Error: Could not find draft or platform details to schedule.", "error");
      return;
    }

    const scheduledDate = new Date(scheduledDateTime);
    let titleContent = platformDetail.content || '';
    if (platformInfo.isPoster) titleContent = platformDetail.imagePrompt || 'Poster Image';
    const title = `${typeof platformInfo.icon === 'string' ? platformInfo.icon : ''} ${platformInfo.label}: ${platformDetail.subject || titleContent.substring(0, 20)}...`;


    const newScheduledPost: ScheduledPost = {
      id: `sch_${Date.now()}_${draft.id}_${platformKey}`,
      title: title,
      start: scheduledDate,
      end: new Date(scheduledDate.getTime() + 60 * 60 * 1000), 
      allDay: false, 
      resource: { contentDraftId: draft.id, platformKey: platformKey, status: 'Scheduled', notes: notes, personaId: draft.personaId, operatorId: draft.operatorId }
    };
    onAddScheduledPost(newScheduledPost);
    showToast(`Post for ${platformInfo.label} scheduled!`, "success");
  };

  if (personas.length === 0 || operators.length === 0) {
    return (
      <div className="p-6">
        <Card className="text-center">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">Content Planner</h2>
            <p className="text-textSecondary text-lg">Please create at least one Persona and one Operator before planning content.</p>
        </Card>
      </div>
    );
  }
  
  const getPlatformIconDisplay = (icon: string | React.ReactNode | undefined) => {
    if (typeof icon === 'string') return <span className="mr-1.5 text-lg">{icon}</span>;
    if (React.isValidElement(icon)) return <span className="mr-1.5">{React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4 inline-block" })}</span>;
    return null;
  };


  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Multi-Platform Content Planner</h2>
      {error && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4" shadow="soft-md"><p>{error}</p></Card>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Configuration" className="md:col-span-1">
          <Select label="Target Persona" options={personaOptions} value={selectedPersonaId} onChange={e => setSelectedPersonaId(e.target.value)} required />
          <Select label="Campaign Operator" options={operatorOptions} value={selectedOperatorId} onChange={e => setSelectedOperatorId(e.target.value)} required />
          <Select label="Global Media Type (non-Email/Poster)" options={MEDIA_TYPE_OPTIONS} value={globalMediaType} onChange={e => setGlobalMediaType(e.target.value as MediaType)} containerClassName="mt-4" required />
          <Select label="Desired Tone of Voice" options={TONE_OF_VOICE_OPTIONS} value={selectedTone} onChange={e => setSelectedTone(e.target.value)} containerClassName="mt-4" required />
          <Textarea label="Custom Prompt / Additional Instructions (Optional)" value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="e.g., Make it sound urgent..." rows={3} containerClassName="mt-4" />
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-textSecondary mb-2">Select Platforms for Generation:</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {CONTENT_PLATFORMS.map(platform => (
                <div key={platform.key} className="flex items-center">
                  <input
                    id={`platform-checkbox-${platform.key}`}
                    type="checkbox"
                    checked={selectedPlatformsForGeneration[platform.key] || false}
                    onChange={() => handleSelectedPlatformChange(platform.key)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-2"
                  />
                  <label htmlFor={`platform-checkbox-${platform.key}`} className="text-sm text-textPrimary flex items-center">
                    {getPlatformIconDisplay(platform.icon)} {platform.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={() => handleGenerateOrRegenerate()} isLoading={isLoading} className="w-full mt-6" disabled={!selectedPersonaId || !selectedOperatorId || isLoading || !isAnyPlatformSelectedForGeneration}>
            {isLoading ? 'Generating Suggestions...' : 'Generate All Platform Content'}
          </Button>
        </Card>
        <div className="md:col-span-2 space-y-6">
            {(isLoading && Object.keys(platformContents).length === 0) && <LoadingSpinner text="AI is drafting content and media ideas..." />}
            {!isLoading && Object.keys(platformContents).length === 0 && !error && ( <Card><p className="text-textSecondary text-center py-4">Configure and click "Generate" to see content previews here.</p></Card> )}
            
            {CONTENT_PLATFORMS.filter(p => selectedPlatformsForGeneration[p.key] || platformContents[p.key]).map(platform => {
                 const currentPlatformData = platformContents[platform.key];
                 const platformIsLoading = isLoading && !currentPlatformData && selectedPlatformsForGeneration[platform.key]; 
                 const platformCharacterLimit = platform.characterLimit;

                 if (!platformIsLoading && !currentPlatformData && !isRegeneratingPlatform[platform.key] && !isProcessingMedia[platform.key]) return null;
                 
                 return (
                    <Card key={platform.key} title={`${getPlatformIconDisplay(platform.icon) || ''} ${platform.label} Post`} className="relative">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleGenerateOrRegenerate(platform.key)} 
                            isLoading={isRegeneratingPlatform[platform.key]} 
                            className="absolute top-4 right-4 text-xs"
                            title={`Regenerate for ${platform.label}`}
                            leftIcon={<RefreshIcon className="w-3.5 h-3.5"/>}
                        >
                           {!isRegeneratingPlatform[platform.key] && (platform.isPoster ? "Regen Image Prompt & Meme Text" : "Regen Content")}
                        </Button>

                        {(platformIsLoading || isRegeneratingPlatform[platform.key]) && <LoadingSpinner size="sm" text={`Generating for ${platform.label}...`} />}
                        
                        {currentPlatformData && !isRegeneratingPlatform[platform.key] && (
                            <>
                                {platform.key === 'Email' && (<Input label="Subject" value={currentPlatformData.subject || ''} onChange={e => handlePlatformFieldChange(platform.key, 'subject', e.target.value)} className="font-medium" aria-label={`Subject for ${platform.label}`}/> )}
                                
                                {!platform.isPoster && platform.key !== 'Email' && (
                                  <Textarea 
                                      label={'Generated Post Text'} 
                                      value={currentPlatformData.content || ''} 
                                      onChange={e => handlePlatformFieldChange(platform.key, 'content', e.target.value as string)} 
                                      rows={platform.key === 'X' ? 3 : 5} 
                                      className="font-mono text-sm" 
                                      aria-label={`Content for ${platform.label}`} 
                                  />
                                )}
                                {platform.key === 'Email' && (
                                   <Textarea 
                                      label={'Email Body'} 
                                      value={currentPlatformData.content || ''} 
                                      onChange={e => handlePlatformFieldChange(platform.key, 'content', e.target.value as string)} 
                                      rows={7} 
                                      className="font-mono text-sm" 
                                      aria-label={`Content for ${platform.label}`} 
                                  />
                                )}

                                {platformCharacterLimit && !platform.isPoster && (
                                    <p className={`text-xs mt-1 text-right ${ (currentPlatformData.content?.length || 0) > platformCharacterLimit ? 'text-danger' : 'text-textSecondary'}`}>
                                        {(currentPlatformData.content?.length || 0)} / {platformCharacterLimit}
                                    </p>
                                )}

                                {!platform.isPoster && platform.key !== 'Email' && ( <div className="mt-3"><Input label="Hashtags (comma-separated, start with #)" value={currentPlatformData.hashtags?.join(', ') || ''} onChange={e => handlePlatformHashtagsChange(platform.key, e.target.value)} placeholder="#hashtag1, #hashtag2" aria-label={`Hashtags for ${platform.label}`}/></div> )}
                                
                                {( (platform.key !== 'Email' && currentPlatformData.mediaType === 'image') || platform.isPoster ) && (
                                    <div className="mt-4 p-3 border-t border-lightBorder">
                                        <h5 className="text-sm font-semibold text-textPrimary mb-2">{platform.isPoster ? 'Image Generation' : 'Image & Meme Customization'}</h5>
                                        {!platform.isPoster && (
                                          <div className="mb-3">
                                              <label className="block text-xs font-medium text-textSecondary mb-1">Image Source:</label>
                                              <div className="flex space-x-4">
                                                  {(['generate', 'upload'] as ImageSourceType[]).map(srcType => (
                                                      <label key={srcType} className="flex items-center space-x-1 cursor-pointer">
                                                          <input 
                                                              type="radio" 
                                                              name={`imageSource-${platform.key}`} 
                                                              value={srcType} 
                                                              checked={currentPlatformData.imageSourceType === srcType} 
                                                              onChange={() => handleImageSourceTypeChange(platform.key, srcType)}
                                                              className="form-radio h-4 w-4 text-primary focus:ring-primary"
                                                          />
                                                          <span className="text-sm capitalize">{srcType}</span>
                                                      </label>
                                                  ))}
                                              </div>
                                          </div>
                                        )}

                                        {currentPlatformData.imageSourceType === 'generate' && (
                                            <Input 
                                                label="AI Image Prompt (Editable)" 
                                                value={currentPlatformData.imagePrompt || ''} 
                                                onChange={e => handlePlatformFieldChange(platform.key, 'imagePrompt', e.target.value)} 
                                                placeholder={platform.isPoster ? `e.g., A detailed ${platform.label.toLowerCase()} image...` : "Enter or edit AI image prompt here"}
                                                disabled={isProcessingMedia[platform.key]}
                                                containerClassName="mb-2"
                                            />
                                        )}
                                        {currentPlatformData.imageSourceType === 'upload' && (
                                            <div className="mb-2">
                                                <label htmlFor={`imageUpload-${platform.key}`} className="block text-xs font-medium text-textSecondary mb-1">
                                                    Upload Custom Image (Max {MAX_FILE_UPLOAD_SIZE_MB}MB)
                                                </label>
                                                <input
                                                  id={`imageUpload-${platform.key}`}
                                                  ref={el => { imageUploadRefs.current[platform.key] = el; }}
                                                  type="file"
                                                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                                  onChange={(e) => handleCustomImageUpload(platform.key, e)}
                                                  className="block w-full text-sm text-textSecondary file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-white hover:file:bg-gray-700 cursor-pointer"
                                                  disabled={isProcessingMedia[platform.key]}
                                                />
                                                {currentPlatformData.uploadedImageBase64 && !isProcessingMedia[platform.key] && (
                                                   <img src={currentPlatformData.uploadedImageBase64} alt="Uploaded preview" className="mt-2 max-w-[150px] max-h-24 rounded border border-mediumBorder object-contain" />
                                                )}
                                            </div>
                                        )}
                                        
                                        <Input 
                                            label="Meme Text (will be drawn on image)" 
                                            value={currentPlatformData.memeText || ''} 
                                            onChange={e => handlePlatformFieldChange(platform.key, 'memeText', e.target.value)} 
                                            placeholder="Enter meme text here" 
                                            aria-label={`Meme text for ${platform.label}`} 
                                            containerClassName="mb-2"
                                        />
                                        <Button 
                                            variant="secondary" size="sm" 
                                            onClick={() => handleProcessImageForPlatform(platform.key)} 
                                            isLoading={isProcessingMedia[platform.key]} 
                                            disabled={
                                                isProcessingMedia[platform.key] ||
                                                (currentPlatformData.imageSourceType === 'generate' && !currentPlatformData.imagePrompt) ||
                                                (currentPlatformData.imageSourceType === 'upload' && !currentPlatformData.uploadedImageBase64)
                                            }
                                            className="mt-2 text-xs"
                                            leftIcon={<PhotoIcon className="w-4 h-4" />}
                                        >
                                            {platform.isPoster ? 'Generate & Apply Meme' : 'Apply Meme & Process Image'}
                                        </Button>

                                        {isProcessingMedia[platform.key] && !currentPlatformData.processedImageUrl && <LoadingSpinner size="sm" text="Processing image..." className="my-2"/>}
                                        
                                        {!isProcessingMedia[platform.key] && currentPlatformData.processedImageUrl && (
                                          <div className="mt-3 text-center">
                                            <img src={currentPlatformData.processedImageUrl} alt={`Processed ${platform.label} image`} className="max-w-full w-auto h-auto max-h-60 rounded my-2 border border-mediumBorder object-contain inline-block" />
                                            <div className="flex justify-center space-x-2 mt-2">
                                                <Button size="sm" variant="ghost" onClick={() => handleDownloadImage(platform.key)} leftIcon={<ArrowDownTrayIcon className="w-3.5 h-3.5"/>}>Download</Button>
                                                <Button size="sm" variant="ghost" onClick={() => handlePushToLibrary(platform.key)} leftIcon={<ArrowDownOnSquareIcon className="w-3.5 h-3.5"/>}>Save to Library</Button>
                                            </div>
                                          </div>
                                        )}
                                        {!isProcessingMedia[platform.key] && !currentPlatformData.processedImageUrl && currentPlatformData.imageSourceType === 'generate' && currentPlatformData.imagePrompt?.includes('(Error:') && ( <p className="text-xs text-danger my-2">{currentPlatformData.imagePrompt}</p> )}
                                        
                                    </div>
                                )}
                                {platform.key !== 'Email' && !platform.isPoster && currentPlatformData.mediaType === 'video' && currentPlatformData.videoIdea && (
                                    <div className="mt-4 p-3 border-t border-lightBorder">
                                        <h5 className="text-sm font-semibold text-textPrimary mb-1">Video Idea/Script (AI Suggested)</h5>
                                        <Textarea value={currentPlatformData.videoIdea} readOnly rows={4} className="bg-gray-50 text-sm" aria-label={`Video idea for ${platform.label}`} />
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                 );             
            })}
             {Object.keys(platformContents).some(key => platformContents[key] && (platformContents[key].content || platformContents[key].processedImageUrl || platformContents[key].videoIdea || platformContents[key].subject || platformContents[key].imagePrompt)) && !isLoading && !Object.values(isRegeneratingPlatform).some(v => v) && ( <Button variant="primary" onClick={handleSaveDraft} className="mt-4 w-full md:w-auto">Save All Platform Drafts</Button> )}
        </div>
      </div>
      <Card title="Saved Content Drafts" className="mt-8">
        {contentDrafts.length === 0 ? (<p className="text-textSecondary">No content drafts saved yet.</p>) : (
          <div className="space-y-6">
            {contentDrafts.map(draft => {
              const persona = personas.find(p => p.id === draft.personaId);
              const operator = operators.find(o => o.id === draft.operatorId);
              return (
                <Card key={draft.id} className="bg-gray-50 p-4" shadow="soft-md">
                  <h4 className="font-semibold text-textPrimary text-lg">To: {persona?.name || 'N/A'} | Using: {operator?.name || 'N/A'}</h4>
                  <p className="text-xs text-textSecondary mt-1">Global Media Type at creation: <span className="font-medium">{MEDIA_TYPE_OPTIONS.find(opt => opt.value === (Object.values(draft.platformContents).find(pc => !CONTENT_PLATFORMS.find(cp => cp.key === Object.keys(draft.platformContents).find(k => draft.platformContents[k] === pc)!)?.isPoster && pc.mediaType !== 'none')?.mediaType || 'none'))?.label || 'Text Only'}</span></p>
                  <p className="text-xs text-textSecondary mt-1 mb-3">Custom Instructions: {draft.customPrompt || "None"}</p>
                  <div className="space-y-4">
                    {Object.entries(draft.platformContents).map(([platformKey, platformData]) => {
                      const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
                      if (!platformData || (!platformData.content && !platformData.processedImageUrl && !platformData.videoIdea && !platformData.subject && !platformData.imagePrompt)) return null;
                      return (
                        <div key={platformKey} className="p-3 border border-lightBorder rounded bg-card shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-textPrimary flex items-center">
                                {getPlatformIconDisplay(platformInfo?.icon)} {platformInfo?.label || platformKey}:
                            </h5>
                            <Button size="sm" variant="primary" onClick={() => handleOpenScheduleModal(draft, platformKey, platformData)} className="ml-2 text-xs py-1 px-2" leftIcon={<CalendarDaysIcon className="w-3.5 h-3.5" />}> Schedule </Button>
                          </div>
                          {platformData.subject && <p className="text-sm font-semibold text-textPrimary mt-1">Subject: {platformData.subject}</p>}
                          {platformData.content && !platformInfo?.isPoster && <pre className="whitespace-pre-wrap text-sm text-textPrimary mt-1 mb-2 bg-gray-50 p-2 rounded">{platformData.content}</pre>}
                          {!platformInfo?.isPoster && platformKey !== 'Email' && platformData.hashtags && platformData.hashtags.length > 0 && (<p className="text-xs text-blue-600">Hashtags: {platformData.hashtags.join(', ')}</p>)}
                          
                          {(platformData.mediaType === 'image' || platformInfo?.isPoster) && platformData.processedImageUrl && (
                            <div className="mt-2">
                                <img src={platformData.processedImageUrl} alt="Processed content" className="max-w-xxs w-full h-auto max-h-32 rounded border border-mediumBorder object-contain"/>
                                {platformData.imageSourceType === 'upload' && <p className="text-xxs italic text-gray-500 mt-0.5">(User Uploaded Image)</p>}
                                {platformData.memeText && <p className="text-sm italic text-textSecondary mt-1">Meme: "{platformData.memeText}"</p>}
                                {platformInfo?.isPoster && !platformData.memeText && platformData.imagePrompt && <p className="text-sm italic text-textSecondary mt-1">Prompt: "{platformData.imagePrompt.substring(0,50)}..."</p>}
                            </div>
                          )}
                           {platformKey !== 'Email' && !platformInfo?.isPoster && platformData.mediaType === 'video' && platformData.videoIdea && (
                            <div className="mt-2">
                                <h6 className="text-xs font-semibold text-textPrimary">Video Idea:</h6>
                                <pre className="whitespace-pre-wrap text-xs text-textSecondary bg-gray-100 p-2 rounded">{platformData.videoIdea}</pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
       {schedulingPostInfo && ( <ScheduleModal draft={schedulingPostInfo.draft} platformKey={schedulingPostInfo.platformKey} platformDetail={schedulingPostInfo.platformDetail} onClose={() => setSchedulingPostInfo(null)} onSchedule={handleConfirmSchedule} showToast={showToast}/> )}
    </div>
  );
};
