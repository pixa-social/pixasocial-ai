import React from 'react';
import { PlatformContentDetail, MediaType, ImageSourceType } from '../../types';
import { 
    CONTENT_PLATFORMS, MAX_FILE_UPLOAD_SIZE_MB, ACCEPTED_IMAGE_TYPES,
    CURATED_FONT_OPTIONS, MEME_TEXT_COLOR_OPTIONS, DEFAULT_FONT_FAMILY, DEFAULT_FONT_COLOR
} from '../../constants';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CopyButton } from '../ui/CopyButton';
import { RefreshIcon, PhotoIcon, ArrowDownTrayIcon, ArrowDownOnSquareIcon } from '../ui/Icons';
import { Select } from '../ui/Select'; // Added Select import

interface PlatformContentCardProps {
  platform: typeof CONTENT_PLATFORMS[0];
  platformData?: PlatformContentDetail;
  globalMediaType: MediaType; // This might be the effective media type after considering overrides
  isRegenerating: boolean;
  isProcessingMedia: boolean;
  onRegenerate: (platformKey: string) => void;
  onFieldChange: (platformKey: string, field: keyof PlatformContentDetail, value: any) => void;
  onHashtagsChange: (platformKey: string, newHashtagsString: string) => void;
  onImageSourceTypeChange: (platformKey: string, sourceType: ImageSourceType) => void;
  onCustomImageUpload: (platformKey: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessImage: (platformKey: string) => void;
  onDownloadImage: (platformKey: string) => void;
  onPushToLibrary: (platformKey: string) => void;
  imageUploadRef: React.RefObject<HTMLInputElement>;
  defaultFontFamily: string; // New prop
  defaultFontColor: string;  // New prop
}

const getPlatformIconDisplay = (icon: string | React.ReactNode | undefined) => {
    if (typeof icon === 'string') return <span className="mr-1.5 text-lg">{icon}</span>;
    if (React.isValidElement(icon)) return <span className="mr-1.5">{React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4 inline-block" })}</span>;
    return null;
  };

const PlatformContentCardComponent: React.FC<PlatformContentCardProps> = ({
  platform, platformData, globalMediaType,
  isRegenerating, isProcessingMedia,
  onRegenerate, onFieldChange, onHashtagsChange,
  onImageSourceTypeChange, onCustomImageUpload, onProcessImage,
  onDownloadImage, onPushToLibrary, imageUploadRef,
  defaultFontFamily, defaultFontColor // Destructure new props
}) => {
  if (isRegenerating && !platformData) { 
    return (
      <Card key={platform.key} title={`${getPlatformIconDisplay(platform.icon) || ''} ${platform.label} Post`} className="relative group/card">
        <LoadingSpinner size="sm" text={`Generating for ${platform.label}...`} />
      </Card>
    );
  }
  if (!platformData) return null;

  const platformCharacterLimit = platform.characterLimit;
  const effectiveMediaType = platform.isPoster ? 'image' : platformData.mediaType;

  return (
    <Card key={platform.key} title={`${getPlatformIconDisplay(platform.icon) || ''} ${platform.label} Post`} className="relative group/card">
        <div className="absolute top-4 right-4 flex space-x-1">
            <CopyButton textToCopy={
                platform.key === 'Email' ? `Subject: ${platformData?.subject || ''}\n\n${platformData?.content || ''}` :
                platform.isPoster ? `Image Prompt: ${platformData?.imagePrompt || ''}\nMeme Text: ${platformData?.memeText || ''}` :
                `${platformData?.content || ''}\n\nHashtags: ${platformData?.hashtags?.join(', ') || ''}`
            } tooltipText={`Copy all ${platform.label} text`} size="xs" className="opacity-50 group-hover/card:opacity-100 transition-opacity"/>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onRegenerate(platform.key)} 
                isLoading={isRegenerating} 
                className="p-1 text-xs opacity-50 group-hover/card:opacity-100 transition-opacity"
                title={`Regenerate for ${platform.label}`}
                aria-label={`Regenerate content for ${platform.label}`}
            >
              <RefreshIcon className="w-3.5 h-3.5"/>
            </Button>
        </div>

        {isRegenerating && <LoadingSpinner size="sm" text={`Regenerating for ${platform.label}...`} />}
        
        {!isRegenerating && (
            <>
                {platform.key === 'Email' && (
                  <div className="relative">
                    <Input label="Subject" value={platformData.subject || ''} onChange={e => onFieldChange(platform.key, 'subject', e.target.value)} className="font-medium pr-10" aria-label={`Subject for ${platform.label}`}/>
                    <CopyButton textToCopy={platformData.subject} size="xs" className="absolute right-2 top-8" tooltipText="Copy subject"/>
                  </div>
                 )}
                
                {!platform.isPoster && platform.key !== 'Email' && (
                  <div className="relative">
                    <Textarea 
                        label={'Generated Post Text'} 
                        value={platformData.content || ''} 
                        onChange={e => onFieldChange(platform.key, 'content', e.target.value as string)} 
                        rows={platform.key === 'X' ? 3 : 5} 
                        className="font-mono text-sm pr-10" 
                        aria-label={`Content for ${platform.label}`} 
                    />
                    <CopyButton textToCopy={platformData.content} size="xs" className="absolute right-2 top-8" tooltipText="Copy post text"/>
                   </div>
                )}
                {platform.key === 'Email' && (
                  <div className="relative mt-2">
                   <Textarea 
                      label={'Email Body'} 
                      value={platformData.content || ''} 
                      onChange={e => onFieldChange(platform.key, 'content', e.target.value as string)} 
                      rows={7} 
                      className="font-mono text-sm pr-10" 
                      aria-label={`Content for ${platform.label}`} 
                  />
                  <CopyButton textToCopy={platformData.content} size="xs" className="absolute right-2 top-8" tooltipText="Copy email body"/>
                  </div>
                )}

                {platformCharacterLimit && !platform.isPoster && (
                    <p className={`text-xs mt-1 text-right ${ (platformData.content?.length || 0) > platformCharacterLimit ? 'text-danger' : 'text-textSecondary'}`}>
                        {(platformData.content?.length || 0)} / {platformCharacterLimit}
                    </p>
                )}

                {!platform.isPoster && platform.key !== 'Email' && ( 
                  <div className="mt-3 relative">
                    <Input label="Hashtags (comma-separated, start with #)" value={platformData.hashtags?.join(', ') || ''} onChange={e => onHashtagsChange(platform.key, e.target.value)} placeholder="#hashtag1, #hashtag2" aria-label={`Hashtags for ${platform.label}`} className="pr-10"/>
                    <CopyButton textToCopy={platformData.hashtags?.join(', ')} size="xs" className="absolute right-2 top-8" tooltipText="Copy hashtags"/>
                  </div>
                )}
                
                {( (platform.key !== 'Email' && effectiveMediaType === 'image') || platform.isPoster ) && (
                    <div className="mt-4 p-3 border-t border-lightBorder">
                        <h5 className="text-sm font-semibold text-textPrimary mb-2">{platform.isPoster ? 'Image Generation & Text' : 'Image & Meme Customization'}</h5>
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
                                              checked={platformData.imageSourceType === srcType} 
                                              onChange={() => onImageSourceTypeChange(platform.key, srcType)}
                                              className="form-radio h-4 w-4 text-primary focus:ring-primary"
                                          />
                                          <span className="text-sm capitalize">{srcType}</span>
                                      </label>
                                  ))}
                              </div>
                          </div>
                        )}

                        {platformData.imageSourceType === 'generate' && (
                          <div className="relative">
                            <Input 
                                label="AI Image Prompt (Editable)" 
                                value={platformData.imagePrompt || ''} 
                                onChange={e => onFieldChange(platform.key, 'imagePrompt', e.target.value)} 
                                placeholder={platform.isPoster ? `e.g., A detailed ${platform.label.toLowerCase()} image...` : "Enter or edit AI image prompt here"}
                                disabled={isProcessingMedia}
                                containerClassName="mb-2"
                                className="pr-10"
                                aria-label={`AI image prompt for ${platform.label}`}
                            />
                            <CopyButton textToCopy={platformData.imagePrompt} size="xs" className="absolute right-2 top-8" tooltipText="Copy image prompt"/>
                          </div>
                        )}
                        {platformData.imageSourceType === 'upload' && (
                            <div className="mb-2">
                                <label htmlFor={`imageUpload-${platform.key}`} className="block text-xs font-medium text-textSecondary mb-1">
                                    Upload Custom Image (Max {MAX_FILE_UPLOAD_SIZE_MB}MB)
                                </label>
                                <input
                                  id={`imageUpload-${platform.key}`}
                                  ref={imageUploadRef}
                                  type="file"
                                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                  onChange={(e) => onCustomImageUpload(platform.key, e)}
                                  className="block w-full text-sm text-textSecondary file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-white hover:file:bg-gray-700 cursor-pointer"
                                  disabled={isProcessingMedia}
                                  aria-label={`Upload custom image for ${platform.label}`}
                                />
                                {platformData.uploadedImageBase64 && !isProcessingMedia && (
                                   <img src={platformData.uploadedImageBase64} alt="Uploaded preview" className="mt-2 max-w-[150px] max-h-24 rounded border border-mediumBorder object-contain" />
                                )}
                            </div>
                        )}
                        <div className="relative">
                          <Input 
                              label="Meme Text (will be drawn on image)" 
                              value={platformData.memeText || ''} 
                              onChange={e => onFieldChange(platform.key, 'memeText', e.target.value)} 
                              placeholder="Enter meme text here" 
                              aria-label={`Meme text for ${platform.label}`} 
                              containerClassName="mb-2"
                              className="pr-10"
                          />
                          <CopyButton textToCopy={platformData.memeText} size="xs" className="absolute right-2 top-8" tooltipText="Copy meme text"/>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            <Select 
                                label="Font Style"
                                options={CURATED_FONT_OPTIONS}
                                value={platformData.fontFamily || defaultFontFamily}
                                onChange={e => onFieldChange(platform.key, 'fontFamily', e.target.value)}
                                containerClassName="mb-0"
                                className="text-xs"
                            />
                            <Select
                                label="Font Color"
                                options={MEME_TEXT_COLOR_OPTIONS}
                                value={platformData.fontColor || defaultFontColor}
                                onChange={e => onFieldChange(platform.key, 'fontColor', e.target.value)}
                                containerClassName="mb-0"
                                className="text-xs"
                            />
                        </div>
                        
                        <Button 
                            variant="secondary" size="sm" 
                            onClick={() => onProcessImage(platform.key)} 
                            isLoading={isProcessingMedia} 
                            disabled={
                                isProcessingMedia ||
                                (platformData.imageSourceType === 'generate' && !platformData.imagePrompt) ||
                                (platformData.imageSourceType === 'upload' && !platformData.uploadedImageBase64)
                            }
                            className="mt-3 text-xs"
                            leftIcon={<PhotoIcon className="w-4 h-4" />}
                            aria-label={platform.isPoster ? 'Generate image and apply meme text' : 'Apply meme text and process image'}
                        >
                            {platform.isPoster ? 'Generate & Apply Meme' : 'Apply Meme & Process Image'}
                        </Button>

                        {isProcessingMedia && !platformData.processedImageUrl && <LoadingSpinner size="sm" text="Processing image..." className="my-2"/>}
                        
                        {!isProcessingMedia && platformData.processedImageUrl && (
                          <div className="mt-3 text-center">
                            <img src={platformData.processedImageUrl} alt={`Processed ${platform.label} image`} className="max-w-full w-auto h-auto max-h-60 rounded my-2 border border-mediumBorder object-contain inline-block" />
                            <div className="flex justify-center space-x-2 mt-2">
                                <Button size="sm" variant="ghost" onClick={() => onDownloadImage(platform.key)} leftIcon={<ArrowDownTrayIcon className="w-3.5 h-3.5"/>} aria-label="Download image">Download</Button>
                                <Button size="sm" variant="ghost" onClick={() => onPushToLibrary(platform.key)} leftIcon={<ArrowDownOnSquareIcon className="w-3.5 h-3.5"/>} aria-label="Save image to library">Save to Library</Button>
                            </div>
                          </div>
                        )}
                        {!isProcessingMedia && !platformData.processedImageUrl && platformData.imageSourceType === 'generate' && platformData.imagePrompt?.includes('(Error:') && ( <p className="text-xs text-danger my-2">{platformData.imagePrompt}</p> )}
                        
                    </div>
                )}
                {platform.key !== 'Email' && !platform.isPoster && effectiveMediaType === 'video' && platformData.videoIdea && (
                    <div className="mt-4 p-3 border-t border-lightBorder relative">
                        <h5 className="text-sm font-semibold text-textPrimary mb-1">Video Idea/Script (AI Suggested)</h5>
                        <Textarea value={platformData.videoIdea} readOnly rows={4} className="bg-gray-50 text-sm pr-10" aria-label={`Video idea for ${platform.label}`} />
                        <CopyButton textToCopy={platformData.videoIdea} size="xs" className="absolute right-5 top-10" tooltipText="Copy video idea"/>
                    </div>
                )}
            </>
        )}
    </Card>
  );
};

export const PlatformContentCard = React.memo(PlatformContentCardComponent);
