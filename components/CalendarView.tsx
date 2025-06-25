
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views, EventProps, ToolbarProps } from 'react-big-calendar';
import { format, getDay } from 'date-fns'; // Assuming these are correctly exported from root
import parse from 'date-fns/parse'; // Trying v1 style default import
import startOfWeek from 'date-fns/startOfWeek'; // Trying v1 style default import
import enUS from 'date-fns/locale/en-US';
import { ScheduledPost, ContentDraft, Persona, Operator, ScheduledPostStatus, PlatformContentDetail } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { CONTENT_PLATFORMS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './ui/Icons';

const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse, // Now refers to the default import
  startOfWeek, // Now refers to the default import
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

const EventDetailModal: React.FC<EventDetailModalProps> = ({ 
    event, contentDraft, platformDetail, persona, operator, 
    onClose, onUpdate, onDelete 
}) => {
  if (!event || !contentDraft || !platformDetail || !persona || !operator) return null;

  const [scheduledDate, setScheduledDate] = useState(format(event.start, "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState(event.resource.notes || '');
  const [status, setStatus] = useState<ScheduledPostStatus>(event.resource.status);

  const platformInfo = CONTENT_PLATFORMS.find(p => p.key === event.resource.platformKey);

  const handleSaveChanges = () => {
    onUpdate({ scheduledDate, notes, status });
  };
  
  const statusOptions: Array<{value: ScheduledPostStatus, label: string}> = [
      {value: 'Scheduled', label: 'Scheduled'},
      {value: 'Published', label: 'Published'},
      {value: 'Missed', label: 'Missed'},
      {value: 'Cancelled', label: 'Cancelled'},
  ];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <Card 
        title={`${typeof platformInfo?.icon === 'string' ? platformInfo?.icon : React.isValidElement(platformInfo?.icon) ? platformInfo.icon : ''} Schedule Details: ${platformInfo?.label || event.resource.platformKey}`} 
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
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3"> {/* Added pr-3 for scrollbar */}
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

          <div className="mt-3">
            <h4 className="text-sm font-semibold text-textSecondary mb-1">Content Preview:</h4>
            <div className="bg-gray-50 p-3 rounded-md border border-lightBorder max-h-48 overflow-y-auto text-sm">
                {platformDetail.subject && <p className="font-semibold text-textPrimary mb-1">Subject: {platformDetail.subject}</p>}
                <pre className="whitespace-pre-wrap text-textPrimary">{platformDetail.content}</pre>
                {platformDetail.processedImageUrl && (
                    <img src={platformDetail.processedImageUrl} alt="Processed media" className="max-w-xs w-full h-auto max-h-32 rounded my-2 border border-mediumBorder object-contain"/>
                )}
                {platformDetail.memeText && <p className="text-xs italic text-textSecondary mt-1">Meme: {platformDetail.memeText}</p>}
                {platformDetail.videoIdea && <p className="text-xs text-textSecondary mt-1">Video Idea: {platformDetail.videoIdea.substring(0,100)}...</p>}
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


export const CalendarView: React.FC<CalendarViewProps> = ({ 
    scheduledPosts, contentDrafts, personas, operators,
    onUpdateScheduledPost, onDeleteScheduledPost 
}) => {
  const [selectedEvent, setSelectedEvent] = useState<ScheduledPost | null>(null);

  const events = useMemo(() => scheduledPosts.map(post => ({
    ...post,
    start: new Date(post.start), 
    end: new Date(post.end),     
  })), [scheduledPosts]);

  const handleSelectEvent = useCallback((event: ScheduledPost) => {
    setSelectedEvent(event);
  }, []);

  const closeModal = () => {
    setSelectedEvent(null);
  };
  
  const handleUpdateEventInModal = (updatedData: { scheduledDate: string; notes: string; status: ScheduledPostStatus }) => {
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
  };

  const handleDeleteEventInModal = () => {
    if (selectedEvent) {
        onDeleteScheduledPost(selectedEvent.id);
        closeModal();
    }
  };

  const selectedEventFullDetails = useMemo(() => {
    if (!selectedEvent) return { event: null };
    const draft = contentDrafts.find(d => d.id === selectedEvent.resource.contentDraftId);
    if (!draft) return { event: selectedEvent };
    const platformDetail = draft.platformContents[selectedEvent.resource.platformKey];
    const personaDetails = personas.find(p => p.id === draft.personaId);
    const operatorDetails = operators.find(o => o.id === draft.operatorId);
    return { event: selectedEvent, contentDraft: draft, platformDetail, persona: personaDetails, operator: operatorDetails };
  }, [selectedEvent, contentDrafts, personas, operators]);

  const CustomToolbar: React.FC<ToolbarProps> = (toolbar) => {
    return (
      <div className="mb-4 p-3 flex flex-col md:flex-row justify-between items-center bg-gray-50 rounded-t-lg border-b border-lightBorder">
        <div className="flex items-center space-x-1 sm:space-x-2 mb-2 md:mb-0">
          <Button onClick={() => toolbar.onNavigate('PREV')} size="sm" variant="secondary" aria-label="Previous Period" leftIcon={<ChevronLeftIcon className="h-4 w-4"/>} />
          <Button onClick={() => toolbar.onNavigate('TODAY')} size="sm" variant="primary">Today</Button>
          <Button onClick={() => toolbar.onNavigate('NEXT')} size="sm" variant="secondary" aria-label="Next Period" rightIcon={<ChevronRightIcon className="h-4 w-4"/>} />
        </div>
        <h3 className="text-lg font-semibold text-primary order-first md:order-none mb-2 md:mb-0">
          {toolbar.label}
        </h3>
        <div className="flex space-x-1 sm:space-x-2">
          {(toolbar.views as string[]).map(view => (
            <Button
              key={view}
              onClick={() => toolbar.onView(view)}
              size="sm"
              variant={toolbar.view === view ? 'primary' : 'ghost'}
              className={`capitalize ${toolbar.view === view ? '' : 'text-textSecondary hover:text-primary'}`}
            >
              {view}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  const EventComponent: React.FC<EventProps<ScheduledPost>> = ({ event }) => {
    const platformInfo = CONTENT_PLATFORMS.find(p => p.key === event.resource.platformKey);
    let bgColor = 'bg-blue-500 hover:bg-blue-600';
    let textColor = 'text-white';
    let borderColor = 'border-blue-700';

    switch(event.resource.status) {
        case 'Published': bgColor = 'bg-green-500 hover:bg-green-600'; borderColor = 'border-green-700'; break;
        case 'Missed': bgColor = 'bg-red-500 hover:bg-red-600'; borderColor = 'border-red-700'; break;
        case 'Cancelled': bgColor = 'bg-gray-400 hover:bg-gray-500'; textColor = 'text-gray-800'; borderColor = 'border-gray-600'; break;
    }
    
    const iconDisplay = platformInfo?.icon;

    return (
        <div className={`p-1.5 rounded-md ${textColor} ${bgColor} h-full overflow-hidden transition-all duration-150 ease-in-out border-l-4 ${borderColor} cursor-pointer`}>
            <div className="flex items-center text-xs mb-0.5">
              {typeof iconDisplay === 'string' && <span className="mr-1 text-sm">{iconDisplay}</span>}
              {React.isValidElement(iconDisplay) && <span className="mr-1">{iconDisplay}</span>}
              <strong className="font-medium truncate" title={event.title}>{event.title}</strong>
            </div>
            <p className="text-xs opacity-90 capitalize">{event.resource.status}</p>
        </div>
    );
  };

  if (contentDrafts.length === 0 && scheduledPosts.length === 0) {
    return (
        <div className="p-6">
            <Card className="text-center" shadow="soft-md">
                <h2 className="text-3xl font-bold text-textPrimary mb-4">Content Calendar</h2>
                <p className="text-textSecondary text-lg">No content drafts available to schedule, and no posts currently scheduled.</p>
                <p className="text-textSecondary">Please create some content in the 'Content Planner' and save drafts first.</p>
            </Card>
        </div>
    );
  }

  return (
    <div className="p-2 md:p-4">
      <div className="bg-card shadow-soft-lg rounded-lg">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 10rem)' }} // Adjusted height
          className="p-2 md:p-4 rbc-calendar" 
          onSelectEvent={handleSelectEvent}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          components={{
              toolbar: CustomToolbar,
              event: EventComponent,
          }}
          selectable 
          popup // Enable popup for overflowing events
          dayPropGetter={(date) => {
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            return {
              className: isToday ? 'bg-blue-50 rbc-today' : 'hover:bg-gray-50', // Subtle hover for days
              style: {
                minHeight: '100px', // Ensure cells have some min height
              },
            };
          }}
          slotPropGetter={() => ({
             className: 'hover:bg-gray-50' // Subtle hover for time slots in week/day view
          })}
        />
      </div>
       <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-toolbar button { text-transform: capitalize; }
        .rbc-event { padding: 2px 5px; border-radius: 4px; border: none; }
        .rbc-agenda-date-cell, .rbc-agenda-time-cell { font-weight: 500; }
        .rbc-header { padding: 8px 5px; text-align: center; font-weight: 600; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb; }
        .rbc-today { background-color: #eff6ff !important; } /* Tailwind blue-50 */
        .rbc-day-bg:hover { background-color: #f9fafb; } /* Tailwind gray-50 */
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
