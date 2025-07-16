

import React from 'react';
import { ContentDraft, PlatformContentDetail, ViewName, UserProfile, Persona, Operator, ScheduledPost, MediaType } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ArrowDownOnSquareIcon } from './ui/Icons';
import { ScheduleModal } from './content-planner/ScheduleModal';
import ContentPlannerConfig from './content-planner/ContentPlannerConfig';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard'; 
import { useNavigateToView } from '../hooks/useNavigateToView'; 
import { ContentPlannerSkeleton } from './skeletons/ContentPlannerSkeleton';
import { PlatformContentCard } from './content-planner/PlatformContentCard';
import { CONTENT_PLATFORMS } from '../constants';
import { useContentPlanner } from '../hooks/useContentPlanner';
import { useToast } from './ui/ToastProvider';
import { SavedContentDrafts } from './content-planner/SavedContentDrafts';

interface ContentPlannerViewProps {
  currentUser: UserProfile;
  contentDrafts: ContentDraft[];
  personas: Persona[];
  operators: Operator[];
  onAddContentDraft: (draft: Omit<ContentDraft, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDeleteContentDraft: (draftId: string) => void;
  onDeletePlatformContent: (draftId: string, platformKey: string) => void;
  onAddScheduledPost: (post: ScheduledPost) => void;
  onAddContentLibraryAsset: (file: File, name: string, tags: string[]) => Promise<void>;
  onNavigate?: (view: ViewName) => void; 
}

export const ContentPlannerView: React.FC<ContentPlannerViewProps> = (props) => {
  const { currentUser, contentDrafts, personas, operators, onNavigate, onDeleteContentDraft, onDeletePlatformContent } = props;
  const { showToast } = useToast();
  const { state, handlers, refs } = useContentPlanner(props);

  const navigateTo = useNavigateToView(onNavigate);

  const showPrerequisiteMessage = personas.length === 0 || operators.length === 0;
  let prerequisiteAction;
  if (personas.length === 0) prerequisiteAction = onNavigate ? { label: 'Go to Audience Modeling', onClick: () => navigateTo(ViewName.AudienceModeling) } : undefined;
  else if (operators.length === 0) prerequisiteAction = onNavigate ? { label: 'Go to Operator Builder', onClick: () => navigateTo(ViewName.OperatorBuilder) } : undefined;

  const handleLoadDraft = (draft: ContentDraft) => {
    handlers.setSelectedPersonaId(draft.persona_id);
    handlers.setSelectedOperatorId(draft.operator_id);
    handlers.setKeyMessage(draft.key_message || '');
    handlers.setCustomPrompt(draft.custom_prompt || '');
    handlers.setPlatformContents(draft.platform_contents);
    
    // Set selected platforms based on the draft's content
    const draftPlatforms = Object.keys(draft.platform_contents);
    const newSelectedPlatforms = Object.fromEntries(
      CONTENT_PLATFORMS.map(p => [p.key, draftPlatforms.includes(p.key)])
    );
    handlers.setSelectedPlatformsForGeneration(newSelectedPlatforms);

    // Set media overrides if they exist
    if (draft.platform_media_overrides) {
        handlers.setPlatformMediaOverrides(draft.platform_media_overrides);
        // Find the most common media type to set as global, or default to 'none'
        const mediaTypes = Object.values(draft.platform_media_overrides).filter(
            (m): m is MediaType => m !== 'global'
        );
        const mostCommon = mediaTypes.sort((a,b) =>
              mediaTypes.filter(v => v===a).length
            - mediaTypes.filter(v => v===b).length
        ).pop();
        handlers.setGlobalMediaType(mostCommon || 'none');
    }

    showToast("Draft loaded into the configuration panel.", "success");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (personas.length === 0 && operators.length === 0) return <ContentPlannerSkeleton />;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Multi-Platform Content Planner</h2>
      
      {showPrerequisiteMessage && <PrerequisiteMessageCard title="Prerequisites Missing" message="Please create at least one Persona and one Operator before planning content." action={prerequisiteAction} />}
      {state.error && <Card className="mb-4 bg-red-500/10 border-l-4 border-danger text-danger p-4"><p>{state.error}</p></Card>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ContentPlannerConfig 
            currentUser={currentUser} 
            personas={personas} 
            operators={operators} 
            state={state}
            handlers={handlers}
          />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          {state.isLoading && Object.keys(state.platformContents).length === 0 && <LoadingSpinner text="AI is drafting content..." />}
          
          {Object.entries(state.platformContents).map(([key, data]) => {
              const platform = CONTENT_PLATFORMS.find(p => p.key === key);
              if (!platform) return null;
              return (
                  <PlatformContentCard
                    key={key}
                    platform={platform}
                    platformData={data}
                    globalMediaType={state.globalMediaType}
                    isRegenerating={state.isRegeneratingPlatform[key] || false}
                    isProcessingMedia={state.isProcessingMedia[key] || false}
                    onRegenerate={() => handlers.handleGenerateOrRegenerate(key)}
                    onGenerateVariant={() => handlers.handleGenerateVariant(key)}
                    onFieldChange={handlers.handleFieldChange}
                    onHashtagsChange={handlers.handleHashtagsChange}
                    onImageSourceTypeChange={handlers.handleImageSourceTypeChange}
                    onCustomImageUpload={handlers.handleCustomImageUpload}
                    onProcessImage={handlers.handleProcessImage}
                    onDownloadImage={handlers.handleDownloadImage}
                    onPushToLibrary={handlers.handlePushToLibrary}
                    imageUploadRef={refs.imageUploadRefs.current[key]}
                    defaultFontFamily={state.defaultFontFamily}
                    defaultFontColor={state.defaultFontColor}
                  />
              )
          })}
        </div>
      </div>

      {Object.keys(state.platformContents).length > 0 && !state.isLoading && (
        <Card className="mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-textSecondary text-center sm:text-left">Happy with the generated content? Save it to your drafts to schedule it later.</p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handlers.handleSaveDraft}
                  disabled={!state.selectedPersonaId || !state.selectedOperatorId}
                  leftIcon={<ArrowDownOnSquareIcon className="w-5 h-5" />}
                  className="w-full sm:w-auto flex-shrink-0"
                >
                  Save as Content Draft
                </Button>
            </div>
        </Card>
      )}

      <SavedContentDrafts
        contentDrafts={contentDrafts}
        personas={personas}
        operators={operators}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={onDeleteContentDraft}
        onDeletePlatformContent={onDeletePlatformContent}
        onScheduleClick={(draft, platformKey, platformDetail) => handlers.setSchedulingPostInfo({ draft, platformKey, platformDetail })}
      />
      
      {state.schedulingPostInfo && ( <ScheduleModal draft={state.schedulingPostInfo.draft} platformKey={state.schedulingPostInfo.platformKey} platformDetail={state.schedulingPostInfo.platformDetail} onClose={() => handlers.setSchedulingPostInfo(null)} onSchedule={handlers.handleConfirmSchedule} showToast={showToast} /> )}
    </div>
  );
};