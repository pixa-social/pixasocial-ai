
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views, EventProps, ToolbarProps, View, DayPropGetter, SlotPropGetter, Event } from 'react-big-calendar';
import { format, getDay, isValid } from 'date-fns';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { enUS } from 'date-fns/locale/en-US';
import { ScheduledPost, ContentDraft, Persona, Operator, ScheduledPostStatus, PlatformContentDetail, ViewName } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { CONTENT_PLATFORMS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './ui/Icons';
import { CopyButton } from './ui/CopyButton';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard'; 
import { useNavigateToView } from '../hooks/useNavigateToView'; 
import { CalendarSkeleton } from './skeletons/CalendarSkeleton';

const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  scheduledPosts: ScheduledPost[];
  contentDrafts: ContentDraft[];
  personas: Persona[];
  operators: Operator[];
  onUpdateScheduledPost: (post: ScheduledPost) => void;
  onDeleteScheduledPost: (postId: string) => void;
  onNavigate?: (view: ViewName) => void; 
}

interface EventDetailModalProps {
  event: ScheduledPost | null;
  contentDraft?: ContentDraft;
  platformDetail?: PlatformContentDetail;
  persona?: Persona;
  operator?: Operator;
  onClose: () => void;
  onUpdate: (updatedEventData: { scheduledDate: string; notes: string; status: ScheduledPostStatus }) => void;
  onDelete: () => void;
}

