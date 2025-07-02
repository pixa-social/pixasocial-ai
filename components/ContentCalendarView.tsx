import React, { useState, useEffect } from 'react';
import { ScheduledPost, ViewName } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useToast } from './ui/ToastProvider';
import { fetchScheduledPosts, saveScheduledPost } from '../services/scheduledPostService';
import { useNavigateToView } from '../hooks/useNavigateToView';
import { CalendarDaysIcon } from './ui/Icons';

interface ContentCalendarViewProps {
  scheduledPosts: ScheduledPost[];
  onAddScheduledPost: (post: ScheduledPost) => void;
  userId: string;
  onNavigate?: (view: ViewName) => void;
}

export const ContentCalendarView: React.FC<ContentCalendarViewProps> = ({
  scheduledPosts,
  onAddScheduledPost,
  userId,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>(scheduledPosts);
  const navigateTo = useNavigateToView(onNavigate);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const fetchedPosts = await fetchScheduledPosts(userId);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Failed to load scheduled posts:', error);
        showToast('Failed to load scheduled posts.', 'error');
      }
    };

    loadPosts();
  }, [userId, showToast]);

  const handleAddPost = async (post: ScheduledPost) => {
    try {
      const savedPost = await saveScheduledPost(post, userId);
      onAddScheduledPost(savedPost);
      setPosts([...posts, savedPost]);
      showToast('Post scheduled successfully!', 'success');
    } catch (error) {
      console.error('Failed to save scheduled post:', error);
      showToast('Failed to schedule post.', 'error');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Content Calendar</h2>
      <Card title="Scheduled Posts" className="mt-8">
        {posts.length === 0 ? (
          <p className="text-textSecondary">No posts scheduled yet.</p>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <Card key={post.id} className="bg-gray-50 p-4" shadow="soft-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-textPrimary text-lg">{post.title}</h4>
                    <p className="text-sm text-textSecondary">
                      Scheduled for: {post.start.toLocaleString()} - {post.end.toLocaleString()}
                    </p>
                    <p className="text-sm text-textSecondary">Status: {post.resource.status}</p>
                    {post.resource.notes && (
                      <p className="text-sm text-textSecondary">Notes: {post.resource.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateTo(ViewName.ContentPlanner)}
                    className="text-xs py-1 px-2"
                    leftIcon={<CalendarDaysIcon className="w-3.5 h-3.5" />}
                  >
                    View Planner
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
