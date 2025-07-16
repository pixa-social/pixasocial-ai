
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ContentDraft, PlatformContentDetail, Persona, Operator } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui/Accordion';
import { CalendarDaysIcon, TrashIcon, SearchIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '../ui/Icons';
import { CONTENT_PLATFORMS } from '../../constants';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPersonaId, setFilterPersonaId] = useState('');
  const [filterOperatorId, setFilterOperatorId] = useState('');

  const personaOptions = useMemo(() => [{ value: '', label: 'All Personas' }, ...personas.map(p => ({ value: p.id.toString(), label: p.name }))], [personas]);
  const operatorOptions = useMemo(() => [{ value: '', label: 'All Operators' }, ...operators.map(o => ({ value: o.id.toString(), label: o.name }))], [operators]);

  const filteredDrafts = useMemo(() => {
    return contentDrafts.filter(draft => {
        const persona = personas.find(p => p.id === draft.persona_id);
        const operator = operators.find(o => o.id === draft.operator_id);

        const searchMatch = !searchTerm ||
            (draft.key_message && draft.key_message.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (persona && persona.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (operator && operator.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const personaMatch = !filterPersonaId || draft.persona_id === Number(filterPersonaId);
        const operatorMatch = !filterOperatorId || draft.operator_id === Number(filterOperatorId);

        return searchMatch && personaMatch && operatorMatch;
    }).sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }, [contentDrafts, searchTerm, filterPersonaId, filterOperatorId, personas, operators]);

  if (contentDrafts.length === 0) {
    return (
        <Card title="Saved Content Drafts" className="mt-8">
            <p className="text-textSecondary">No content drafts saved yet.</p>
        </Card>
    );
  }

  return (
    <Card title="Saved Content Drafts" className="mt-8">
      <div className="mb-4 p-4 border border-border rounded-lg bg-card/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Input
                  label="Search Drafts"
                  placeholder="Search by message, persona, operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<SearchIcon className="w-4 h-4 text-gray-400" />}
                  rightIcon={searchTerm && <button onClick={() => setSearchTerm('')} className="cursor-pointer"><XMarkIcon className="w-4 h-4 text-gray-500" /></button>}
                  containerClassName="mb-0"
              />
              <Select label="Filter by Persona" options={personaOptions} value={filterPersonaId} onChange={(e) => setFilterPersonaId(e.target.value)} containerClassName="mb-0"/>
              <Select label="Filter by Operator" options={operatorOptions} value={filterOperatorId} onChange={(e) => setFilterOperatorId(e.target.value)} containerClassName="mb-0"/>
          </div>
      </div>
      
      {filteredDrafts.length > 0 ? (
        <Accordion type="single" className="w-full space-y-2">
            {filteredDrafts.map(draft => {
                const persona = personas.find(p => p.id === draft.persona_id);
                const operator = operators.find(o => o.id === draft.operator_id);
                const platformCount = Object.keys(draft.platform_contents).length;

                return (
                    <AccordionItem key={draft.id} value={draft.id} className="bg-card/50 rounded-lg px-4 border border-border/50">
                        <AccordionTrigger>
                            <div className="grid grid-cols-12 gap-4 text-left w-full items-center">
                                <div className="col-span-12 md:col-span-5">
                                    <p className="font-semibold text-foreground truncate" title={draft.key_message || 'Draft'}>{draft.key_message || 'Untitled Draft'}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(draft.created_at), 'PPp')}</p>
                                </div>
                                <p className="col-span-6 md:col-span-3 text-sm text-muted-foreground truncate">To: <span className="text-foreground">{persona?.name || 'N/A'}</span></p>
                                <p className="col-span-6 md:col-span-2 text-sm text-muted-foreground truncate">Op: <span className="text-foreground">{operator?.name || 'N/A'}</span></p>
                                <p className="col-span-12 md:col-span-2 text-sm text-muted-foreground md:text-right">{platformCount} Platform(s)</p>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pt-2 border-t border-border">
                                {Object.entries(draft.platform_contents).map(([platformKey, platformData]) => {
                                    const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
                                    const content = platformData.subject ? `Subject: ${platformData.subject}` : (platformData.content || platformData.imagePrompt);
                                    return (
                                        <div key={platformKey} className="p-3 border border-border/50 rounded-lg bg-background group flex items-start justify-between gap-4">
                                            <div className="flex-grow">
                                                <h5 className="font-medium text-foreground flex items-center">{getPlatformIcon(platformKey)} {platformInfo?.label || platformKey}</h5>
                                                <p className="text-sm text-muted-foreground pl-6 pr-2 truncate" title={content}>{content || "No text content."}</p>
                                            </div>
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                <Button size="sm" variant="secondary" onClick={() => onScheduleClick(draft, platformKey, platformData)} className="text-xs" leftIcon={<CalendarDaysIcon className="w-3.5 h-3.5" />}>Schedule</Button>
                                                <Button variant="ghost" size="icon" onClick={() => onDeletePlatformContent(draft.id, platformKey)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Delete this platform's content"><TrashIcon className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                 <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-border">
                                    <Button variant="outline" size="sm" onClick={() => onLoadDraft(draft)}>Edit Draft</Button>
                                    <Button variant="destructive" size="sm" onClick={() => onDeleteDraft(draft.id)} leftIcon={<TrashIcon className="w-4 h-4"/>}>Delete Entire Draft</Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
            <p>No drafts found matching your criteria.</p>
        </div>
      )}
    </Card>
  );
};
