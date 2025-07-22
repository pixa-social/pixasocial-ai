import React from 'react';
import { ToolbarProps, View } from 'react-big-calendar';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, PlusCircleIcon } from '../ui/Icons';
import { CONTENT_PLATFORMS } from '../../constants';
import { ScheduledPost, ScheduledPostStatus } from '../../types';

interface CustomToolbarProps extends ToolbarProps<ScheduledPost> {
  statusFilter: ScheduledPostStatus | 'all';
  onStatusFilterChange: (status: ScheduledPostStatus | 'all') => void;
  platformFilter: string | 'all';
  onPlatformFilterChange: (platform: string | 'all') => void;
  onScheduleNew: () => void;
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Publishing', label: 'Publishing' },
  { value: 'Published', label: 'Published' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Missed', label: 'Missed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const platformOptions = [
  { value: 'all', label: 'All Platforms' },
  ...CONTENT_PLATFORMS.map(p => ({ value: p.key, label: p.label })),
];

export const CalendarToolbar: React.FC<CustomToolbarProps> = (props) => {
  const {
    onNavigate,
    onView,
    label,
    view,
    views,
    statusFilter,
    onStatusFilterChange,
    platformFilter,
    onPlatformFilterChange,
    onScheduleNew,
  } = props;

  const viewNames = Array.isArray(views) ? views : (Object.keys(views) as View[]);

  return (
    <div className="p-3 mb-4 bg-card rounded-lg border border-border flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Button onClick={() => onNavigate('PREV')} size="icon" variant="secondary" title="Previous Period"><ChevronLeftIcon className="h-5 w-5"/></Button>
        <Button onClick={() => onNavigate('TODAY')} size="sm" variant="primary">Today</Button>
        <Button onClick={() => onNavigate('NEXT')} size="icon" variant="secondary" title="Next Period"><ChevronRightIcon className="h-5 w-5"/></Button>
        <h3 className="text-xl font-semibold text-foreground ml-4 hidden lg:block">{label}</h3>
      </div>

      <div className="flex-grow grid grid-cols-2 md:flex md:flex-row md:justify-center items-center gap-2 w-full md:w-auto">
         <Select
            options={statusOptions}
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value as ScheduledPostStatus | 'all')}
            containerClassName="mb-0 w-full"
            className="text-xs"
        />
        <Select
            options={platformOptions}
            value={platformFilter}
            onChange={e => onPlatformFilterChange(e.target.value)}
            containerClassName="mb-0 w-full"
            className="text-xs"
        />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto justify-between">
        <div className="hidden md:flex items-center gap-1 bg-secondary rounded-lg p-1">
          {viewNames.map(v => (
            <Button key={v} onClick={() => onView(v)} size="sm" variant={view === v ? 'primary' : 'ghost'} className="capitalize">{v}</Button>
          ))}
        </div>
        <Button onClick={onScheduleNew} variant="secondary" size="sm" className="w-full md:w-auto" leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>
            Schedule Post
        </Button>
      </div>
    </div>
  );
};
