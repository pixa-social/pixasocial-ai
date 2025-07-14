
// PlatformContentCard.tsx
import React, { useMemo } from 'react';
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
import { RefreshIcon, PhotoIcon, ArrowDownTrayIcon, ArrowDownOnSquareIcon } from '../ui/Icons';
import { Select } from '../ui/Select';

/* ---------- TYPES ---------- */
interface Props {
  platform: (typeof CONTENT_PLATFORMS)[0];
  platformData?: PlatformContentDetail;
  globalMediaType: MediaType;
  isRegenerating: boolean;
  isProcessingMedia: boolean;
  onRegenerate: (k: string) => void;
  onFieldChange: (k: string, f: keyof PlatformContentDetail, v: any) => void;
  onHashtagsChange: (k: string, v: string) => void;
  onImageSourceTypeChange: (k: string, t: ImageSourceType) => void;
  onCustomImageUpload: (k: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessImage: (k: string) => void;
  onDownloadImage: (k: string) => void;
  onPushToLibrary: (k: string) => void;
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

/* ---------- UI MINI-COMP ---------- */
const InputWithCopy: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}> = ({ label, value, onChange, placeholder, disabled, rows }) => {
  const commonProps = {
    label,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder,
    disabled,
    className: 'pr-10',
  };

  return (
    <div className="relative">
      {rows ? (
        <Textarea {...commonProps} rows={rows} />
      ) : (
        <Input {...commonProps} />
      )}
      <CopyButton textToCopy={value} size="xs" className="absolute right-2 top-8" />
    </div>
  );
};

/* ---------- MAIN COMPONENT ---------- */
export const PlatformContentCard: React.FC<Props> = React.memo(
  ({
    platform,
    platformData,
    isRegenerating,
    isProcessingMedia,
    onRegenerate,
    onFieldChange,
    onHashtagsChange,
    onImageSourceTypeChange,
    onCustomImageUpload,
    onProcessImage,
    onDownloadImage,
    onPushToLibrary,
    imageUploadRef,
    defaultFontFamily,
    defaultFontColor,
    ...rest
  }) => {
    /* ---------- early exits ---------- */
    if (isRegenerating && !platformData)
      return (
        <Card icon={getIcon(platform.icon)} title={platform.label} className="relative">
          <LoadingSpinner size="sm" text={`Generating for ${platform.label}…`} />
        </Card>
      );
    if (!platformData) return null;

    /* ---------- derived ---------- */
    const effectiveMediaType = platform.isPoster ? 'image' : platformData.mediaType;
    const limit = platform.characterLimit;

    const fullCopyText = useMemo(() => {
      if (platform.key === 'Email')
        return `Subject: ${platformData.subject || ''}\n\n${platformData.content || ''}`;
      if (platform.isPoster)
        return `Image Prompt: ${platformData.imagePrompt || ''}\nMeme Text: ${platformData.memeText || ''}`;
      return `${platformData.content || ''}\n\nHashtags: ${platformData.hashtags?.join(', ') || ''}`;
    }, [platform, platformData]);

    /* ---------- render ---------- */
    return (
      <Card
        icon={getIcon(platform.icon)}
        title={platform.label}
        className="relative animate-fadeIn"
      >
        {/* sticky action bar */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <CopyButton textToCopy={fullCopyText} tooltipText={`Copy all ${platform.label} text`} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRegenerate(platform.key)}
            isLoading={isRegenerating}
            aria-label={`Regenerate ${platform.label}`}
          >
            <RefreshIcon className="w-4 h-4" />
          </Button>
        </div>

        {isRegenerating && <LoadingSpinner size="sm" text={`Regenerating ${platform.label}…`} />}

        {!isRegenerating && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* LEFT – copy */}
            <div className="space-y-4">
              {platform.key === 'Email' && (
                <InputWithCopy
                  label="Subject"
                  value={platformData.subject || ''}
                  onChange={(v) => onFieldChange(platform.key, 'subject', v)}
                />
              )}

              <InputWithCopy
                label={platform.key === 'Email' ? 'Email Body' : 'Generated Post Text'}
                value={platformData.content || ''}
                onChange={(v) => onFieldChange(platform.key, 'content', v)}
                rows={platform.key === 'X' ? 3 : 5}
              />

              {limit && !platform.isPoster && (
                <p
                  className={`text-xs text-right ${
                    (platformData.content?.length || 0) > limit ? 'text-danger' : 'text-textSecondary'
                  }`}
                >
                  {platformData.content?.length || 0} / {limit}
                </p>
              )}

              {!platform.isPoster && platform.key !== 'Email' && (
                <InputWithCopy
                  label="Hashtags"
                  value={platformData.hashtags?.join(', ') || ''}
                  onChange={(v) => onHashtagsChange(platform.key, v)}
                  placeholder="#tag1, #tag2"
                />
              )}
            </div>

            {/* RIGHT – media */}
            <div className="space-y-4">
              {(effectiveMediaType === 'image' || platform.isPoster) && (
                <>
                  <h5 className="text-sm font-semibold">
                    {platform.isPoster ? 'Poster Generation' : 'Image & Meme'}
                  </h5>

                  {/* image source radio */}
                  {!platform.isPoster && (
                    <fieldset className="flex gap-4">
                      <legend className="sr-only">Image source</legend>
                      {(['generate', 'upload'] as ImageSourceType[]).map((t) => (
                        <label key={t} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`imgSrc-${platform.key}`}
                            value={t}
                            checked={platformData.imageSourceType === t}
                            onChange={() => onImageSourceTypeChange(platform.key, t)}
                            className="form-radio h-4 w-4 text-primary"
                          />
                          <span className="text-sm capitalize">{t}</span>
                        </label>
                      ))}
                    </fieldset>
                  )}

                  {platformData.imageSourceType === 'generate' && (
                    <InputWithCopy
                      label="AI Image Prompt"
                      value={platformData.imagePrompt || ''}
                      onChange={(v) => onFieldChange(platform.key, 'imagePrompt', v)}
                      placeholder="e.g., neon cyberpunk cat wearing sunglasses"
                      disabled={isProcessingMedia}
                    />
                  )}

                  {platformData.imageSourceType === 'upload' && (
                    <>
                      <label
                        htmlFor={`imgUp-${platform.key}`}
                        className="block text-xs font-medium mb-1"
                      >
                        Upload image (max {MAX_FILE_UPLOAD_SIZE_MB}MB)
                      </label>
                      <input
                        id={`imgUp-${platform.key}`}
                        ref={imageUploadRef}
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        onChange={(e) => onCustomImageUpload(platform.key, e)}
                        disabled={isProcessingMedia}
                        className="file-input w-full text-sm"
                      />
                      {platformData.uploadedImageBase64 && (
                        <img
                          src={platformData.uploadedImageBase64}
                          alt="Preview"
                          className="max-w-[150px] max-h-24 rounded border object-contain"
                        />
                      )}
                    </>
                  )}

                  <InputWithCopy
                    label="Meme / Overlay Text"
                    value={platformData.memeText || ''}
                    onChange={(v) => onFieldChange(platform.key, 'memeText', v)}
                    placeholder="Top text / bottom text"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      label="Font"
                      options={CURATED_FONT_OPTIONS}
                      value={platformData.fontFamily || defaultFontFamily}
                      onChange={(e) => onFieldChange(platform.key, 'fontFamily', e.target.value)}
                    />
                    <Select
                      label="Color"
                      options={MEME_TEXT_COLOR_OPTIONS}
                      value={platformData.fontColor || defaultFontColor}
                      onChange={(e) => onFieldChange(platform.key, 'fontColor', e.target.value)}
                    />
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onProcessImage(platform.key)}
                    disabled={
                      isProcessingMedia ||
                      (platformData.imageSourceType === 'generate' && !platformData.imagePrompt) ||
                      (platformData.imageSourceType === 'upload' && !platformData.uploadedImageBase64)
                    }
                    leftIcon={<PhotoIcon className="w-4 h-4" />}
                  >
                    {platform.isPoster ? 'Generate & Apply' : 'Process Image'}
                  </Button>

                  {isProcessingMedia && (
                    <LoadingSpinner size="sm" text="Processing…" />
                  )}

                  {platformData.processedImageUrl && (
                    <div className="text-center">
                      <img
                        src={platformData.processedImageUrl}
                        alt={`Processed ${platform.label}`}
                        className="max-w-full max-h-64 mx-auto rounded border object-contain"
                      />
                      <div className="flex justify-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDownloadImage(platform.key)}
                          leftIcon={<ArrowDownTrayIcon className="w-3.5 h-3.5" />}
                        >
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPushToLibrary(platform.key)}
                          leftIcon={<ArrowDownOnSquareIcon className="w-3.5 h-3.5" />}
                        >
                          Save to Library
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {effectiveMediaType === 'video' && platformData.videoIdea && (
                <>
                  <h5 className="text-sm font-semibold">Video Idea / Script</h5>
                  <InputWithCopy
                    label=""
                    value={platformData.videoIdea}
                    onChange={() => {
                      /* read-only */
                    }}
                    rows={4}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  },
);