const EventDetailModalComponent: React.FC<EventDetailModalProps> = ({ 
    event, contentDraft, platformDetail, persona, operator, 
    onClose, onUpdate, onDelete 
}) => {
  if (!event || !contentDraft || !platformDetail || !persona || !operator) return null;

  const [scheduledDate, setScheduledDate] = useState(format(event.start, "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState(event.resource.notes || '');
  const [status, setStatus] = useState<ScheduledPostStatus>(event.resource.status);

  const platformInfo = useMemo(() => CONTENT_PLATFORMS.find(p => p.key === event.resource.platformKey), [event.resource.platformKey]);

  const handleSaveChanges = useCallback(() => {
    onUpdate({ scheduledDate, notes, status });
  }, [onUpdate, scheduledDate, notes, status]);
  
  const statusOptions: Array<{value: ScheduledPostStatus, label: string}> = useMemo(() => [
      {value: 'Scheduled', label: 'Scheduled'},
      {value: 'Published', label: 'Published'},
      {value: 'Missed', label: 'Missed'},
      {value: 'Cancelled', label: 'Cancelled'},
  ], []);
  
  const combinedContentForCopy = useCallback(() => {
    let text = "";
    if (platformDetail.subject) text += `Subject: ${platformDetail.subject}\n\n`;
    if (platformDetail.content) text += `${platformDetail.content}`;
    return text.trim() || undefined;
  }, [platformDetail]);

  const modalTitleIcon = React.isValidElement(platformInfo?.icon) ? platformInfo.icon : null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <Card 
        title={`Schedule Details: ${platformInfo?.label || event.resource.platformKey}`}
        icon={modalTitleIcon}
        className="w-full max-w-lg bg-card shadow-xl rounded-lg transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-appear"
        shadow="xl"
      >
        <style>{`
          @keyframes modal-appear {
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-modal-appear {
            animation: modal-appear 0.3s forwards;
          }
        `}</style>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3"> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong className="text-textSecondary">Platform:</strong> <span className="text-textPrimary">{platformInfo?.label}</span></div>
            <div><strong className="text-textSecondary">Persona:</strong> <span className="text-textPrimary">{persona.name}</span></div>
            <div><strong className="text-textSecondary">Operator:</strong> <span className="text-textPrimary">{operator.name} ({operator.type})</span></div>
          </div>
          
          <Input 
            label="Scheduled Date & Time"
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            containerClassName="mt-1"
          />
          <Textarea
            label="Notes for this schedule"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            containerClassName="mt-1"
          />
           <Select
            label="Status"
            options={statusOptions}
            value={status}
            onChange={e => setStatus(e.target.value as ScheduledPostStatus)}
            containerClassName="mt-1"
          />

          <div className="mt-3 relative group">
            <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-semibold text-textSecondary">Content Preview:</h4>
                <CopyButton 
                    textToCopy={combinedContentForCopy()} 
                    tooltipText="Copy Subject & Content" 
                    size="xs" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    isVisible={!!combinedContentForCopy()}
                />
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-lightBorder max-h-48 overflow-y-auto text-sm">
                {platformDetail.subject && <p className="font-semibold text-textPrimary mb-1">Subject: {platformDetail.subject}</p>}
                <pre className="whitespace-pre-wrap text-textPrimary">{platformDetail.content}</pre>
                {platformDetail.processedImageUrl && (
                    <img src={platformDetail.processedImageUrl} alt="Processed media" className="max-w-xs w-full h-auto max-h-32 rounded my-2 border border-mediumBorder object-contain"/>
                )}
                {platformDetail.memeText && (
                    <div className="flex justify-between items-start mt-1">
                        <p className="text-xs italic text-textSecondary">Meme: {platformDetail.memeText}</p>
                        <CopyButton textToCopy={platformDetail.memeText} tooltipText="Copy Meme Text" size="xs" className="ml-2 shrink-0"/>
                    </div>
                )}
                {platformDetail.videoIdea && (
                    <div className="flex justify-between items-start mt-1">
                        <p className="text-xs text-textSecondary">Video Idea: {platformDetail.videoIdea.substring(0,100)}...</p>
                        <CopyButton textToCopy={platformDetail.videoIdea} tooltipText="Copy Video Idea" size="xs" className="ml-2 shrink-0"/>
                    </div>
                )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-between items-center pt-4 border-t border-lightBorder">
          <Button variant="danger" onClick={onDelete} size="sm">Unschedule Post</Button>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
            <Button variant="primary" onClick={handleSaveChanges} size="sm">Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
const EventDetailModal = React.memo(EventDetailModalComponent);


export const CalendarView: React.FC<CalendarViewProps> = ({ 
    scheduledPosts, contentDrafts, personas, operators,
    onUpdateScheduledPost, onDeleteScheduledPost, onNavigate
}) => {
  const [selectedEvent, setSelectedEvent] = useState<ScheduledPost | null>(null);
  const jumpDateInputRef = useRef<HTMLInputElement>(null);
  const navigateTo = useNavigateToView(onNavigate);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 750); 
    return () => clearTimeout(timer);
  }, []);

  const events = useMemo(() => scheduledPosts.map(post => ({
    ...post,
    start: new Date(post.start), 
    end: new Date(post.end),     
  })), [scheduledPosts]);

  const handleSelectEvent = useCallback((event: Event) => {
    setSelectedEvent(event as ScheduledPost);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);
  
  const handleUpdateEventInModal = useCallback((updatedData: { scheduledDate: string; notes: string; status: ScheduledPostStatus }) => {
    if (selectedEvent) {
        const newStartDate = new Date(updatedData.scheduledDate);
        const duration = selectedEvent.end.getTime() - selectedEvent.start.getTime();
        const newEndDate = new Date(newStartDate.getTime() + duration);

        onUpdateScheduledPost({
            ...selectedEvent,
            start: newStartDate,
            end: newEndDate,
            resource: {
                ...selectedEvent.resource,
                notes: updatedData.notes,
                status: updatedData.status,
            }
        });
        closeModal();
    }
  }, [selectedEvent, onUpdateScheduledPost, closeModal]);

  const handleDeleteEventInModal = useCallback(() => {
    if (selectedEvent) {
        onDeleteScheduledPost(selectedEvent.id);
        closeModal();
    }
  }, [selectedEvent, onDeleteScheduledPost, closeModal]);

  const selectedEventFullDetails = useMemo(() => {
    if (!selectedEvent) return { event: null };
    const draft = contentDrafts.find(d => d.id === selectedEvent.resource.contentDraftId);
    if (!draft) return { event: selectedEvent };
    const platformDetail = draft.platform_contents[selectedEvent.resource.platformKey];
    const personaDetails = personas.find(p => p.id === draft.persona_id);
    const operatorDetails = operators.find(o => o.id === draft.operator_id);
    return { event: selectedEvent, contentDraft: draft, platformDetail, persona: personaDetails, operator: operatorDetails };
  }, [selectedEvent, contentDrafts, personas, operators]);

  const CustomToolbar: React.FC<ToolbarProps> = React.memo((toolbar) => {
    const viewNames: View[] = Array.isArray(toolbar.views) ? toolbar.views : Object.keys(toolbar.views) as View[];
    
    const handleJumpToDate = useCallback(() => {
        if (jumpDateInputRef.current && jumpDateInputRef.current.value) {
            const dateValue = jumpDateInputRef.current.value;
            const [year, month, day] = dateValue.split('-').map(Number);
            const selectedDate = new Date(year, month - 1, day); 
            if (isValid(selectedDate)) {
                toolbar.onNavigate('DATE', selectedDate);
            } else {
                alert("Invalid date selected.");
            }
        }
    }, [toolbar]);

    return (
      <div className="mb-4 p-3 flex flex-col md:flex-row justify-between items-center bg-gray-50 rounded-t-lg border-b border-lightBorder">
        <div className="flex items-center space-x-1 sm:space-x-2 mb-2 md:mb-0">
          <Button onClick={() => toolbar.onNavigate('PREV')} size="sm" variant="secondary" aria-label="Previous Period" title="Previous Period" leftIcon={<ChevronLeftIcon className="h-4 h-4"/>} />
          <Button onClick={() => toolbar.onNavigate('TODAY')} size="sm" variant="primary" title="Go to Today">Today</Button>
          <Button onClick={() => toolbar.onNavigate('NEXT')} size="sm" variant="secondary" aria-label="Next Period" title="Next Period" rightIcon={<ChevronRightIcon className="h-4 h-4"/>} />
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 mb-2 md:mb-0 order-first md:order-none">
            <label htmlFor="jump-to-date-input" className="text-sm font-medium text-textSecondary flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1 text-gray-500"/> Jump to:
            </label>
            <input 
                type="date" 
                id="jump-to-date-input"
                ref={jumpDateInputRef}
                onChange={handleJumpToDate} 
                className="px-2 py-1 border border-mediumBorder rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary"
                aria-label="Jump to date"
                title="Select a date to jump to"
            />
        </div>

        <h3 className="text-lg font-semibold text-primary order-first md:order-none mb-2 md:mb-0 hidden sm:block">
          {toolbar.label}
        </h3>
        <div className="flex space-x-1 sm:space-x-2">
          {viewNames.map(view => (
            <Button
              key={view}
              onClick={() => toolbar.onView(view)}
              size="sm"
              variant={toolbar.view === view ? 'primary' : 'ghost'}
              className={`capitalize ${toolbar.view === view ? '' : 'text-textSecondary hover:text-primary'}`}
              title={`Switch to ${view} view`}
            >
              {view}
            </Button>
          ))}
        </div>
      </div>
    );
  });
  
  const EventComponent: React.FC<EventProps<ScheduledPost>> = React.memo(({ event }) => {
    const platformInfo = CONTENT_PLATFORMS.find(p => p.key === event.resource.platformKey);
    let bgColor = 'bg-blue-500 hover:bg-blue-600';
    let textColor = 'text-white';
    let borderColor = 'border-blue-700';

    switch(event.resource.status) {
        case 'Published': bgColor = 'bg-green-500 hover:bg-green-600'; borderColor = 'border-green-700'; break;
        case 'Missed': bgColor = 'bg-red-500 hover:bg-red-600'; borderColor = 'border-red-700'; break;
        case 'Cancelled': bgColor = 'bg-gray-400 hover:bg-gray-500'; textColor = 'text-gray-800'; borderColor = 'border-gray-600'; break;
    }
    
    const platformIcon = platformInfo?.icon;
    let iconDisplay = null;
    if (typeof platformIcon === 'string') {
        iconDisplay = <span className="mr-1.5 text-xs opacity-90">{platformIcon}</span>;
    } else if (React.isValidElement(platformIcon)) {
        iconDisplay = <span className="mr-1.5">{React.cloneElement(platformIcon as React.ReactElement<any>, { className: 'w-3 h-3 inline-block' })}</span>;
    }

    return (
        <div 
          className={`p-1.5 rounded ${textColor} ${bgColor} h-full overflow-hidden transition-all duration-150 ease-in-out border-l-4 ${borderColor} cursor-pointer shadow-sm hover:shadow-md`}
          title={`${platformInfo?.label}: ${event.title}\nStatus: ${event.resource.status}`}
        >
            <div className="flex items-center text-xs mb-0.5">
              {iconDisplay}
              <strong className="font-medium truncate flex-1">{event.title}</strong>
            </div>
            <p className="text-xxs opacity-90 capitalize">{event.resource.status}</p>
        </div>
    );
  });

  const showPrerequisiteMessage = contentDrafts.length === 0 && scheduledPosts.length === 0;

  const dayPropGetter = useCallback((date: Date) => {
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    return {
      className: `${isToday ? 'bg-blue-50 rbc-today' : 'hover:bg-gray-50'} transition-colors duration-150`,
      style: {
        minHeight: '100px',
      },
    };
  }, []);

  const slotPropGetter = useCallback((date: Date) => {
    return {
      className: 'hover:bg-gray-50 transition-colors duration-150',
    };
  }, []);

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="p-2 md:p-4">
      <h2 className="text-3xl font-bold text-textPrimary mb-6 ml-2 md:ml-0">Content Calendar</h2>
      {showPrerequisiteMessage && (
        <PrerequisiteMessageCard
          title="Calendar Information"
          message="No content drafts available to schedule, and no posts currently scheduled. The calendar will populate once you save drafts in the 'Content Planner' and schedule them."
          action={ onNavigate ? { label: 'Go to Content Planner', onClick: () => navigateTo(ViewName.ContentPlanner) } : undefined }
        />
      )}
      <div className="bg-card shadow-soft-lg rounded-lg p-2 md:p-4 rbc-calendar" style={{ height: 'calc(100vh - 15rem)' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          components={{
              toolbar: CustomToolbar,
              event: EventComponent,
          }}
          selectable 
          popup 
          dayPropGetter={dayPropGetter}
          slotPropGetter={slotPropGetter}
        />
      </div>
       <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-toolbar button { text-transform: capitalize; }
        .rbc-event { padding: 0; border-radius: 4px; border: none; background-color: transparent; } 
        .rbc-agenda-date-cell, .rbc-agenda-time-cell { font-weight: 500; }
        .rbc-header { padding: 8px 5px; text-align: center; font-weight: 600; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb; }
        .rbc-today { background-color: #eff6ff !important; } 
        .rbc-day-bg:hover, .rbc-time-slot:hover { background-color: #f9fafb !important; }
        .text-xxs { font-size: 0.65rem; line-height: 0.85rem; }
       `}</style>
      {selectedEventFullDetails.event && (
        <EventDetailModal
          event={selectedEventFullDetails.event}
          contentDraft={selectedEventFullDetails.contentDraft}
          platformDetail={selectedEventFullDetails.platformDetail}
          persona={selectedEventFullDetails.persona}
          operator={selectedEventFullDetails.operator}
          onClose={closeModal}
          onUpdate={handleUpdateEventInModal}
          onDelete={handleDeleteEventInModal}
        />
      )}
    </div>
  );
};
