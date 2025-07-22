import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar';
import dnd from 'react-big-calendar/lib/addons/dragAndDrop';
import { format } from 'date-fns/format';
import { getDay } from 'date-fns/getDay';
import { parse as fnsParse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { enUS } from 'date-fns/locale/en-US';
import { ScheduledPost, ViewName, ScheduledPostStatus } from '../types';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard';
import { CalendarSkeleton } from './skeletons/CalendarSkeleton';
import { useAppDataContext } from './MainAppLayout';
import { EventDetailModal } from './calendar/EventDetailModal';
import { NewEventModal } from './calendar/NewEventModal';
import { CalendarToolbar } from './calendar/CalendarToolbar';
import { CalendarEvent } from './calendar/CalendarEvent';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse: (dateStr, formatStr, locale) => fnsParse(dateStr, formatStr, new Date(), { locale }),
  startOfWeek,
  getDay,
  locales,
});

// The default export from 'react-big-calendar/lib/addons/dragAndDrop' can be inconsistent with esm.sh.
// This handles cases where the default export is an object containing another 'default' property (CJS/ESM interop),
// or if the default export is the function itself.
const withDragAndDrop = (dnd as any).default || dnd;
const DnDCalendar = withDragAndDrop(BigCalendar);

export const CalendarView: React.FC = () => {
  const { scheduledPosts, contentDrafts, personas, operators, handlers, onNavigate } = useAppDataContext();
  const { updateScheduledPost, deleteScheduledPost, addScheduledPost } = handlers;

  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledPost | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<ScheduledPostStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<string | 'all'>('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const events = useMemo(() => scheduledPosts.map(post => ({
    ...post,
    start: new Date(post.start),
    end: new Date(post.end),
  })), [scheduledPosts]);
  
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
        const statusMatch = statusFilter === 'all' || event.resource.status === statusFilter;
        const platformMatch = platformFilter === 'all' || event.resource.platformKey === platformFilter;
        return statusMatch && platformMatch;
    });
  }, [events, statusFilter, platformFilter]);

  const onEventDrop = useCallback(({ event, start, end }: { event: ScheduledPost, start: Date, end: Date }) => {
    updateScheduledPost(event, { start, end });
  }, [updateScheduledPost]);

  const handleSelectEvent = useCallback((event: ScheduledPost) => {
    setSelectedEvent(event);
  }, []);

  const handleSelectSlot = useCallback((slot: SlotInfo) => {
    setSlotInfo(slot);
    setIsNewEventModalOpen(true);
  }, []);

  const handleUpdateEventInModal = useCallback((post: ScheduledPost, updates: Partial<{ start: Date; notes: string; status: ScheduledPostStatus }>) => {
    updateScheduledPost(post, updates);
  }, [updateScheduledPost]);

  const handleDeleteEventInModal = useCallback((postId: string) => {
    deleteScheduledPost(postId);
  }, [deleteScheduledPost]);

  const handleScheduleNewEvent = useCallback((post: Omit<ScheduledPost, 'id' | 'db_id' | 'title' | 'end'> & { title: string }) => {
    addScheduledPost(post);
  }, [addScheduledPost]);

  const selectedEventDetails = useMemo(() => {
    if (!selectedEvent) return null;
    const draft = contentDrafts.find(d => d.id === selectedEvent.resource.contentDraftId);
    if (!draft) return { event: selectedEvent };
    const persona = personas.find(p => p.id === draft.persona_id);
    const operator = operators.find(o => o.id === draft.operator_id);
    return { event: selectedEvent, contentDraft: draft, persona, operator };
  }, [selectedEvent, contentDrafts, personas, operators]);

  if (isLoading) {
    return <CalendarSkeleton />;
  }
  if (contentDrafts.length === 0) {
    return <PrerequisiteMessageCard title="Create Content to Schedule" message="Please create at least one content draft in the Content Planner before using the calendar." action={{ label: 'Go to Content Planner', onClick: () => onNavigate(ViewName.ContentPlanner) }} />;
  }

  return (
    <>
      <div className="h-[calc(100vh-12rem)]">
        <DnDCalendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          defaultView={Views.MONTH}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={onEventDrop}
          resizable
          onEventResize={onEventDrop} // Same logic as dropping
          components={{
            toolbar: (toolbarProps) => (
                <CalendarToolbar
                    {...toolbarProps}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    platformFilter={platformFilter}
                    onPlatformFilterChange={setPlatformFilter}
                    onScheduleNew={() => setIsNewEventModalOpen(true)}
                />
            ),
            event: CalendarEvent
          }}
        />
      </div>
      
      {selectedEventDetails && (
        <EventDetailModal
            {...selectedEventDetails}
            onClose={() => setSelectedEvent(null)}
            onUpdate={handleUpdateEventInModal}
            onDelete={handleDeleteEventInModal}
        />
      )}
      
      {isNewEventModalOpen && (
        <NewEventModal
            slotInfo={slotInfo || { start: new Date(), end: new Date() }}
            contentDrafts={contentDrafts}
            personas={personas}
            operators={operators}
            onClose={() => setIsNewEventModalOpen(false)}
            onSchedule={handleScheduleNewEvent}
        />
      )}
    </>
  );
};