
import React from 'react';
import { ContentDraft, PlatformContentDetail, Persona, Operator } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { XMarkIcon, PencilIcon, CalendarDaysIcon } from '../ui/Icons';
import { CONTENT_PLATFORMS } from '../../constants';
import { CopyButton } from '../ui/CopyButton';

interface DraftPreviewModalProps {
  draft: ContentDraft;
  platformKey: string;
  platformDetail: PlatformContentDetail;
  persona: Persona | undefined;
  operator: Operator | undefined;
  onClose: () => void;
  onEdit: () => void;
  onSchedule: () => void;
}

export const DraftPreviewModal: React.FC<DraftPreviewModalProps> = ({
  draft,
  platformKey,
  platformDetail,
  persona,
  operator,
  onClose,
  onEdit,
  onSchedule,
}) => {
  const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);

  const combinedContentForCopy = React.useCallback(() => {
    let text = "";
    if (platformDetail.subject) text += `Subject: ${platformDetail.subject}\n\n`;
    if (platformDetail.content) text += `${platformDetail.content}`;
    return text.trim() || undefined;
  }, [platformDetail]);
  
  const modalTitleIcon = React.isValidElement(platformInfo?.icon) ? platformInfo.icon : null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <Card
        title={`Preview for ${platformInfo?.label}`}
        icon={modalTitleIcon}
        className="w-full max-w-lg bg-card shadow-xl rounded-lg transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-appear"
        shadow="xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><XMarkIcon className="w-6 h-6" /></button>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong className="text-muted-foreground">Persona:</strong> <span className="text-foreground">{persona?.name || 'N/A'}</span></div>
            <div><strong className="text-muted-foreground">Operator:</strong> <span className="text-foreground">{operator?.name || 'N/A'} ({operator?.type || 'N/A'})</span></div>
          </div>

          <div className="mt-3 relative group">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-semibold text-muted-foreground">Content:</h4>
              <CopyButton
                textToCopy={combinedContentForCopy()}
                tooltipText="Copy Subject & Content"
                size="xs"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                isVisible={!!combinedContentForCopy()}
              />
            </div>
            <div className="bg-background p-3 rounded-md border border-border max-h-48 overflow-y-auto text-sm">
              {platformDetail.subject && <p className="font-semibold text-foreground mb-1">Subject: {platformDetail.subject}</p>}
              <pre className="whitespace-pre-wrap text-foreground font-sans">{platformDetail.content}</pre>
              {platformDetail.processedImageUrl && (
                <img src={platformDetail.processedImageUrl} alt="Processed media" className="max-w-xs w-full h-auto max-h-32 rounded my-2 border border-border object-contain" />
              )}
              {platformDetail.memeText && (
                <div className="flex justify-between items-start mt-1">
                  <p className="text-xs italic text-muted-foreground">Meme: {platformDetail.memeText}</p>
                  <CopyButton textToCopy={platformDetail.memeText} tooltipText="Copy Meme Text" size="xs" className="ml-2 shrink-0" />
                </div>
              )}
              {platformDetail.videoIdea && (
                <div className="flex justify-between items-start mt-1">
                  <p className="text-xs text-muted-foreground">Video Idea: {platformDetail.videoIdea.substring(0, 100)}...</p>
                  <CopyButton textToCopy={platformDetail.videoIdea} tooltipText="Copy Video Idea" size="xs" className="ml-2 shrink-0" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-between items-center pt-4 border-t border-border">
          <Button variant="outline" onClick={onEdit} size="sm" leftIcon={<PencilIcon className="w-4 h-4" />}>Edit in Planner</Button>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose} size="sm">Close</Button>
            <Button variant="primary" onClick={onSchedule} size="sm" leftIcon={<CalendarDaysIcon className="w-4 h-4" />}>Schedule Post</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
