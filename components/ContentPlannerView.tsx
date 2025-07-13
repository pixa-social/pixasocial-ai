
import React from 'react';
import { ContentDraft, PlatformContentDetail, ViewName, UserProfile, Persona, Operator, ScheduledPost } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { CalendarDaysIcon, TrashIcon, ArrowDownOnSquareIcon } from './ui/Icons';
import { ScheduleModal } from './content-planner/ScheduleModal';
import ContentPlannerConfig from './content-planner/ContentPlannerConfig';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard'; 
import { useNavigateToView } from '../hooks/useNavigateToView'; 
import { ContentPlannerSkeleton } from './skeletons/ContentPlannerSkeleton';
import { PlatformContentCard } from './content-planner/PlatformContentCard';
import { CONTENT_PLATFORMS } from '../constants';
import { useContentPlanner } from '../hooks/useContentPlanner';
import { useToast } from './ui/ToastProvider';

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

  if (personas.length === 0 && operators.length === 0) return <ContentPlannerSkeleton />;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Multi-Platform Content Planner</h2>
      
      {showPrerequisiteMessage && <PrerequisiteMessageCard title="Prerequisites Missing" message="Please create at least one Persona and one Operator before planning content." action={prerequisiteAction} />}
      {state.error && <Card className="mb-4 bg-red-500/10 border-l-4 border-danger text-danger p-4"><p>{state.error}</p></Card>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ContentPlannerConfig 
          currentUser={currentUser} 
          personas={personas} 
          operators={operators} 
          selectedPersonaId={state.selectedPersonaId?.toString() || ''} 
          onSelectedPersonaIdChange={(id) => handlers.setSelectedPersonaId(Number(id))} 
          selectedOperatorId={state.selectedOperatorId?.toString() || ''}
          onSelectedOperatorIdChange={(id) => handlers.setSelectedOperatorId(Number(id))}
          keyMessage={state.keyMessage}
          onKeyMessageChange={handlers.setKeyMessage}
          globalMediaType={state.globalMediaType}
          onGlobalMediaTypeChange={handlers.setGlobalMediaType}
          platformMediaOverrides={state.platformMediaOverrides}
          onPlatformMediaOverridesChange={handlers.setPlatformMediaOverrides}
          selectedTone={state.selectedTone}
          onSelectedToneChange={handlers.setSelectedTone}
          customPrompt={state.customPrompt}
          onCustomPromptChange={handlers.setCustomPrompt}
          selectedPlatformsForGeneration={state.selectedPlatformsForGeneration}
          onSelectedPlatformChange={(key) => handlers.setSelectedPlatformsForGeneration(prev => ({ ...prev, [key]: !prev[key] }))}
          onGenerateAll={() => handlers.handleGenerateOrRegenerate()}
          isLoading={state.isLoading}
          isAnyPlatformSelected={state.isAnyPlatformSelectedForGeneration}
          defaultFontFamily={state.defaultFontFamily}
          onDefaultFontFamilyChange={handlers.setDefaultFontFamily}
          defaultFontColor={state.defaultFontColor}
          onDefaultFontColorChange={handlers.setDefaultFontColor}
        />
        
        <div className="md:col-span-2 space-y-6">
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

      <Card title="Saved Content Drafts" className="mt-8">
        {contentDrafts.length === 0 ? (<p className="text-textSecondary">No content drafts saved yet.</p>) : (
          <div className="space-y-6">
            {contentDrafts.slice().sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()).map(draft => { 
              const persona = personas.find(p => p.id === draft.persona_id);
              const operator = operators.find(o => o.id === draft.operator_id);
              return (
                <Card key={draft.id} className="bg-white/5 p-4" shadow="soft-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-textPrimary text-lg">To: {persona?.name || 'N/A'} | Using: {operator?.name || 'N/A'}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {}} className="text-xs">Load Draft</Button>
                        <Button variant="destructive" size="sm" onClick={() => onDeleteContentDraft(draft.id)} className="text-xs" title="Delete Entire Draft">Delete</Button>
                    </div>
                  </div>
                  <div className="space-y-4 mt-3">
                    {Object.entries(draft.platform_contents).map(([platformKey, platformData]: [string, PlatformContentDetail]) => {
                      const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
                      if (!platformData || (!platformData.content && !platformData.processedImageUrl)) return null;
                      return (
                        <div key={platformKey} className="p-3 border border-lightBorder rounded bg-card shadow-sm group">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-textPrimary flex items-center">{platformInfo?.label || platformKey}:</h5>
                            <div className="flex items-center space-x-1">
                                <Button size="sm" variant="primary" onClick={() => handlers.setSchedulingPostInfo({ draft, platformKey, platformDetail: platformData })} className="ml-2 text-xs" leftIcon={<CalendarDaysIcon className="w-3.5 h-3.5" />}>Schedule</Button>
                                <Button variant="destructive" size="sm" onClick={() => onDeletePlatformContent(draft.id, platformKey)} className="p-1 opacity-50 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></Button>
                            </div>
                          </div>
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
      {state.schedulingPostInfo && ( <ScheduleModal draft={state.schedulingPostInfo.draft} platformKey={state.schedulingPostInfo.platformKey} platformDetail={state.schedulingPostInfo.platformDetail} onClose={() => handlers.setSchedulingPostInfo(null)} onSchedule={handlers.handleConfirmSchedule} showToast={showToast} /> )}
    </div>
  );
};
