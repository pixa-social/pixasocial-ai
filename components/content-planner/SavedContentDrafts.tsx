
import React from 'react';
import { ContentDraft, PlatformContentDetail, Persona, Operator } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CalendarDaysIcon, TrashIcon } from '../ui/Icons';
import { CONTENT_PLATFORMS } from '../../constants';
import { PrerequisiteMessageCard } from '../ui/PrerequisiteMessageCard';

interface SavedContentDraftsProps {
  contentDrafts: ContentDraft[];
  personas: Persona[];
  operators: Operator[];
  onLoadDraft: (draft: ContentDraft) => void;
  onDeleteDraft: (draftId: string) => void;
  onDeletePlatformContent: (draftId: string, platformKey: string) => void;
  onScheduleClick: (draft: ContentDraft, platformKey: string, platformDetail: PlatformContentDetail) => void;
}

const getPlatformIcon = (platformKey: string) => {
    const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
    if (!platformInfo?.icon) return null;
    if (typeof platformInfo.icon === 'string') return <span className="mr-2 text-lg">{platformInfo.icon}</span>;
    if (React.isValidElement(platformInfo.icon)) {
        return React.cloneElement(platformInfo.icon as React.ReactElement<any>, { className: 'w-4 h-4 mr-2' });
    }
    return null;
}

export const SavedContentDrafts: React.FC<SavedContentDraftsProps> = ({
  contentDrafts,
  personas,
  operators,
  onLoadDraft,
  onDeleteDraft,
  onDeletePlatformContent,
  onScheduleClick
}) => {
  if (contentDrafts.length === 0) {
    return (
        <Card title="Saved Content Drafts" className="mt-8">
            <p className="text-textSecondary">No content drafts saved yet.</p>
        </Card>
    );
  }

  return (
    <Card title="Saved Content Drafts" className="mt-8">
      <div className="space-y-6">
        {contentDrafts.slice().sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()).map(draft => { 
          const persona = personas.find(p => p.id === draft.persona_id);
          const operator = operators.find(o => o.id === draft.operator_id);
          const platformEntries = Object.entries(draft.platform_contents).filter(([_, data]) => data);

          if (platformEntries.length === 0) return null;

          return (
            <Card key={draft.id} className="bg-card/50 p-4" shadow="soft-md">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h4 className="font-semibold text-textPrimary text-base md:text-lg">
                    To: {persona?.name || 'N/A'} | Using: {operator?.name || 'N/A'}
                  </h4>
                   <p className="text-xs text-muted-foreground">{draft.key_message || 'No key message'}</p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onLoadDraft(draft)} className="text-xs">Load Draft</Button>
                    <Button variant="destructive" size="sm" onClick={() => onDeleteDraft(draft.id)} className="text-xs" title="Delete Entire Draft">Delete</Button>
                </div>
              </div>
              <div className="space-y-3 mt-3 pt-3 border-t border-border">
                {platformEntries.map(([platformKey, platformData]) => {
                  const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
                  const content = platformData.subject ? `Subject: ${platformData.subject}` : (platformData.content || platformData.imagePrompt);

                  return (
                    <div key={platformKey} className="p-3 border border-border rounded-lg bg-background shadow-sm group">
                      <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                        <h5 className="font-medium text-textPrimary flex items-center">
                            {getPlatformIcon(platformKey)}
                            {platformInfo?.label || platformKey}:
                        </h5>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button size="sm" variant="primary" onClick={() => onScheduleClick(draft, platformKey, platformData)} className="text-xs" leftIcon={<CalendarDaysIcon className="w-3.5 h-3.5" />}>Schedule</Button>
                            <Button variant="destructive" size="sm" onClick={() => onDeletePlatformContent(draft.id, platformKey)} className="p-1.5 opacity-60 group-hover:opacity-100 transition-opacity" title="Delete this platform's content"><TrashIcon className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6 pr-2 truncate" title={content}>{content || "No text content."}</p>
                      {platformData.processedImageUrl && (
                        <div className="pl-6 mt-2">
                            <img src={platformData.processedImageUrl} alt="Processed media thumbnail" className="h-16 w-16 rounded object-cover border border-border" />
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
    </Card>
  );
};
