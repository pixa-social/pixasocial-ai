import { useState, useEffect } from 'react';
import { ScheduledPost } from '../types';
import { fetchScheduledPosts } from '../services/scheduledPostService';

export const useScheduledPosts = (userId: string) => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const posts = await fetchScheduledPosts(userId);
        setScheduledPosts(posts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scheduled posts.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [userId]);

  return { scheduledPosts, loading, error };
};
