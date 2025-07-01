import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ContentDraft, Persona, Operator, PlatformContentMap, PlatformContentDetail, MediaType, ScheduledPost, ImageSourceType, ContentLibraryAsset, ViewName } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson, generateImages } from '../services/aiService'; 
import { 
    CONTENT_PLATFORMS, MEDIA_TYPE_OPTIONS, TONE_OF_VOICE_OPTIONS, MAX_FILE_UPLOAD_SIZE_BYTES, MAX_FILE_UPLOAD_SIZE_MB, ACCEPTED_IMAGE_TYPES,
    DEFAULT_FONT_FAMILY, DEFAULT_FONT_COLOR, FONT_CATEGORY_MAP, MEME_TEXT_COLOR_OPTIONS // Added font constants
} from '../constants';
import { useToast } from './ui/ToastProvider';
import { CalendarDaysIcon } from './ui/Icons';
import { ScheduleModal } from './content-planner/ScheduleModal';
import { ContentPlannerConfig } from './content-planner/ContentPlannerConfig';
import { PlatformContentCard } from './content-planner/PlatformContentCard';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard'; 
import { useNavigateToView } from '../hooks/useNavigateToView'; 
import { ContentPlannerSkeleton } from './skeletons/ContentPlannerSkeleton';

interface ContentPlannerViewProps {
  contentDrafts: ContentDraft[];
  personas: Persona[];
  operators: Operator[];
  onAddContentDraft: (draft: ContentDraft) => void;
  onAddScheduledPost: (post: ScheduledPost) => void;
  onAddContentLibraryAsset: (asset: ContentLibraryAsset) => void;
  onNavigate?: (view: ViewName) => void; 
}

interface AiPlatformContentSuggestion {
  content?: string; 
  hashtags?: string[];
  subject?: string;
  imagePrompt?: string; 
  memeText?: string;    
  videoIdea?: string;
  fontCategory?: string; // AI suggested font category
  fontColorSuggestion?: string; // AI suggested font color name
}
type AiPlatformContentResponse = Record<string, AiPlatformContentSuggestion>;

