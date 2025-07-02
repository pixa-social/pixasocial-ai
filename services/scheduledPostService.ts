import { supabase } from './supabaseClient';
import { ScheduledPost } from '../types';

export const saveScheduledPost = async (post: ScheduledPost, userId: string) => {
  const { data, error } = await supabase.from('scheduled_posts').insert([
    {
      user_id: userId,
      content_draft_id: post.resource.contentDraftId,
      platform_key: post.resource.platformKey,
      title: post.title,
      start_date: post.start.toISOString(),
      end_date: post.end.toISOString(),
      all_day: post.allDay || false,
      status: post.resource.status,
      notes: post.resource.notes || '',
      persona_id: post.resource.personaId,
      operator_id: post.resource.operatorId,
    },
  ]).select();

  if (error) {
    console.error('Error saving scheduled post:', error);
    throw new Error(`Failed to save scheduled post: ${error.message}`);
  }
  return data[0];
};

export const fetchScheduledPosts = async (userId: string): Promise<ScheduledPost[]> => {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching scheduled posts:', error);
    throw new Error(`Failed to fetch scheduled posts: ${error.message}`);
  }

  return data.map(post => ({
    id: post.id,
    title: post.title,
    start: new Date(post.start_date),
    end: new Date(post.end_date),
    allDay: post.all_day,
    resource: {
      contentDraftId: post.content_draft_id,
      platformKey: post.platform_key,
      status: post.status,
      notes: post.notes,
      personaId: post.persona_id,
      operatorId: post.operator_id,
    },
  }));
};

export const updateScheduledPostStatus = async (postId: string, status: string) => {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .update({ status })
    .eq('id', postId)
    .select();

  if (error) {
    console.error('Error updating scheduled post status:', error);
    throw new Error(`Failed to update scheduled post status: ${error.message}`);
  }
  return data[0];
};
