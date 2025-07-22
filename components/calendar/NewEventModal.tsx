import React, { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ContentDraft, Persona, Operator, PlatformContentDetail, ScheduledPost } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { CONTENT_PLATFORMS } from '../../constants';

interface NewEventModalProps {
  slotInfo: { start: Date; end: Date };
  contentDrafts: ContentDraft[];
  personas: Persona[];
  operators: Operator[];
  onClose: () => void;
  onSchedule: (post: Omit<ScheduledPost, 'id' | 'db_id' | 'title' | 'end'> & { title: string }) => void;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({
  slotInfo,
  contentDrafts,
  personas,
  operators,
  onClose,
  onSchedule,
}) => {
  const [scheduledDateTime, setScheduledDateTime] = useState(format(slotInfo.start, "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState('');
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [selectedPlatformKey, setSelectedPlatformKey] = useState<string>('');
  
  const draftOptions = useMemo(() => contentDrafts.map(d => ({
    value: d.id,
    label: `Draft for ${personas.find(p => p.id === d.persona_id)?.name || 'N/A'}`
  })), [contentDrafts, personas]);

  const selectedDraft = useMemo(() => contentDrafts.find(d => d.id === selectedDraftId), [contentDrafts, selectedDraftId]);

  const platformOptions = useMemo(() => {
    if (!selectedDraft) return [];
    return Object.keys(selectedDraft.platform_contents).map(key => ({
      value: key,
      label: CONTENT_PLATFORMS.find(p => p.key === key)?.label || key,
    }));
  }, [selectedDraft]);
  
  const platformDetail = useMemo(() => {
    if (!selectedDraft || !selectedPlatformKey) return null;
    return selectedDraft.platform_contents[selectedPlatformKey];
  }, [selectedDraft, selectedPlatformKey]);

  const handleSubmit = useCallback(() => {
    if (!selectedDraft || !selectedPlatformKey || !platformDetail) return;
    
    const title = platformDetail.subject || platformDetail.content?.substring(0,30) || 'New Post';

    onSchedule({
      title,
      start: new Date(scheduledDateTime),
      resource: {
        contentDraftId: selectedDraft.id,
        platformKey: selectedPlatformKey,
        status: 'Scheduled',
        notes,
        personaId: selectedDraft.persona_id,
        operatorId: selectedDraft.operator_id,
      }
    });
    onClose();
  }, [onSchedule, onClose, selectedDraft, selectedPlatformKey, platformDetail, scheduledDateTime, notes]);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[1001] flex items-center justify-center p-4">
      <Card title="Schedule New Post" className="w-full max-w-lg bg-card shadow-xl rounded-lg animate-modal-appear" shadow="xl">
        <div className="space-y-4">
          <Input label="Scheduled Date & Time" type="datetime-local" value={scheduledDateTime} onChange={e => setScheduledDateTime(e.target.value)} />
          <Select label="Select Content Draft" options={draftOptions} value={selectedDraftId} onChange={e => { setSelectedDraftId(e.target.value); setSelectedPlatformKey(''); }} />
          {selectedDraft && (
            <Select label="Select Platform" options={platformOptions} value={selectedPlatformKey} onChange={e => setSelectedPlatformKey(e.target.value)} />
          )}
          {platformDetail && (
            <div className="bg-background p-3 rounded-md border border-border max-h-32 overflow-y-auto text-sm">
              <pre className="whitespace-pre-wrap font-sans">{platformDetail.content}</pre>
            </div>
          )}
          <Textarea label="Notes (Optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!selectedDraft || !selectedPlatformKey}>Confirm Schedule</Button>
        </div>
      </Card>
    </div>
  );
};