const getPlatformIconDisplay = (icon: string | React.ReactNode | undefined) => {
  if (typeof icon === 'string') return <span className="mr-1.5 text-lg">{icon}</span>;
  if (React.isValidElement(icon)) return <span className="mr-1.5">{React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4 inline-block" })}</span>;
  return null;
};

export const ContentPlannerView: React.FC<ContentPlannerViewProps> = ({ 
    contentDrafts, personas, operators, onAddContentDraft, onAddScheduledPost, onAddContentLibraryAsset, onNavigate 
}) => {
  const { showToast } = useToast();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [keyMessage, setKeyMessage] = useState<string>(''); 
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [globalMediaType, setGlobalMediaType] = useState<MediaType>('none');
  const [selectedTone, setSelectedTone] = useState<string>('');
  const navigateTo = useNavigateToView(onNavigate);
  const [isInitialLoading, setIsInitialLoading] = useState(true); 
  
  // Font and Color State
  const [defaultFontFamily, setDefaultFontFamily] = useState<string>(DEFAULT_FONT_FAMILY);
  const [defaultFontColor, setDefaultFontColor] = useState<string>(DEFAULT_FONT_COLOR);

  const initialSelectedPlatforms = CONTENT_PLATFORMS.reduce((acc, p) => {
    acc[p.key] = true; 
    return acc;
  }, {} as Record<string, boolean>);
  const [selectedPlatformsForGeneration, setSelectedPlatformsForGeneration] = useState<Record<string, boolean>>(initialSelectedPlatforms);

  const initialPlatformSpecificMediaTypes = CONTENT_PLATFORMS.reduce((acc, p) => {
    acc[p.key] = 'global';
    return acc;
  }, {} as Record<string, MediaType | 'global'>);
  const [platformSpecificMediaTypes, setPlatformSpecificMediaTypes] = useState<Record<string, MediaType | 'global'>>(initialPlatformSpecificMediaTypes);

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

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 750); 
    return () => clearTimeout(timer);
  }, []);


  const personaOptions = useMemo(() => personas.map(p => ({ value: p.id, label: p.name })), [personas]);
  const operatorOptions = useMemo(() => operators.map(o => ({ value: o.id, label: `${o.name} (${o.type})` })), [operators]);

  const handleSelectedPlatformChange = useCallback((platformKey: string) => {
    setSelectedPlatformsForGeneration(prev => ({
      ...prev,
      [platformKey]: !prev[platformKey],
    }));
  }, []);

  const isAnyPlatformSelectedForGeneration = useMemo(() => Object.values(selectedPlatformsForGeneration).some(isSelected => isSelected), [selectedPlatformsForGeneration]);


  const handleGenerateOrRegenerate = useCallback(async (
    forSpecificPlatformKey?: string 
  ) => {
    if (!selectedPersonaId || !selectedOperatorId) {
      setError("Please select a Persona and an Operator.");
      showToast("Please select a Persona and an Operator.", "error");
      return;
    }
    const persona = personas.find(p => p.id === selectedPersonaId);
    const operator = operators.find(o => o.id === selectedOperatorId);

    if (!persona || !operator) {
      setError("Selected Persona or Operator not found.");
      showToast("Selected Persona or Operator not found.", "error");
      return;
    }
    
    const platformsToProcess = forSpecificPlatformKey 
      ? CONTENT_PLATFORMS.filter(p => p.key === forSpecificPlatformKey)
      : CONTENT_PLATFORMS.filter(p => selectedPlatformsForGeneration[p.key]);

    if (platformsToProcess.length === 0 && !forSpecificPlatformKey) {
        setError("Please select at least one platform to generate content for.");
        showToast("Please select at least one platform to generate content for.", "error");
        return;
    }
    
    if (forSpecificPlatformKey) {
        setIsRegeneratingPlatform(prev => ({ ...prev, [forSpecificPlatformKey]: true }));
    } else {
        setIsLoading(true);
        setPlatformContents({}); 
    }
    setError(null);
    
    let globalMediaInstructionAggregator = ''; 
    let fontInstructions = '';
    if (defaultFontFamily === 'AI Suggested' && (globalMediaType === 'image' || platformsToProcess.some(p => (platformSpecificMediaTypes[p.key] || globalMediaType) === 'image'))) {
        fontInstructions = `Also suggest a 'fontCategory' (e.g., "playful-script", "bold-impactful", "horror-themed") and a 'fontColorSuggestion' (e.g., "white", "black", "yellow") for any meme text.`;
    }

    const platformGuidelineInstructions = platformsToProcess.map(p_config => {
        let currentPlatformMediaType = globalMediaType; 
        if (platformSpecificMediaTypes[p_config.key] && platformSpecificMediaTypes[p_config.key] !== 'global') {
            currentPlatformMediaType = platformSpecificMediaTypes[p_config.key] as MediaType;
        }
        if (forSpecificPlatformKey && platformContents[p_config.key]) {
            currentPlatformMediaType = platformContents[p_config.key].mediaType;
        }
        if (p_config.isPoster) currentPlatformMediaType = 'image';
        
        let platformSpecificMediaInstruction = "";
        let mediaRequestDescription = "Text Only";

        if (p_config.isPoster) {
             platformSpecificMediaInstruction = `It MUST include 'imagePrompt' and 'memeText'. The 'imagePrompt' should describe ONLY the visual elements for a ${p_config.label.toLowerCase()} image, MUST NOT include any text for the image generator. 'memeText' must be short, clear, and grammatically correct. No 'content' or 'hashtags' fields. ${fontInstructions}`;
             mediaRequestDescription = "Image with Meme Text (Poster)";
        } else if (p_config.key === 'Email') {
            platformSpecificMediaInstruction = "It MUST include 'subject' and 'content' (for the email body). No hashtags unless custom prompt asks. Media types (imagePrompt, videoIdea) only if custom prompt explicitly asks for email media concepts.";
            mediaRequestDescription = "Subject & Body";
        } else { 
            if (currentPlatformMediaType === 'image') {
                 platformSpecificMediaInstruction = `It MUST include 'content', 'hashtags', 'imagePrompt' (visuals only, no text for generator), and 'memeText' (clear, correct). ${fontInstructions}`;
                 mediaRequestDescription = "Image with Meme Text";
            } else if (currentPlatformMediaType === 'video') {
                platformSpecificMediaInstruction = `It MUST include 'content', 'hashtags', and 'videoIdea'.`;
                mediaRequestDescription = "Video Idea/Script";
            } else { 
                platformSpecificMediaInstruction = `It MUST include 'content' and 'hashtags'.`;
            }
        }
      globalMediaInstructionAggregator += `For ${p_config.label}: request is ${mediaRequestDescription}. `;
      return `- ${p_config.label} (${p_config.key}): ${p_config.styleGuideline} ${platformSpecificMediaInstruction}`;
    }).join("\n      ");
    
    const emailExample = platformsToProcess.some(p => p.key === 'Email') ? `"Email": { "subject": "Compelling Email Subject", "content": "Full email body content here..." }` : '';
    const firstSocialPlatform = platformsToProcess.find(p => p.key !== 'Email' && !p.isPoster);
    
    let socialExample = '';
    if (firstSocialPlatform) {
        const mediaTypeForExample = platformSpecificMediaTypes[firstSocialPlatform.key] || globalMediaType;
        socialExample = `"${firstSocialPlatform.key}": { "content": "Post text for ${firstSocialPlatform.key}", "hashtags": ["#tag${firstSocialPlatform.key}"]`;
        if (mediaTypeForExample === 'image') {
            socialExample += ', "imagePrompt": "...", "memeText": "...", "fontCategory": "modern-clean", "fontColorSuggestion": "white"';
        } else if (mediaTypeForExample === 'video') {
            socialExample += ', "videoIdea": "..."';
        }
        socialExample += ' }';
    }

    const firstPosterPlatform = platformsToProcess.find(p => p.isPoster);
    const posterExample = firstPosterPlatform ? `"${firstPosterPlatform.key}": { "imagePrompt": "Purely visual description for ${firstPosterPlatform.label}, no text elements.", "memeText": "Short, clear, catchy meme text", "fontCategory": "bold-impactful", "fontColorSuggestion": "yellow" }` : '';
    
    const exampleStructureParts = [socialExample, emailExample, posterExample].filter(Boolean).join(",\n        ");

    const systemInstruction = `You are a master propagandist and psychological operations content creator. Your goal is to be subtle yet effective, tailoring messages for different platforms. 
For 'Poster' platforms: 'imagePrompt' MUST describe visual elements ONLY, no text. 'memeText' MUST be short, clear, grammatically correct. No 'content' or 'hashtags'.
For all platforms with images: 'imagePrompt' must be visual only. 'memeText' must be clear and make sense.
If asked for fontCategory, choose from: ${Object.keys(FONT_CATEGORY_MAP).join(', ')}.
If asked for fontColorSuggestion, choose from: ${MEME_TEXT_COLOR_OPTIONS.map(c => c.label.toLowerCase()).join(', ')}.
Return valid JSON for all requested platforms and all required fields. Adhere strictly to the JSON format. Avoid gibberish.`;

    const prompt = `
      Persona: ${persona.name} (Demographics: ${persona.demographics}, Psychographics: ${persona.psychographics}, Beliefs: ${persona.initialBeliefs}, Vulnerabilities: ${persona.vulnerabilities?.join(', ') || 'N/A'})
      Operator: ${operator.name} (Type: ${operator.type})
      Conditioned Stimulus (CS): ${operator.conditionedStimulus}
      Unconditioned Stimulus (US): ${operator.unconditionedStimulus}
      Desired Conditioned Response (CR): ${operator.desiredConditionedResponse}
      
      Key Message/Core Idea for this campaign: ${keyMessage || "Not specified, focus on operator and persona."}
      Desired Tone of Voice: ${selectedTone || "Default/Neutral"}
      Additional Instructions from User: ${customPrompt || "None"}
      
      Overall Media Approach Summary: ${globalMediaInstructionAggregator.trim()}
      Platform Specific Style Guidelines & Requirements (generate content for each of these SELECTED platforms):
      ${platformGuidelineInstructions}
      
      Return your response as a single JSON object. The keys of this object should be the platform keys. Each value an object with fields as specified.
      Example structure: { ${exampleStructureParts} }
    `;
    
    const result = await generateJson<AiPlatformContentResponse>(prompt, systemInstruction);
    
    if (forSpecificPlatformKey) {
        setIsRegeneratingPlatform(prev => ({ ...prev, [forSpecificPlatformKey]: false }));
    } else {
        setIsLoading(false);
    }

    if (result.data) {
        const updatedContents: PlatformContentMap = forSpecificPlatformKey ? { ...platformContents } : {};
        platformsToProcess.forEach(p_config => {
            const suggestion = result.data?.[p_config.key];
            
            let finalPlatformMediaType = globalMediaType;
            if (platformSpecificMediaTypes[p_config.key] && platformSpecificMediaTypes[p_config.key] !== 'global') {
                finalPlatformMediaType = platformSpecificMediaTypes[p_config.key] as MediaType;
            }
            if (forSpecificPlatformKey && platformContents[p_config.key]) { 
                finalPlatformMediaType = platformContents[p_config.key].mediaType;
            }
            if (p_config.isPoster) finalPlatformMediaType = 'image';
            
            const platformImageSourceType = p_config.isPoster || finalPlatformMediaType === 'image' ? 'generate' : undefined;

            let finalFontFamily = defaultFontFamily === 'AI Suggested' ? DEFAULT_FONT_FAMILY : defaultFontFamily;
            let finalFontColor = defaultFontColor;
            let aiSuggestedCategory = undefined;

            if (suggestion && finalPlatformMediaType === 'image') {
                if (defaultFontFamily === 'AI Suggested') {
                    aiSuggestedCategory = suggestion.fontCategory || 'default';
                    finalFontFamily = FONT_CATEGORY_MAP[aiSuggestedCategory] || FONT_CATEGORY_MAP['default'];
                    const suggestedColorLabel = suggestion.fontColorSuggestion?.toLowerCase();
                    finalFontColor = MEME_TEXT_COLOR_OPTIONS.find(c => c.label.toLowerCase() === suggestedColorLabel)?.value || defaultFontColor;
                }
            }

            if (suggestion) {
                updatedContents[p_config.key] = {
                    content: p_config.isPoster ? '' : (suggestion.content || (p_config.key === 'Email' ? 'AI did not provide email body.' : `AI did not provide content for ${p_config.label}.`)),
                    subject: p_config.key === 'Email' ? (suggestion.subject || 'AI did not provide subject.') : undefined,
                    hashtags: p_config.isPoster ? [] : (suggestion.hashtags || []),
                    mediaType: finalPlatformMediaType, 
                    imageSourceType: platformImageSourceType,
                    imagePrompt: (p_config.key !== 'Email' && finalPlatformMediaType === 'image') ? suggestion.imagePrompt : undefined,
                    memeText: (p_config.key !== 'Email' && finalPlatformMediaType === 'image') ? suggestion.memeText : undefined,
                    videoIdea: (p_config.key !== 'Email' && finalPlatformMediaType === 'video' && !p_config.isPoster) ? suggestion.videoIdea : undefined,
                    uploadedImageBase64: (forSpecificPlatformKey && platformContents[p_config.key]?.imageSourceType === 'upload') 
                                        ? platformContents[p_config.key]?.uploadedImageBase64
                                        : undefined,
                    processedImageUrl: (forSpecificPlatformKey && platformContents[p_config.key]?.processedImageUrl && suggestion.imagePrompt === platformContents[p_config.key]?.imagePrompt) 
                                       ? platformContents[p_config.key]?.processedImageUrl 
                                       : undefined,
                    fontFamily: finalPlatformMediaType === 'image' ? finalFontFamily : undefined,
                    fontColor: finalPlatformMediaType === 'image' ? finalFontColor : undefined,
                    aiSuggestedFontCategory: finalPlatformMediaType === 'image' ? aiSuggestedCategory : undefined,
                };
            } else { 
                 updatedContents[p_config.key] = { 
                     content: p_config.isPoster ? '' : `AI did not provide content for ${p_config.label}.`, 
                     hashtags: p_config.isPoster ? [] : [], 
                     mediaType: finalPlatformMediaType, 
                     subject: p_config.key === 'Email' ? 'AI did not provide subject.' : undefined,
                     imageSourceType: platformImageSourceType,
                     imagePrompt: (p_config.key !== 'Email' && finalPlatformMediaType === 'image') ? `Failed to get image prompt for ${p_config.label}` : undefined,
                     fontFamily: finalPlatformMediaType === 'image' ? finalFontFamily : undefined,
                     fontColor: finalPlatformMediaType === 'image' ? finalFontColor : undefined,
                    };
            }
        });
        setPlatformContents(updatedContents);
    } else {
        setError(result.error || "Failed to generate content. AI might not have returned data or provider not fully implemented.");
        showToast(result.error || "Failed to generate content.", "error");
    }
  }, [
    selectedPersonaId, selectedOperatorId, keyMessage, customPrompt, personas, operators, 
    globalMediaType, platformSpecificMediaTypes, platformContents, selectedTone, selectedPlatformsForGeneration, 
    defaultFontFamily, defaultFontColor, // Added font/color dependencies
    showToast
]);


  const handleProcessImageForPlatform = useCallback(async (platformKey: string) => {
    const currentPlatformDetail = platformContents[platformKey];
    const platformConfig = CONTENT_PLATFORMS.find(p => p.key === platformKey);

    if (!currentPlatformDetail || currentPlatformDetail.mediaType !== 'image' || !platformConfig) {
        showToast("Cannot process image: Not an image type, details missing, or platform config not found.", "error");
        return;
    }

    const { imageSourceType, imagePrompt, uploadedImageBase64, memeText, fontFamily, fontColor } = currentPlatformDetail;
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
        image.crossOrigin = "anonymous"; // Important for canvas if image is from different origin (e.g. AI service)
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

                if (imgAspectRatio > canvasAspectRatio) { 
                    drawHeight = canvasHeight;
                    drawWidth = imgAspectRatio * drawHeight;
                    offsetX = (canvasWidth - drawWidth) / 2;
                    offsetY = 0;
                } else { 
                    drawWidth = canvasWidth;
                    drawHeight = drawWidth / imgAspectRatio;
                    offsetX = 0;
                    offsetY = (canvasHeight - drawHeight) / 2;
                }
                finalCtx.fillStyle = 'black'; 
                finalCtx.fillRect(0,0, canvasWidth, canvasHeight);
                finalCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

            } else {
                finalCanvas.width = canvasWidth;
                finalCanvas.height = canvasHeight;
                finalCtx.drawImage(image, 0, 0);
            }


            if (memeText && memeText.trim() !== "") {
                const baseFontSize = Math.max(16, Math.min(60, Math.floor(canvasHeight * 0.08)));
                const currentFontFamily = fontFamily === 'system-default' || !fontFamily ? 'Arial' : fontFamily; // Use selected font or Arial
                const currentFontColor = fontColor || DEFAULT_FONT_COLOR;

                finalCtx.font = `bold ${baseFontSize}px "${currentFontFamily}", Arial, sans-serif`; // Add fallback fonts
                finalCtx.textAlign = 'center';
                finalCtx.textBaseline = 'bottom'; 
                finalCtx.fillStyle = currentFontColor;
                finalCtx.strokeStyle = currentFontColor === '#FFFFFF' || currentFontColor.toLowerCase() === 'white' ? 'black' : 'white'; // Contrast outline
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
            
            const finalProcessedImageUrl = finalCanvas.toDataURL('image/jpeg', 0.9); 
            setPlatformContents(prev => ({...prev, [platformKey]: {...prev[platformKey]!, processedImageUrl: finalProcessedImageUrl }}));
            showToast("Image processed successfully!", "success");
        };
        image.onerror = () => {
            showToast("Failed to load source image for processing. Ensure it's accessible (e.g., CORS enabled if from URL).", "error");
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

  const handleImageSourceTypeChange = useCallback((platformKey: string, newSourceType: ImageSourceType) => {
    const platformConfig = CONTENT_PLATFORMS.find(p => p.key === platformKey);
    let mediaTypeForPlatform = globalMediaType; 
    if (platformSpecificMediaTypes[platformKey] && platformSpecificMediaTypes[platformKey] !== 'global') {
        mediaTypeForPlatform = platformSpecificMediaTypes[platformKey] as MediaType;
    }
    if (platformConfig?.isPoster) mediaTypeForPlatform = 'image';


    setPlatformContents(prev => ({
        ...prev,
        [platformKey]: {
            ...(prev[platformKey] || { content: '', hashtags: [], mediaType: mediaTypeForPlatform}),
            mediaType: mediaTypeForPlatform, 
            imageSourceType: newSourceType,
            imagePrompt: newSourceType === 'generate' ? prev[platformKey]?.imagePrompt || '' : undefined,
            uploadedImageBase64: newSourceType === 'upload' ? prev[platformKey]?.uploadedImageBase64 : undefined,
            processedImageUrl: undefined, 
            fontFamily: prev[platformKey]?.fontFamily || (defaultFontFamily === 'AI Suggested' ? DEFAULT_FONT_FAMILY : defaultFontFamily),
            fontColor: prev[platformKey]?.fontColor || defaultFontColor,
        }
    }));
    if (newSourceType !== 'upload' && imageUploadRefs.current[platformKey]?.current) {
        imageUploadRefs.current[platformKey]!.current!.value = '';
    }
}, [globalMediaType, platformSpecificMediaTypes, defaultFontFamily, defaultFontColor]);

const handleCustomImageUpload = useCallback((platformKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
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
}, [showToast]);

const handleDownloadImage = useCallback((platformKey: string) => {
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
}, [platformContents, showToast]);

const handlePushToLibrary = useCallback((platformKey: string) => {
    const platformData = platformContents[platformKey];
    const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
    if (platformData?.processedImageUrl && platformInfo) {
        const base64Data = platformData.processedImageUrl;
        let assetName = platformData.memeText || platformData.imagePrompt?.substring(0, 30) || `${platformInfo.label} Image`;
        if (assetName.length > 50) assetName = assetName.substring(0, 50) + "...";
        
        let size = 0;
        if (base64Data.includes(',')) {
            try { size = atob(base64Data.split(',')[1]).length; } catch (e) { console.error("Error decoding base64 for size", e); }
        }

        const newAsset: ContentLibraryAsset = {
            id: Date.now().toString() + Math.random().toString(36).substring(2,9),
            name: assetName.trim(), type: 'image', dataUrl: base64Data,
            fileName: `${assetName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`,
            fileType: 'image/jpeg', size: size, uploadedAt: new Date().toISOString(),
        };
        onAddContentLibraryAsset(newAsset);
    } else {
        showToast("No processed image available to push to library.", "error");
    }
}, [platformContents, onAddContentLibraryAsset, showToast]);


  const handleSaveDraft = useCallback(() => {
    if (Object.keys(platformContents).length === 0 || !selectedPersonaId || !selectedOperatorId) {
      setError("Cannot save empty draft or draft without persona/operator and generated content.");
      showToast("Cannot save empty draft or draft without persona/operator and generated content.", "error");
      return;
    }
    const newDraft: ContentDraft = {
      id: Date.now().toString(),
      personaId: selectedPersonaId,
      operatorId: selectedOperatorId,
      keyMessage: keyMessage, 
      customPrompt: customPrompt,
      platformContents: platformContents, // platformContents already has fontFamily/fontColor
      platformSpecificMediaTypes_INTERNAL_DO_NOT_USE: platformSpecificMediaTypes, 
    };
    onAddContentDraft(newDraft);
    setSelectedPersonaId(''); setSelectedOperatorId(''); setKeyMessage(''); setCustomPrompt('');
    setPlatformContents({}); setGlobalMediaType('none'); setSelectedTone('');
    setDefaultFontFamily(DEFAULT_FONT_FAMILY); // Reset default font
    setDefaultFontColor(DEFAULT_FONT_COLOR);  // Reset default color
    setSelectedPlatformsForGeneration(initialSelectedPlatforms); 
    setPlatformSpecificMediaTypes(initialPlatformSpecificMediaTypes);
    showToast("Draft saved successfully!", "success");
  }, [
    platformContents, selectedPersonaId, selectedOperatorId, keyMessage, customPrompt, 
    platformSpecificMediaTypes, onAddContentDraft, showToast, 
    initialSelectedPlatforms, initialPlatformSpecificMediaTypes
  ]);

  const handlePlatformFieldChange = useCallback((platformKey: string, field: keyof PlatformContentDetail, value: string | string[] | undefined) => {
    setPlatformContents(prev => {
        const platformConfig = CONTENT_PLATFORMS.find(p => p.key === platformKey);
        let currentPlatformMediaType = globalMediaType;
        if(prev[platformKey]?.mediaType) { 
            currentPlatformMediaType = prev[platformKey].mediaType;
        } else if (platformSpecificMediaTypes[platformKey] && platformSpecificMediaTypes[platformKey] !== 'global') {
            currentPlatformMediaType = platformSpecificMediaTypes[platformKey] as MediaType;
        }
        if (platformConfig?.isPoster) currentPlatformMediaType = 'image';
        
        const currentPlatform = prev[platformKey] || { 
            hashtags: [], mediaType: currentPlatformMediaType, content: '', 
            subject: platformKey === 'Email' ? '' : undefined,
            fontFamily: defaultFontFamily === 'AI Suggested' ? DEFAULT_FONT_FAMILY : defaultFontFamily, // Initialize with defaults
            fontColor: defaultFontColor
        };
        return { ...prev, [platformKey]: { ...currentPlatform, [field]: value } };
    });
  }, [globalMediaType, platformSpecificMediaTypes, defaultFontFamily, defaultFontColor]);
  
   const handlePlatformHashtagsChange = useCallback((platformKey: string, newHashtagsString: string) => {
    setPlatformContents(prev => {
        const platformConfig = CONTENT_PLATFORMS.find(p => p.key === platformKey);
        let currentPlatformMediaType = globalMediaType;
        if(prev[platformKey]?.mediaType) {
            currentPlatformMediaType = prev[platformKey].mediaType;
        } else if (platformSpecificMediaTypes[platformKey] && platformSpecificMediaTypes[platformKey] !== 'global') {
            currentPlatformMediaType = platformSpecificMediaTypes[platformKey] as MediaType;
        }
        if (platformConfig?.isPoster) currentPlatformMediaType = 'image';

        return { ...prev, [platformKey]: { 
            ...(prev[platformKey] || { 
                content: '', mediaType: currentPlatformMediaType, hashtags: [],
                fontFamily: defaultFontFamily === 'AI Suggested' ? DEFAULT_FONT_FAMILY : defaultFontFamily,
                fontColor: defaultFontColor
            }), 
            hashtags: newHashtagsString.split(',').map(h => h.trim()).filter(h => h.startsWith('#')) 
        } };
    });
  }, [globalMediaType, platformSpecificMediaTypes, defaultFontFamily, defaultFontColor]);

  const handleOpenScheduleModal = useCallback((draft: ContentDraft, platformKey: string, platformDetail: PlatformContentDetail) => {
    setSchedulingPostInfo({ draft, platformKey, platformDetail });
  }, []);

  const handleConfirmSchedule = useCallback((draftId: string, platformKey: string, scheduledDateTime: string, notes: string) => {
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
      id: `sch_${Date.now()}_${draft.id}_${platformKey}`, title: title, start: scheduledDate,
      end: new Date(scheduledDate.getTime() + 60 * 60 * 1000), allDay: false, 
      resource: { contentDraftId: draft.id, platformKey: platformKey, status: 'Scheduled', notes: notes, personaId: draft.personaId, operatorId: draft.operatorId }
    };
    onAddScheduledPost(newScheduledPost);
    showToast(`Post for ${platformInfo.label} scheduled!`, "success");
  }, [contentDrafts, onAddScheduledPost, showToast]);

  const handleLoadDraft = useCallback((draftId: string) => {
    const draftToLoad = contentDrafts.find(d => d.id === draftId);
    if (!draftToLoad) {
      showToast("Could not find draft to load.", "error");
      return;
    }
    setSelectedPersonaId(draftToLoad.personaId);
    setSelectedOperatorId(draftToLoad.operatorId);
    setKeyMessage(draftToLoad.keyMessage || '');
    setCustomPrompt(draftToLoad.customPrompt);
    
    // Determine global font/color from the first relevant platform in the draft
    let loadedDefaultFontFamily = DEFAULT_FONT_FAMILY;
    let loadedDefaultFontColor = DEFAULT_FONT_COLOR;
    const firstRelevantPlatformKey = CONTENT_PLATFORMS.find(p => 
        draftToLoad.platformContents[p.key]?.mediaType === 'image' || p.isPoster
    )?.key;

    if (firstRelevantPlatformKey && draftToLoad.platformContents[firstRelevantPlatformKey]) {
        loadedDefaultFontFamily = draftToLoad.platformContents[firstRelevantPlatformKey].fontFamily || DEFAULT_FONT_FAMILY;
        loadedDefaultFontColor = draftToLoad.platformContents[firstRelevantPlatformKey].fontColor || DEFAULT_FONT_COLOR;
    }
    setDefaultFontFamily(loadedDefaultFontFamily);
    setDefaultFontColor(loadedDefaultFontColor);
    
    setPlatformContents({ ...draftToLoad.platformContents }); 

    const platformMediaTypesInDraft: MediaType[] = [];
    const specificOverrides: Record<string, MediaType | 'global'> = {};
    const platformsSelectedForGen: Record<string, boolean> = {};

    CONTENT_PLATFORMS.forEach(p_config => {
        platformsSelectedForGen[p_config.key] = !!draftToLoad.platformContents[p_config.key];
        if (draftToLoad.platformContents[p_config.key]) {
            if (!p_config.isPoster && p_config.key !== 'Email') {
                platformMediaTypesInDraft.push(draftToLoad.platformContents[p_config.key].mediaType);
            }
        }
        specificOverrides[p_config.key] = draftToLoad.platformSpecificMediaTypes_INTERNAL_DO_NOT_USE?.[p_config.key] || 'global';
    });
    
    const firstRelevantType = platformMediaTypesInDraft.length > 0 ? platformMediaTypesInDraft[0] : 'none';
    setGlobalMediaType(firstRelevantType); 
    setPlatformSpecificMediaTypes(specificOverrides);
    setSelectedPlatformsForGeneration(platformsSelectedForGen);

    showToast("Draft loaded into planner. You can now edit and re-generate.", "info");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [contentDrafts, showToast]);


  const showPrerequisiteMessage = personas.length === 0 || operators.length === 0;
  let prerequisiteAction;
  if (personas.length === 0) {
    prerequisiteAction = onNavigate ? { label: 'Go to Audience Modeling', onClick: () => navigateTo(ViewName.AudienceModeling) } : undefined;
  } else if (operators.length === 0) {
    prerequisiteAction = onNavigate ? { label: 'Go to Operator Builder', onClick: () => navigateTo(ViewName.OperatorBuilder) } : undefined;
  }

  if (isInitialLoading && !showPrerequisiteMessage) {
    return <ContentPlannerSkeleton />;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Multi-Platform Content Planner</h2>
      
      {showPrerequisiteMessage && (
         <PrerequisiteMessageCard
           title="Prerequisites Missing"
           message={
             <>
                Please create at least one Persona (in 'Audience Modeling') 
                {personas.length > 0 && " and one Operator (in 'Operator Builder')"}
                {! (personas.length > 0) && " and one Operator"}
                {' '}before planning content. 
                The "Generate" button will be enabled once these are available and selected.
             </>
           }
           action={prerequisiteAction}
         />
      )}
      {error && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4" shadow="soft-md"><p>{error}</p></Card>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ContentPlannerConfig
          personas={personas}
          operators={operators}
          selectedPersonaId={selectedPersonaId}
          onSelectedPersonaIdChange={setSelectedPersonaId}
          selectedOperatorId={selectedOperatorId}
          onSelectedOperatorIdChange={setSelectedOperatorId}
          keyMessage={keyMessage} 
          onKeyMessageChange={setKeyMessage} 
          globalMediaType={globalMediaType}
          onGlobalMediaTypeChange={setGlobalMediaType}
          platformSpecificMediaTypes={platformSpecificMediaTypes} 
          onPlatformSpecificMediaTypeChange={setPlatformSpecificMediaTypes} 
          selectedTone={selectedTone}
          onSelectedToneChange={setSelectedTone}
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
          selectedPlatformsForGeneration={selectedPlatformsForGeneration}
          onSelectedPlatformChange={handleSelectedPlatformChange}
          onGenerateAll={() => handleGenerateOrRegenerate()}
          isLoading={isLoading}
          isAnyPlatformSelected={isAnyPlatformSelectedForGeneration}
          defaultFontFamily={defaultFontFamily}
          onDefaultFontFamilyChange={setDefaultFontFamily}
          defaultFontColor={defaultFontColor}
          onDefaultFontColorChange={setDefaultFontColor}
        />
        
        <div className="md:col-span-2 space-y-6">
            {(isLoading && Object.keys(platformContents).length === 0) && <LoadingSpinner text="AI is drafting content and media ideas..." />}
            {!isLoading && Object.keys(platformContents).length === 0 && !error && !showPrerequisiteMessage && ( <Card><p className="text-textSecondary text-center py-4">Configure and click "Generate" to see content previews here.</p></Card> )}
            
            {CONTENT_PLATFORMS.filter(p => selectedPlatformsForGeneration[p.key] || platformContents[p.key]).map(platform => {
                 const currentPlatformData = platformContents[platform.key];
                 const platformIsLoading = isLoading && !currentPlatformData && selectedPlatformsForGeneration[platform.key]; 
                 
                 if (!platformIsLoading && !currentPlatformData && !isRegeneratingPlatform[platform.key] && !isProcessingMedia[platform.key]) return null;
                 
                 let effectiveMediaType = globalMediaType;
                 if (platformSpecificMediaTypes[platform.key] && platformSpecificMediaTypes[platform.key] !== 'global') {
                     effectiveMediaType = platformSpecificMediaTypes[platform.key] as MediaType;
                 }
                 if (platform.isPoster) effectiveMediaType = 'image';

                 return (
                    <PlatformContentCard
                        key={platform.key}
                        platform={platform}
                        platformData={currentPlatformData}
                        globalMediaType={effectiveMediaType} 
                        isRegenerating={isRegeneratingPlatform[platform.key] || platformIsLoading}
                        isProcessingMedia={isProcessingMedia[platform.key]}
                        onRegenerate={handleGenerateOrRegenerate}
                        onFieldChange={handlePlatformFieldChange}
                        onHashtagsChange={handlePlatformHashtagsChange}
                        onImageSourceTypeChange={handleImageSourceTypeChange}
                        onCustomImageUpload={handleCustomImageUpload}
                        onProcessImage={handleProcessImageForPlatform}
                        onDownloadImage={handleDownloadImage}
                        onPushToLibrary={handlePushToLibrary}
                        imageUploadRef={imageUploadRefs.current[platform.key]}
                        defaultFontFamily={currentPlatformData?.fontFamily || (defaultFontFamily === "AI Suggested" ? DEFAULT_FONT_FAMILY : defaultFontFamily)}
                        defaultFontColor={currentPlatformData?.fontColor || defaultFontColor}
                   />
                 );             
            })}
             {Object.keys(platformContents).some(key => platformContents[key] && (platformContents[key].content || platformContents[key].processedImageUrl || platformContents[key].videoIdea || platformContents[key].subject || platformContents[key].imagePrompt)) && !isLoading && !Object.values(isRegeneratingPlatform).some(v => v) && ( <Button variant="primary" onClick={handleSaveDraft} className="mt-4 w-full md:w-auto">Save All Platform Drafts</Button> )}
        </div>
      </div>

      <Card title="Saved Content Drafts" className="mt-8">
        {contentDrafts.length === 0 ? (<p className="text-textSecondary">No content drafts saved yet.</p>) : (
          <div className="space-y-6">
            {contentDrafts.slice().sort((a,b) => parseInt(b.id) - parseInt(a.id)).map(draft => { 
              const persona = personas.find(p => p.id === draft.personaId);
              const operator = operators.find(o => o.id === draft.operatorId);
              return (
                <Card key={draft.id} className="bg-gray-50 p-4" shadow="soft-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-textPrimary text-lg">To: {persona?.name || 'N/A'} | Using: {operator?.name || 'N/A'}</h4>
                      {draft.keyMessage && <p className="text-xs text-textSecondary mt-0.5">Key Message: "{draft.keyMessage.substring(0,50)}..."</p>}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadDraft(draft.id)}
                        className="text-xs py-1 px-2"
                    >
                        Load & Edit Draft
                    </Button>
                  </div>
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
                                {(platformData.fontFamily || platformData.fontColor) && (
                                    <p className="text-xxs text-gray-500 mt-0.5">
                                        Font: {platformData.fontFamily || 'Default'}, Color: {platformData.fontColor || 'Default'}
                                    </p>
                                )}
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

// Add to support text-xxs if not already globally defined
const style = document.createElement('style');
style.innerHTML = `
  .text-xxs {
    font-size: 0.65rem; 
    line-height: 0.8rem;
  }
`;
document.head.appendChild(style);
