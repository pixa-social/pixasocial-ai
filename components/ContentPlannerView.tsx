import React from 'react';
import { ViewName } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ArrowDownOnSquareIcon } from './ui/Icons';
import { ScheduleModal } from './content-planner/ScheduleModal';
import ContentPlannerConfig from './content-planner/ContentPlannerConfig';
import { EmptyState } from './ui/EmptyState'; 
import { useNavigate } from 'react-router-dom';
import { ContentPlannerSkeleton } from './skeletons/ContentPlannerSkeleton';
import { PlatformContentCard } from './content-planner/PlatformContentCard';
import { CONTENT_PLATFORMS } from '../constants';
import { useContentPlanner } from '../hooks/useContentPlanner';
import { useToast } from './ui/ToastProvider';
import { SavedContentDrafts } from './content-planner/SavedContentDrafts';
import { useAppDataContext } from './MainAppLayout';
import { VIEW_PATH_MAP } from '../constants';
import { UsersIcon, BeakerIcon } from './ui/Icons';

export const ContentPlannerView: React.FC = () => {
  const { currentUser, contentDrafts, personas, operators, handlers: appDataHandlers, onNavigate } = useAppDataContext();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const propsForHook = {
    currentUser, contentDrafts, personas, operators,
    onAddContentDraft: appDataHandlers.addContentDraft,
    onAddScheduledPost: appDataHandlers.addScheduledPost,
    onAddContentLibraryAsset: appDataHandlers.addAsset,
  };
  const { state, handlers, refs } = useContentPlanner(propsForHook);
  
  let prerequisiteAction;
  let prerequisiteTitle = "Prerequisites Missing";
  let prerequisiteDescription = "Please create at least one Persona and Operator before using the Content Planner.";
  let prerequisiteIcon = <UsersIcon className="w-8 h-8 text-primary" />;

  if (personas.length === 0) {
    prerequisiteAction = { label: 'Go to Audience Modeling', onClick: () => onNavigate(ViewName.AudienceModeling) };
  } else if (operators.length === 0) {
    prerequisiteTitle = "Operator Missing";
    prerequisiteDescription = "You have personas, but you need to create at least one Operator to define your campaign's strategy.";
    prerequisiteIcon = <BeakerIcon className="w-8 h-8 text-accent" />;
    prerequisiteAction = { label: 'Go to Operator Builder', onClick: () => onNavigate(ViewName.OperatorBuilder) };
  }

  const handleLoadDraft = (draft: any) => {
    handlers.setSelectedPersonaId(draft.persona_id);
    handlers.setSelectedOperatorId(draft.operator_id);
    handlers.setKeyMessage(draft.key_message || '');
    handlers.setCustomPrompt(draft.custom_prompt || '');
    handlers.setPlatformContents(draft.platform_contents);
    const draftPlatforms = Object.keys(draft.platform_contents);
    handlers.setSelectedPlatformsForGeneration(Object.fromEntries(CONTENT_PLATFORMS.map(p => [p.key, draftPlatforms.includes(p.key)])));
    if (draft.platform_media_overrides) {
        handlers.setPlatformMediaOverrides(draft.platform_media_overrides);
        const mediaTypes = Object.values(draft.platform_media_overrides).filter((m): m is any => m !== 'global');
        const mostCommon = mediaTypes.sort((a,b) => mediaTypes.filter(v => v===a).length - mediaTypes.filter(v => v===b).length).pop();
        handlers.setGlobalMediaType(mostCommon || 'none');
    }
    showToast("Draft loaded into the configuration panel.", "success");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (personas.length === 0 && operators.length === 0) return <ContentPlannerSkeleton/>

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Content Planner</h2>
      
      {prerequisiteAction && (
        <EmptyState
          icon={prerequisiteIcon}
          title={prerequisiteTitle}
          description={prerequisiteDescription}
          action={prerequisiteAction}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ContentPlannerConfig
            currentUser={currentUser}
            personas={personas}
            operators={operators}
            state={state}
            handlers={handlers}
          />
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card title="Generated Content Preview & Edit">
            {state.isLoading && <ContentPlannerSkeleton />}
            {!state.isLoading && Object.keys(state.platformContents).length === 0 && <p className="text-muted-foreground text-center py-8">Your generated content will appear here.</p>}
            
            <div className="space-y-4">
              {Object.entries(state.platformContents).map(([key, data]) => {
                const platformInfo = CONTENT_PLATFORMS.find(p => p.key === key);
                if (!platformInfo) return null;
                return (
                  <PlatformContentCard
                    key={key}
                    platform={platformInfo}
                    platformData={data}
                    globalMediaType={state.globalMediaType}
                    isRegenerating={state.isRegeneratingPlatform[key] || false}
                    isProcessingMedia={state.isProcessingMedia[key] || false}
                    onRegenerate={handlers.handleGenerateOrRegenerate}
                    onGenerateVariant={handlers.handleGenerateVariant}
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
                );
              })}
            </div>

            {Object.keys(state.platformContents).length > 0 && (
              <div className="flex justify-end mt-6">
                <Button 
                    variant="success" 
                    size="lg" 
                    onClick={handlers.handleSaveDraft}
                    leftIcon={<ArrowDownOnSquareIcon className="w-5 h-5" />}
                >
                    Save as Content Draft
                </Button>
              </div>
            )}
          </Card>

           <SavedContentDrafts
              contentDrafts={contentDrafts}
              personas={personas}
              operators={operators}
              onLoadDraft={handleLoadDraft}
              onDeleteDraft={appDataHandlers.deleteContentDraft}
              onDeletePlatformContent={appDataHandlers.deletePlatformContent}
              onScheduleClick={(draft, platformKey, platformDetail) => handlers.setSchedulingPostInfo({ draft, platformKey, platformDetail })}
            />
        </div>
      </div>

      {state.schedulingPostInfo && (
        <ScheduleModal
          {...state.schedulingPostInfo}
          onClose={() => handlers.setSchedulingPostInfo(null)}
          onSchedule={handlers.handleConfirmSchedule}
          showToast={showToast}
        />
      )}
    </div>
  );
};