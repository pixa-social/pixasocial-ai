

import React, { useMemo } from 'react';
import { Persona, Operator, MediaType, UserProfile } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { SparklesIcon, CheckCircle2, Circle, TagIcon } from 'lucide-react';
import { 
    CONTENT_PLATFORMS, MEDIA_TYPE_OPTIONS, TONE_OF_VOICE_OPTIONS,
    CURATED_FONT_OPTIONS, MEME_TEXT_COLOR_OPTIONS
} from '../../constants';
import { useContentPlanner } from '../../hooks/useContentPlanner';
import { cn } from '../../lib/utils';

type ContentPlannerHook = ReturnType<typeof useContentPlanner>;

interface ContentPlannerConfigProps {
  currentUser: UserProfile;
  personas: Persona[];
  operators: Operator[];
  state: ContentPlannerHook['state'];
  handlers: ContentPlannerHook['handlers'];
}

const getPlatformIconDisplay = (icon: string | React.ReactNode | undefined) => {
    if (typeof icon === 'string') return <span className="text-lg">{icon}</span>;
    if (React.isValidElement(icon)) return React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" });
    return null;
};

const platformMediaTypeOptions: Array<{value: MediaType | 'global', label: string}> = [
    { value: 'global', label: 'Use Global' },
    ...MEDIA_TYPE_OPTIONS
];

