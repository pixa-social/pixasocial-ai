import React, { useState, useEffect } from 'react';
import { ScheduledPost, ContentDraft, ScheduledPostStatus, Persona, Operator } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format, formatDistanceToNow } from 'date-fns';
import { 
    ClockIcon, PaperAirplaneIcon, TrashIcon, 
    ExclamationCircleIcon, CheckCircleIcon
} from '../ui/Icons';
import { CONTENT_PLATFORMS } from '../../constants';

interface PostCardProps {
  post: ScheduledPost;
  draft?: ContentDraft;
  persona?: Persona;
  operator?: Operator;
  onPostNow: (postId: string) => void;
  onDelete: (postId: string) => void;
  onNavigateToCalendar: () => void;
}

const getPlatformDisplay = (platformKey: string) => {
    const platformInfo = CONTENT_PLATFORMS.find(p => p.key === platformKey);
    if (!platformInfo) return { icon: null, label: platformKey };
    
    if (typeof platformInfo.icon === 'string') {
        return { icon: <span className="text-2xl">{platformInfo.icon}</span>, label: platformInfo.label };
    }
    if (React.isValidElement(platformInfo.icon)) {
        const clonedIcon = React.cloneElement(platformInfo.icon as React.ReactElement<any>, { className: 'w-6 h-6' });
        return { icon: clonedIcon, label: platformInfo.label };
    }
    return { icon: null, label: platformInfo.label };
};

const getStatusDisplay = (status: ScheduledPostStatus) => {
    switch (status) {
      case 'Scheduled':
        return { icon: <ClockIcon className="w-4 h-4 text-primary" />, text: 'Scheduled', color: 'text-primary' };
      case 'Publishing':
        return { icon: <PaperAirplaneIcon className="w-4 h-4 text-yellow-500 animate-pulse" />, text: 'Publishing...', color: 'text-yellow-500' };
      case 'Published':
        return { icon: <CheckCircleIcon className="w-4 h-4 text-success" />, text: 'Published', color: 'text-success' };
      case 'Failed':
      case 'Missed':
        return { icon: <ExclamationCircleIcon className="w-4 h-4 text-danger" />, text: status, color: 'text-danger' };
      case 'Cancelled':
          return { icon: <TrashIcon className="w-4 h-4 text-textSecondary" />, text: 'Cancelled', color: 'text-textSecondary' };
      default:
        return { icon: <ClockIcon className="w-4 h-4 text-textSecondary" />, text: status, color: 'text-textSecondary' };
    }
};

const PostCardComponent: React.FC<PostCardProps> = ({ post, draft, persona, operator, onPostNow, onDelete, onNavigateToCalendar }) => {
    const [relativeTime, setRelativeTime] = useState<string>('');

    useEffect(() => {
        const calculateRelativeTime = () => {
            const isPostInFuture = new Date(post.start) > new Date();
            setRelativeTime(
                isPostInFuture
                    ? `in ${formatDistanceToNow(new Date(post.start))}`
                    : `${formatDistanceToNow(new Date(post.start), { addSuffix: true })}`
            );
        };
        calculateRelativeTime();
        // Set an interval to update the time if needed, for this case we just need it on mount
        const interval = setInterval(calculateRelativeTime, 60000); // update every minute
        return () => clearInterval(interval);
    }, [post.start]);

    const platformDetail = draft?.platform_contents[post.resource.platformKey];
    const { icon: platformIcon, label: platformLabel } = getPlatformDisplay(post.resource.platformKey);
    const { icon: statusIcon, text: statusText, color: statusColor } = getStatusDisplay(post.resource.status);
    
    let contentPreview = "No content available.";
    if (platformDetail) {
        if (platformDetail.subject) contentPreview = `Subject: ${platformDetail.subject}`;
        else if (platformDetail.content) contentPreview = platformDetail.content;
        else if (platformDetail.imagePrompt) contentPreview = `Image: ${platformDetail.imagePrompt}`;
    }

  return (
    <Card className="p-4" shadow="soft-lg">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-12 h-12 bg-card rounded-full flex items-center justify-center border border-lightBorder" title={platformLabel}>
          {platformIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-textSecondary truncate" title={contentPreview}>
            {contentPreview}
          </p>
          <div className="text-xs text-textSecondary mt-1">
            <p>For: <span className="font-medium text-textPrimary">{persona?.name || 'N/A'}</span></p>
            <p>Using: <span className="font-medium text-textPrimary">{operator?.name || 'N/A'}</span></p>
          </div>
          
          <div className="mt-2 text-xs flex items-center space-x-3 text-textSecondary">
            <div className="flex items-center space-x-1" title={`Scheduled for ${format(post.start, 'PPpp')}`}>
              <ClockIcon className="w-3.5 h-3.5" />
              <span>{relativeTime || '...'}</span>
            </div>
             <div className={`flex items-center space-x-1 font-medium ${statusColor}`}>
                {statusIcon}
                <span>{statusText}</span>
            </div>
          </div>
        </div>
      </div>
      
      {post.resource.error_message && (
        <div className="mt-2 p-2 bg-red-500/10 border-l-4 border-danger text-red-300 text-xs rounded">
            <strong>Error:</strong> {post.resource.error_message}
        </div>
      )}

      <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-lightBorder">
        {post.resource.status === 'Scheduled' && (
            <Button size="sm" variant="secondary" onClick={() => onPostNow(post.id)}>Post Now</Button>
        )}
        {post.resource.status === 'Failed' && (
            <Button size="sm" variant="secondary" onClick={() => onPostNow(post.id)}>Retry Post</Button>
        )}
        {(post.resource.status === 'Scheduled' || post.resource.status === 'Failed') && (
            <Button size="sm" variant="ghost" onClick={onNavigateToCalendar}>Reschedule</Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onDelete(post.id)} className="text-danger hover:bg-danger/10">Delete</Button>
      </div>
    </Card>
  );
};

export const PostCard = React.memo(PostCardComponent);