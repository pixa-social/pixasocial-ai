import React, { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ScheduledPost, ContentDraft, Persona, Operator, ScheduledPostStatus, PlatformContentDetail } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { CONTENT_PLATFORMS } from '../../constants';
import { CopyButton } from '../ui/CopyButton';

interface EventDetailModalProps {
  event: ScheduledPost;
  contentDraft?: ContentDraft;
  persona?: Persona;
  operator?: Operator;
  onClose: () => void;
  onUpdate: (post: ScheduledPost, updates: Partial<{ start: Date; notes: string; status: ScheduledPostStatus }>) => void;
  onDelete: (postId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  contentDraft,
  persona,
  operator,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const platformDetail = useMemo(() => contentDraft?.platform_contents[event.resource.platformKey], [contentDraft, event]);

  const [scheduledDate, setScheduledDate] = useState(format(event.start, "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState(event.resource.notes || '');
  const [status, setStatus] = useState<ScheduledPostStatus>(event.resource.status);

  const platformInfo = useMemo(() => CONTENT_PLATFORMS.find(p => p.key === event.resource.platformKey), [event.resource.platformKey]);
  
  const handleSaveChanges = useCallback(() => {
    onUpdate(event, { 
        start: new Date(scheduledDate), 
        notes, 
        status 
    });
    onClose();
  }, [onUpdate, event, scheduledDate, notes, status, onClose]);
  
  const handleDelete = useCallback(() => {
    onDelete(event.id);
    onClose();
  }, [onDelete, event.id, onClose]);

  const statusOptions: Array<{value: ScheduledPostStatus, label: string}> = useMemo(() => [
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'Publishing', label: 'Publishing' },
    { value: 'Published', label: 'Published' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Missed', label: 'Missed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ], []);

  const combinedContentForCopy = useMemo(() => {
    if (!platformDetail) return '';
    let text = "";
    if (platformDetail.subject) text += `Subject: ${platformDetail.subject}\n\n`;
    if (platformDetail.content) text += `${platformDetail.content}`;
    return text.trim();
  }, [platformDetail]);

  const modalTitleIcon = React.isValidElement(platformInfo?.icon) ? platformInfo.icon : null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[1001] flex items-center justify-center p-4">
      <Card
        title={`Schedule Details: ${platformInfo?.label}`}
        icon={modalTitleIcon}
        className="w-full max-w-lg bg-card shadow-xl rounded-lg animate-modal-appear"
        shadow="xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong className="text-muted-foreground">Persona:</strong> <span className="text-foreground">{persona?.name || 'N/A'}</span></div>
            <div><strong className="text-muted-foreground">Operator:</strong> <span className="text-foreground">{operator?.name || 'N/A'}</span></div>
          </div>
          <Input label="Scheduled Date & Time" type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          <Select label="Status" options={statusOptions} value={status} onChange={e => setStatus(e.target.value as ScheduledPostStatus)} />
          {platformDetail && (
            <div className="relative group">
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Content Preview</h4>
              <CopyButton textToCopy={combinedContentForCopy} isVisible={!!combinedContentForCopy} size="xs" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100" />
              <div className="bg-background p-3 rounded-md border border-border max-h-48 overflow-y-auto text-sm">
                {platformDetail.subject && <p className="font-semibold mb-1">Subject: {platformDetail.subject}</p>}
                <pre className="whitespace-pre-wrap font-sans">{platformDetail.content}</pre>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-between items-center pt-4 border-t border-border">
          <Button variant="destructive" onClick={handleDelete} size="sm">Unschedule</Button>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
            <Button variant="primary" onClick={handleSaveChanges} size="sm">Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};