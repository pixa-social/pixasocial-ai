import React, { useCallback, useMemo } from 'react';
import { Persona, Operator, MediaType } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { 
    CONTENT_PLATFORMS, MEDIA_TYPE_OPTIONS, TONE_OF_VOICE_OPTIONS,
    CURATED_FONT_OPTIONS, MEME_TEXT_COLOR_OPTIONS // Added font/color constants
} from '../../constants';

interface ContentPlannerConfigProps {
  personas: Persona[];
  operators: Operator[];
  selectedPersonaId: string;
  onSelectedPersonaIdChange: (id: string) => void;
  selectedOperatorId: string;
  onSelectedOperatorIdChange: (id: string) => void;
  keyMessage: string;
  onKeyMessageChange: (message: string) => void;
  globalMediaType: MediaType;
  onGlobalMediaTypeChange: (type: MediaType) => void;
  platformSpecificMediaTypes: Record<string, MediaType | 'global'>;
  onPlatformSpecificMediaTypeChange: (newOverrides: Record<string, MediaType | 'global'>) => void;
  selectedTone: string;
  onSelectedToneChange: (tone: string) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  selectedPlatformsForGeneration: Record<string, boolean>;
  onSelectedPlatformChange: (platformKey: string) => void;
  onGenerateAll: () => void;
  isLoading: boolean;
  isAnyPlatformSelected: boolean;

  // New props for font and color
  defaultFontFamily: string;
  onDefaultFontFamilyChange: (fontFamily: string) => void;
  defaultFontColor: string;
  onDefaultFontColorChange: (fontColor: string) => void;
}

const getPlatformIconDisplay = (icon: string | React.ReactNode | undefined) => {
    if (typeof icon === 'string') return <span className="mr-1.5 text-lg">{icon}</span>;
    if (React.isValidElement(icon)) return <span className="mr-1.5">{React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4 inline-block" })}</span>;
    return null;
  };

const platformMediaTypeOptions: Array<{value: MediaType | 'global', label: string}> = [
    { value: 'global', label: 'Global Setting' },
    ...MEDIA_TYPE_OPTIONS
];


const ContentPlannerConfigComponent: React.FC<ContentPlannerConfigProps> = ({
  personas, operators,
  selectedPersonaId, onSelectedPersonaIdChange,
  selectedOperatorId, onSelectedOperatorIdChange,
  keyMessage, onKeyMessageChange,
  globalMediaType, onGlobalMediaTypeChange,
  platformSpecificMediaTypes, onPlatformSpecificMediaTypeChange,
  selectedTone, onSelectedToneChange,
  customPrompt, onCustomPromptChange,
  selectedPlatformsForGeneration, onSelectedPlatformChange,
  onGenerateAll, isLoading, isAnyPlatformSelected,
  defaultFontFamily, onDefaultFontFamilyChange, // Destructure new props
  defaultFontColor, onDefaultFontColorChange
}) => {
  const personaOptions = useMemo(() => personas.map(p => ({ value: p.id, label: p.name })), [personas]);
  const operatorOptions = useMemo(() => operators.map(o => ({ value: o.id, label: `${o.name} (${o.type})` })), [operators]);

  const handlePlatformMediaTypeOverride = useCallback((platformKey: string, value: MediaType | 'global') => {
    onPlatformSpecificMediaTypeChange({
        ...platformSpecificMediaTypes,
        [platformKey]: value,
    });
  }, [platformSpecificMediaTypes, onPlatformSpecificMediaTypeChange]);
  
  const showFontColorOptions = globalMediaType === 'image';

  return (
    <Card title="Configuration" className="md:col-span-1">
      <Select label="Target Persona" options={personaOptions} value={selectedPersonaId} onChange={e => onSelectedPersonaIdChange(e.target.value)} required />
      <Select label="Campaign Operator" options={operatorOptions} value={selectedOperatorId} onChange={e => onSelectedOperatorIdChange(e.target.value)} required />
      
      <Textarea 
        label="Key Message / Core Idea (Optional)" 
        value={keyMessage} 
        onChange={e => onKeyMessageChange(e.target.value)} 
        placeholder="e.g., Our new product is revolutionary because..." 
        rows={2} 
        containerClassName="mt-4" 
      />
      
      <Select label="Global Media Type (for non-Email/Poster unless overridden)" options={MEDIA_TYPE_OPTIONS} value={globalMediaType} onChange={e => onGlobalMediaTypeChange(e.target.value as MediaType)} containerClassName="mt-4" required />
      
      {showFontColorOptions && (
        <>
          <Select 
            label="Default Font Style (for Image Meme Text)" 
            options={CURATED_FONT_OPTIONS} 
            value={defaultFontFamily} 
            onChange={e => onDefaultFontFamilyChange(e.target.value)} 
            containerClassName="mt-4"
            title="Select default font for text on images"
          />
          <Select 
            label="Default Font Color (for Image Meme Text)" 
            options={MEME_TEXT_COLOR_OPTIONS} 
            value={defaultFontColor} 
            onChange={e => onDefaultFontColorChange(e.target.value)} 
            containerClassName="mt-4"
            title="Select default color for text on images"
          />
        </>
      )}

      <Select label="Desired Tone of Voice" options={TONE_OF_VOICE_OPTIONS} value={selectedTone} onChange={e => onSelectedToneChange(e.target.value)} containerClassName="mt-4" required />
      <Textarea label="Custom Prompt / Additional Instructions (Optional)" value={customPrompt} onChange={e => onCustomPromptChange(e.target.value)} placeholder="e.g., Make it sound urgent..." rows={3} containerClassName="mt-4" />
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-textSecondary mb-2">Select Platforms for Generation & Media Overrides:</label>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2"> {/* Increased max-h */}
          {CONTENT_PLATFORMS.map(platform => (
            <div key={platform.key} className="p-2 border border-lightBorder rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id={`platform-checkbox-${platform.key}`}
                            type="checkbox"
                            checked={selectedPlatformsForGeneration[platform.key] || false}
                            onChange={() => onSelectedPlatformChange(platform.key)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-2"
                            aria-labelledby={`platform-label-${platform.key}`}
                        />
                        <label id={`platform-label-${platform.key}`} htmlFor={`platform-checkbox-${platform.key}`} className="text-sm text-textPrimary flex items-center">
                            {getPlatformIconDisplay(platform.icon)} {platform.label}
                        </label>
                    </div>
                </div>
                {selectedPlatformsForGeneration[platform.key] && !platform.isPoster && platform.key !== 'Email' && (
                    <div className="mt-1.5 pl-6">
                         <Select 
                            label="" /* No label for compact view */
                            options={platformMediaTypeOptions} 
                            value={platformSpecificMediaTypes[platform.key] || 'global'} 
                            onChange={e => handlePlatformMediaTypeOverride(platform.key, e.target.value as MediaType | 'global')} 
                            className="text-xs py-1"
                            containerClassName="mb-0"
                            title={`Media type override for ${platform.label}`}
                         />
                    </div>
                )}
            </div>
          ))}
        </div>
      </div>

      <Button 
        variant="primary" 
        onClick={onGenerateAll} 
        isLoading={isLoading} 
        className="w-full mt-6" 
        disabled={!selectedPersonaId || !selectedOperatorId || isLoading || !isAnyPlatformSelected}
        aria-label={isLoading ? 'Generating content, please wait' : 'Generate content for selected platforms'}
      >
        {isLoading ? 'Generating Suggestions...' : 'Generate All Platform Content'}
      </Button>
    </Card>
  );
};

export const ContentPlannerConfig = React.memo(ContentPlannerConfigComponent);
