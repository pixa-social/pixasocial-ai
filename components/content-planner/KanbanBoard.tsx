
import React, { useState, useMemo } from 'react';
import { ContentDraft, Persona, Operator, KanbanStatus, PlatformContentDetail } from '../../types';
import { Database } from '../../types/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CalendarDaysIcon, PlusIcon, TagIcon } from '../ui/Icons';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

// --- PROPS ---
interface KanbanBoardProps {
  drafts: ContentDraft[];
  personas: Persona[];
  operators: Operator[];
  onUpdateDraft: (draftId: string, updates: Database['public']['Tables']['content_drafts']['Update']) => void;
  onScheduleClick: (draft: ContentDraft, platformKey: string, platformDetail: PlatformContentDetail) => void;
  onPreviewDraft?: (draft: ContentDraft) => void;
}

const KANBAN_COLUMNS: { title: KanbanStatus; color: string }[] = [
    { title: 'Draft', color: 'bg-gray-500' },
    { title: 'For Review', color: 'bg-yellow-500' },
    { title: 'Approved', color: 'bg-blue-500' },
    { title: 'Scheduled', color: 'bg-green-500' },
];

// --- KANBAN CARD ---
const KanbanCard: React.FC<{
    draft: ContentDraft;
    persona?: Persona;
    operator?: Operator;
    onUpdateDraft: KanbanBoardProps['onUpdateDraft'];
    onScheduleClick: KanbanBoardProps['onScheduleClick'];
    onPreview: () => void;
}> = ({ draft, persona, operator, onUpdateDraft, onScheduleClick, onPreview }) => {
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [tagInput, setTagInput] = useState((draft.tags || []).join(', '));

    const handleTagEdit = () => {
        const newTags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
        onUpdateDraft(draft.id, { tags: newTags });
        setIsEditingTags(false);
    };

    return (
        <div
            draggable
            onDragStart={(e) => e.dataTransfer.setData('draftId', draft.id)}
            onClick={onPreview}
            className="p-3 bg-card border border-border rounded-lg shadow-sm cursor-pointer hover:border-primary active:cursor-grabbing mb-3 transition-colors"
        >
            <p className="font-semibold text-sm text-foreground mb-2">{draft.title || 'Untitled Draft'}</p>
            <div className="text-xs text-muted-foreground space-y-1 mb-2">
                <p><strong>To:</strong> {persona?.name || 'N/A'}</p>
                <p><strong>Op:</strong> {operator?.name || 'N/A'}</p>
            </div>
            <div className="mb-2">
                {isEditingTags ? (
                    <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onBlur={handleTagEdit}
                        onKeyDown={(e) => e.key === 'Enter' && handleTagEdit()}
                        placeholder="tag1, tag2"
                        autoFocus
                        containerClassName="mb-0"
                        className="h-8 text-xs"
                    />
                ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {(draft.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setIsEditingTags(true); }}>
                            <PlusIcon className="w-3 h-3 text-muted-foreground" />
                        </Button>
                    </div>
                )}
            </div>
             {draft.status === 'Approved' && (
                <Button 
                    variant="outline" 
                    size="xs" 
                    className="w-full mt-2" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onScheduleClick(draft, Object.keys(draft.platform_contents)[0], Object.values(draft.platform_contents)[0]);
                    }}
                    leftIcon={<CalendarDaysIcon className="w-3.5 h-3.5"/>}
                >
                    Schedule
                </Button>
            )}
        </div>
    );
};

// --- KANBAN BOARD ---
export const KanbanBoard: React.FC<KanbanBoardProps> = ({ drafts, personas, operators, onUpdateDraft, onScheduleClick, onPreviewDraft }) => {
    const draftsByStatus = useMemo(() => {
        const grouped: Record<KanbanStatus, ContentDraft[]> = { 'Draft': [], 'For Review': [], 'Approved': [], 'Scheduled': [] };
        drafts.forEach(draft => {
            const status = draft.status || 'Draft';
            if (grouped[status]) {
                grouped[status].push(draft);
            }
        });
        return grouped;
    }, [drafts]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: KanbanStatus) => {
        e.preventDefault();
        const draftId = e.dataTransfer.getData('draftId');
        const draft = drafts.find(d => d.id === draftId);
        if (draft && draft.status !== newStatus) {
            onUpdateDraft(draftId, { status: newStatus });
        }
    };
    
    return (
        <div className="flex gap-4 overflow-x-auto p-1">
            {KANBAN_COLUMNS.map(column => (
                <div
                    key={column.title}
                    className="w-72 flex-shrink-0 bg-background rounded-xl"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.title)}
                >
                    <div className="p-3 sticky top-0 bg-background z-10">
                        <div className="flex items-center gap-2">
                            <span className={cn("w-3 h-3 rounded-full", column.color)}></span>
                            <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
                            <span className="text-sm font-mono text-muted-foreground">{draftsByStatus[column.title].length}</span>
                        </div>
                    </div>
                    <div className="p-3 pt-0 h-[60vh] overflow-y-auto">
                        {draftsByStatus[column.title].map(draft => {
                            const persona = personas.find(p => p.id === draft.persona_id);
                            const operator = operators.find(o => o.id === draft.operator_id);
                            return (
                                <KanbanCard
                                    key={draft.id}
                                    draft={draft}
                                    persona={persona}
                                    operator={operator}
                                    onUpdateDraft={onUpdateDraft}
                                    onScheduleClick={onScheduleClick}
                                    onPreview={() => onPreviewDraft && onPreviewDraft(draft)}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};