const ContentPlannerConfigComponent: React.FC<ContentPlannerConfigProps> = ({
  currentUser, personas, operators, state, handlers
}) => {
  const personaOptions = useMemo(() => personas.map(p => ({ value: p.id, label: p.name })), [personas]);
  const operatorOptions = useMemo(() => operators.map(o => ({ value: o.id, label: `${o.name} (${o.type})` })), [operators]);
  const hasNoCredits = currentUser.ai_usage_count_monthly >= currentUser.role.max_ai_uses_monthly;

  const handlePlatformMediaTypeOverride = (platformKey: string, value: MediaType | 'global') => {
    handlers.setPlatformMediaOverrides({
        ...state.platformMediaOverrides,
        [platformKey]: value,
    });
  };
  
  const showFontColorOptions = state.globalMediaType === 'image';

  return (
    <div className="space-y-4 sticky top-20">
      <Card title="1. Core Strategy">
          <Select label="Target Persona" options={personaOptions} value={state.selectedPersonaId?.toString() || ''} onChange={e => handlers.setSelectedPersonaId(Number(e.target.value))} required />
          <Select label="Campaign Operator" options={operatorOptions} value={state.selectedOperatorId?.toString() || ''} onChange={e => handlers.setSelectedOperatorId(Number(e.target.value))} containerClassName="mt-4" required />
      </Card>
      
      <Card title="2. Creative Brief">
          <Input 
            label="Draft Title"
            value={state.title}
            onChange={e => handlers.setTitle(e.target.value)}
            placeholder="e.g., Q3 Product Launch Announcement"
            required
          />
          <div className="relative group mt-4">
              <Textarea label="Key Message / Core Idea" value={state.keyMessage} onChange={e => handlers.setKeyMessage(e.target.value)} placeholder="e.g., Our new product is revolutionary..." rows={3} />
              <Button size="sm" variant="ghost" className="absolute top-0 right-0 text-primary opacity-60 group-hover:opacity-100 transition-opacity" onClick={handlers.handleAmplifyKeyMessage} isLoading={state.isAmplifying} disabled={state.isAmplifying || !state.keyMessage || !state.selectedPersonaId} title="Amplify with AI" leftIcon={<SparklesIcon className="w-4 h-4"/>}>
                  Amplify
              </Button>
          </div>
          <Input 
            label="Tags (comma-separated)"
            value={state.tags}
            onChange={e => handlers.setTags(e.target.value)}
            placeholder="e.g., summer-promo, new-feature"
            containerClassName="mt-4"
            leftIcon={<TagIcon className="w-4 h-4 text-gray-400" />}
          />
          <Select label="Global Media Type" options={MEDIA_TYPE_OPTIONS} value={state.globalMediaType} onChange={e => handlers.setGlobalMediaType(e.target.value as MediaType)} containerClassName="mt-4" required />
          {showFontColorOptions && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                  <Select label="Default Font" options={CURATED_FONT_OPTIONS} value={state.defaultFontFamily} onChange={e => handlers.setDefaultFontFamily(e.target.value)} containerClassName="mb-0" title="Select default font for text on images" />
                  <Select label="Default Color" options={MEME_TEXT_COLOR_OPTIONS} value={state.defaultFontColor} onChange={e => handlers.setDefaultFontColor(e.target.value)} containerClassName="mb-0" title="Select default color for text on images" />
              </div>
          )}
          <Select label="Desired Tone of Voice" options={TONE_OF_VOICE_OPTIONS} value={state.selectedTone} onChange={e => handlers.setSelectedTone(e.target.value)} containerClassName="mt-4" required />
          <Textarea label="Additional Instructions (Optional)" value={state.customPrompt} onChange={e => handlers.setCustomPrompt(e.target.value)} placeholder="e.g., Make it sound urgent..." rows={3} containerClassName="mt-4" />
      </Card>

      <Card title="3. Platforms & Overrides">
          <div className="flex items-center justify-end gap-2 mb-2 -mt-2">
              <Button variant="link" size="xs" onClick={handlers.handleSelectAllPlatforms}>Select All</Button>
              <Button variant="link" size="xs" onClick={handlers.handleDeselectAllPlatforms}>Deselect All</Button>
          </div>
          <div className="space-y-2">
              {CONTENT_PLATFORMS.map(platform => {
                  const isSelected = state.selectedPlatformsForGeneration[platform.key] || false;
                  return (
                      <div 
                          key={platform.key} 
                          onClick={() => handlers.setSelectedPlatformsForGeneration(prev => ({ ...prev, [platform.key]: !prev[platform.key] }))} 
                          role="checkbox" 
                          aria-checked={isSelected} 
                          tabIndex={0} 
                          onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handlers.setSelectedPlatformsForGeneration(prev => ({ ...prev, [platform.key]: !prev[platform.key] })) }}
                          className={cn(
                              'p-3 border rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between gap-4', 
                              isSelected ? 'bg-primary/10 border-primary shadow-sm' : 'bg-card/50 border-border hover:border-primary/50'
                          )}
                      >
                          <div className="flex items-center gap-3 flex-grow">
                              {isSelected ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />}
                              <div className="flex items-center gap-2">
                                {getPlatformIconDisplay(platform.icon)}
                                <span className="text-sm font-medium text-foreground">{platform.label}</span>
                              </div>
                          </div>
                          {isSelected && !platform.isPoster && platform.key !== 'Email' && (
                              <div className="w-40 shrink-0 animate-fadeIn" style={{ animationDuration: '300ms' }} onClick={e => e.stopPropagation()}>
                                  <Select 
                                      options={platformMediaTypeOptions} 
                                      value={state.platformMediaOverrides[platform.key] || 'global'} 
                                      onChange={e => { handlePlatformMediaTypeOverride(platform.key, e.target.value as MediaType | 'global'); }} 
                                      className="text-xs py-1" 
                                      containerClassName="mb-0" 
                                      title={`Media type override for ${platform.label}`}
                                  />
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      </Card>
      
      <div className="bg-card border border-border rounded-xl p-4 shadow-soft-lg">
          {hasNoCredits && <p className="mb-2 text-sm text-yellow-400 text-center">You have used all your AI credits for this month.</p>}
          <Button variant="primary" size="lg" onClick={() => handlers.handleGenerateOrRegenerate()} isLoading={state.isLoading} className="w-full" disabled={!state.selectedPersonaId || !state.selectedOperatorId || state.isLoading || !state.isAnyPlatformSelectedForGeneration || hasNoCredits} title={hasNoCredits ? "You have no AI credits remaining." : 'Generate content for selected platforms'} aria-label={state.isLoading ? 'Generating content, please wait' : 'Generate content for selected platforms'}>
              {state.isLoading ? 'Generating Suggestions...' : 'Generate Content'}
          </Button>
      </div>
    </div>
  );
};

export default React.memo(ContentPlannerConfigComponent);