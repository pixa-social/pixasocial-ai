
import React, { useState, useCallback } from 'react';
import { ContentDraft, PlatformContentDetail } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { CONTENT_PLATFORMS } from '../../constants';
import { format } from 'date-fns';

interface ScheduleModalProps {
  draft: ContentDraft;
  platformKey: string;
  platformDetail: PlatformContentDetail;
  onClose: () => void;
  onSchedule: (draftId: string, platformKey: string, scheduledDateTime: string, notes: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const ScheduleModalComponent: React.FC<ScheduleModalProps> = ({ draft, platformKey, platformDetail, onClose, onSchedule, showToast }) => {
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState<string>('');
  const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);

  const handleSubmit = useCallback(() => {
    if (!scheduledDateTime) {
      showToast("Please select a date and time to schedule.", "error");
      return;
    }
    onSchedule(draft.id, platformKey, scheduledDateTime, notes);
    onClose();
  }, [scheduledDateTime, notes, draft.id, platformKey, onSchedule, onClose, showToast]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <Card title={`Schedule Post for ${platformInfo?.label}`} className="w-full max-w-md bg-card">
        <div className="mb-4">
          <h4 className="font-semibold text-textPrimary">Content Preview:</h4>
          {platformDetail.subject && <p className="text-sm font-medium text-textPrimary">Subject: {platformDetail.subject}</p>}
          <pre className="text-sm whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-32 overflow-y-auto text-textPrimary">{platformDetail.content}</pre>
           {platformDetail.processedImageUrl && (
            <img src={platformDetail.processedImageUrl} alt="Processed media" className="mt-2 max-w-xs w-full h-auto max-h-24 rounded border border-mediumBorder object-contain"/>
          )}
        </div>
        <Input
          label="Scheduled Date & Time"
          type="datetime-local"
          value={scheduledDateTime}
          onChange={e => setScheduledDateTime(e.target.value)}
          required
        />
        <Textarea
          label="Notes (Optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g., Target specific event, follow-up to previous post."
        />
        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-lightBorder">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Confirm Schedule</Button>
        </div>
      </Card>
    </div>
  );
};

export const ScheduleModal = React.memo(ScheduleModalComponent);
