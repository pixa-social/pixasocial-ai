// PlatformContentCard.tsx
import React, { useMemo, useState } from 'react';
import type { PlatformContentDetail, MediaType, ImageSourceType } from '../../types';
import {
  CONTENT_PLATFORMS,
  MAX_FILE_UPLOAD_SIZE_MB,
  ACCEPTED_IMAGE_TYPES,
  CURATED_FONT_OPTIONS,
  MEME_TEXT_COLOR_OPTIONS,
} from '../../constants';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CopyButton } from '../ui/CopyButton';
import { RefreshIcon, PhotoIcon, ArrowDownTrayIcon, ArrowDownOnSquareIcon, LightBulbIcon } from '../ui/Icons';
import { Select } from '../ui/Select';
import { Tabs, Tab } from '../ui/Tabs';

/* ---------- TYPES ---------- */
interface Props {
  platform: (typeof CONTENT_PLATFORMS)[0];
  platformData?: PlatformContentDetail;
  globalMediaType: MediaType;
  isRegenerating: boolean;
  isProcessingMedia: boolean;
  onRegenerate: (k: string) => void;
  onGenerateVariant: (k: string) => void;
  onFieldChange: (k: string, f: keyof PlatformContentDetail, v: any) => void;
  onHashtagsChange: (k: string, v: string) => void;
  onImageSourceTypeChange: (k: string, t: ImageSourceType) => void;
  onCustomImageUpload: (k: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessImage: (k: string) => void;
  onDownloadImage: (k: string) => void;
  onPushToLibrary: (k: string) => void;
  onOpenLibraryModal: (platformKey: string) => void;
  imageUploadRef: React.RefObject<HTMLInputElement>;
  defaultFontFamily: string;
  defaultFontColor: string;
}

/* ---------- HELPERS ---------- */
const getIcon = (icon: string | React.ReactNode | undefined) =>
  typeof icon === 'string' ? (
    <span className="mr-1.5 text-lg">{icon}</span>
  ) : React.isValidElement(icon) ? (
    <span className="mr-1.5">{React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4 inline-block' })}</span>
  ) : null;

/* ---------- MAIN COMPONENT ---------- */
export const PlatformContentCard: React.FC<Props> = React.memo(
  ({
    platform,
    platformData,
    onRegenerate,
    onGenerateVariant,
    onFieldChange,
    onHashtagsChange,
    onImageSourceTypeChange,
    onCustomImageUpload,
    onProcessImage,
    onDownloadImage,
    onPushToLibrary,
    onOpenLibraryModal,
    imageUploadRef,
    defaultFontFamily,
    defaultFontColor,
    isRegenerating,
    isProcessingMedia,
  }) => {
    /* ---------- early exits ---------- */
    if (isRegenerating && !platformData)
      return (
        <Card icon={getIcon(platform.icon)} title={platform.label} className="relative">
          <LoadingSpinner size="sm" text={`Generating for ${platform.label}…`} />
        </Card>
      );
    if (!platformData) return null;

    /* ---------- derived states ---------- */
    const { content, variant_content, is_variant_generating } = platformData;
    const effectiveMediaType = platform.isPoster ? 'image' : platformData.mediaType;
    const limit = platform.characterLimit;

    const fullCopyText = useMemo(() => {
        let textToCopy = content || '';
        if (platform.key === 'Email') {
            textToCopy = `Subject: ${platformData.subject || ''}\n\n${content || ''}`;
        } else if (platform.isPoster) {
            textToCopy = `Image Prompt: ${platformData.imagePrompt || ''}\nMeme Text: ${platformData.memeText || ''}`;
        } else {
            textToCopy = `${content || ''}\n\nHashtags: ${platformData.hashtags?.join(', ') || ''}`;
        }
        if (variant_content) {
            textToCopy += `\n\n--- VARIANT B ---\n${variant_content}`;
        }
        return textToCopy;
    }, [platform, platformData, content, variant_content]);

    const renderContentEditor = (isVariant: boolean) => (
        <div className="space-y-4">
            {platform.key === 'Email' && !isVariant && (
                <Textarea label="Subject" value={platformData.subject || ''} onChange={(e) => onFieldChange(platform.key, 'subject', e.target.value)} />
            )}
            <Textarea
                label={platform.key === 'Email' ? (isVariant ? 'Variant Body' : 'Email Body') : (isVariant ? 'Variant Post Text' : 'Generated Post Text')}
                value={isVariant ? variant_content || '' : content || ''}
                onChange={(e) => onFieldChange(platform.key, isVariant ? 'variant_content' : 'content', e.target.value)}
                rows={platform.key === 'X' ? 4 : 6}
            />
            {limit && !platform.isPoster && (
                <p className={`text-xs text-right ${((isVariant ? variant_content : content)?.length || 0) > limit ? 'text-danger' : 'text-muted-foreground'}`}>
                    {(isVariant ? variant_content : content)?.length || 0} / {limit}
                </p>
            )}
            {!platform.isPoster && platform.key !== 'Email' && !isVariant && (
                <Textarea
                    label="Hashtags"
                    value={platformData.hashtags?.join(', ') || ''}
                    onChange={(e) => onHashtagsChange(platform.key, e.target.value)}
                    placeholder="#tag1, #tag2"
                />
            )}
        </div>
    );
    
    return (
      <Card
        icon={getIcon(platform.icon)}
        title={platform.label}
        className="relative animate-fadeIn"
      >
        <div className="absolute top-3 right-3 flex items-center gap-2">
            <CopyButton textToCopy={fullCopyText} tooltipText={`Copy all ${platform.label} text`} />
            <Button variant="ghost" size="icon" onClick={() => onGenerateVariant(platform.key)} isLoading={is_variant_generating} aria-label={`Suggest A/B Variant for ${platform.label}`} title="Suggest A/B Variant" className="w-8 h-8"><LightBulbIcon className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onRegenerate(platform.key)} isLoading={isRegenerating} aria-label={`Regenerate ${platform.label}`} title="Regenerate" className="w-8 h-8"><RefreshIcon className="w-4 h-4" /></Button>
        </div>

        {isRegenerating && <LoadingSpinner size="sm" text={`Regenerating ${platform.label}…`} />}

        {!isRegenerating && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {variant_content || is_variant_generating ? (
                <Tabs>
                    <Tab label="Original">{renderContentEditor(false)}</Tab>
                    <Tab label="Variant B">
                        {is_variant_generating && <LoadingSpinner size="sm" text="Generating variant..." />}
                        {!is_variant_generating && renderContentEditor(true)}
                    </Tab>
                </Tabs>
              ) : ( renderContentEditor(false) )}
            </div>

            <div className="space-y-4">
              {(effectiveMediaType === 'image' || platform.isPoster) && (
                <>
                  <h5 className="text-sm font-semibold">{platform.isPoster ? 'Poster Generation' : 'Image & Meme'}</h5>
                  {!platform.isPoster && (
                    <fieldset className="flex gap-4"><legend className="sr-only">Image source</legend>
                      {(['generate', 'upload', 'library'] as ImageSourceType[]).map((t) => (
                        <label key={t} className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`imgSrc-${platform.key}`} value={t} checked={platformData.imageSourceType === t} onChange={() => onImageSourceTypeChange(platform.key, t)} className="form-radio h-4 w-4 text-primary" />
                          <span className="text-sm capitalize">{t}</span>
                        </label>
                      ))}
                    </fieldset>
                  )}
                  {platformData.imageSourceType === 'generate' && (<Textarea label="AI Image Prompt" value={platformData.imagePrompt || ''} onChange={(e) => onFieldChange(platform.key, 'imagePrompt', e.target.value)} placeholder="e.g., neon cyberpunk cat wearing sunglasses" disabled={isProcessingMedia} rows={2}/>)}
                  {platformData.imageSourceType === 'upload' && (<><label htmlFor={`imgUp-${platform.key}`} className="block text-xs font-medium mb-1">Upload image (max {MAX_FILE_UPLOAD_SIZE_MB}MB)</label><input id={`imgUp-${platform.key}`} ref={imageUploadRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={(e) => onCustomImageUpload(platform.key, e)} disabled={isProcessingMedia} className="file-input w-full text-sm" />{platformData.uploadedImageBase64 && (<img src={platformData.uploadedImageBase64} alt="Preview" className="mt-2 max-w-[150px] max-h-24 rounded border object-contain" />)}</>)}
                  {platformData.imageSourceType === 'library' && (
                      <div className="animate-fadeIn">
                          <Button size="sm" variant="outline" className="w-full" onClick={() => onOpenLibraryModal(platform.key)}>Choose from Library</Button>
                          {platformData.libraryAssetUrl && (
                              <img src={platformData.libraryAssetUrl} alt="Library preview" className="mt-2 max-w-[150px] max-h-24 rounded border object-contain" />
                          )}
                      </div>
                  )}
                  <Textarea label="Meme / Overlay Text" value={platformData.memeText || ''} onChange={(e) => onFieldChange(platform.key, 'memeText', e.target.value)} placeholder="Top text / bottom text" rows={2}/>
                  <div className="grid grid-cols-2 gap-2"><Select label="Font" options={CURATED_FONT_OPTIONS} value={platformData.fontFamily || defaultFontFamily} onChange={(e) => onFieldChange(platform.key, 'fontFamily', e.target.value)} /><Select label="Color" options={MEME_TEXT_COLOR_OPTIONS} value={platformData.fontColor || defaultFontColor} onChange={(e) => onFieldChange(platform.key, 'fontColor', e.target.value)} /></div>
                  <Button size="sm" variant="secondary" onClick={() => onProcessImage(platform.key)} disabled={isProcessingMedia || (platformData.imageSourceType === 'generate' && !platformData.imagePrompt) || (platformData.imageSourceType === 'upload' && !platformData.uploadedImageBase64)} leftIcon={<PhotoIcon className="w-4 h-4" />}>
                    {platform.isPoster ? 'Generate & Apply' : 'Process Image'}
                  </Button>
                  {isProcessingMedia && <LoadingSpinner size="sm" text="Processing…" />}
                  {platformData.processedImageUrl && (<div className="text-center"><img src={platformData.processedImageUrl} alt={`Processed ${platform.label}`} className="max-w-full max-h-64 mx-auto rounded border object-contain" /><div className="flex justify-center gap-2 mt-2"><Button size="sm" variant="ghost" onClick={() => onDownloadImage(platform.key)} leftIcon={<ArrowDownTrayIcon className="w-3.5 h-3.5" />}>Download</Button><Button size="sm" variant="ghost" onClick={() => onPushToLibrary(platform.key)} leftIcon={<ArrowDownOnSquareIcon className="w-3.5 h-3.5" />}>Save to Library</Button></div></div>)}
                </>
              )}

              {effectiveMediaType === 'video' && platformData.videoIdea && (<><h5 className="text-sm font-semibold">Video Idea / Script</h5><Textarea label="" value={platformData.videoIdea} onChange={() => {}} rows={4} /></>)}
            </div>
          </div>
        )}
      </Card>
    );
  },
);