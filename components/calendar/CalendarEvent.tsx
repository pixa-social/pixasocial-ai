import React from 'react';
import { EventProps } from 'react-big-calendar';
import { ScheduledPost, ScheduledPostStatus } from '../../types';
import { CONTENT_PLATFORMS, platformColors, statusColors } from '../../constants';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, PaperAirplaneIcon, TrashIcon } from '../ui/Icons';

const getStatusIcon = (status: ScheduledPostStatus) => {
  const iconClass = "w-3 h-3";
  switch (status) {
    case 'Published': return <CheckCircleIcon className={iconClass} />;
    case 'Publishing': return <PaperAirplaneIcon className={iconClass} />;
    case 'Failed': case 'Missed': return <ExclamationCircleIcon className={iconClass} />;
    case 'Cancelled': return <TrashIcon className={iconClass} />;
    default: return <ClockIcon className={iconClass} />;
  }
};

export const CalendarEvent: React.FC<EventProps<ScheduledPost>> = ({ event }) => {
  const platformInfo = CONTENT_PLATFORMS.find(p => p.key === event.resource.platformKey);
  const colors = platformColors[platformInfo?.key || 'Default'] || platformColors.Default;
  const statusColorInfo = statusColors[event.resource.status] || statusColors.Scheduled;

  let platformIconDisplay = null;
  if (platformInfo?.icon) {
    if (typeof platformInfo.icon === 'string') {
      platformIconDisplay = <span className="mr-1.5 text-xs opacity-90">{platformInfo.icon}</span>;
    } else if (React.isValidElement(platformInfo.icon)) {
      platformIconDisplay = <span className="mr-1.5">{React.cloneElement(platformInfo.icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5 inline-block' })}</span>;
    }
  }

  return (
    <div
      className="p-1.5 rounded h-full overflow-hidden transition-all duration-150 ease-in-out cursor-pointer shadow-sm hover:shadow-md text-white"
      style={{ 
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`
      }}
      title={`${platformInfo?.label}: ${event.title}\nStatus: ${event.resource.status}`}
    >
      <div className="flex items-center text-xs font-semibold mb-0.5 truncate">
        {platformIconDisplay}
        <span className="truncate flex-1">{event.title}</span>
      </div>
      <div className={`flex items-center gap-1 text-xxs capitalize ${statusColorInfo.text}`}>
        {getStatusIcon(event.resource.status)}
        <span>{event.resource.status}</span>
      </div>
    </div>
  );
};