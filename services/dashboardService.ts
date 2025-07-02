import { supabase } from './supabaseClient';

export interface DashboardData {
  id: string;
  user_id: string;
  personas_count: number;
  operators_count: number;
  content_drafts_count: number;
  upcoming_posts_count: number;
  connected_accounts_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches dashboard data for the authenticated user.
 * If no data exists, it creates a default record with zero counts.
 * @returns Promise with the dashboard data or null if not found or on error.
 */
export const fetchDashboardData = async (): Promise<DashboardData | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error fetching user data:', userError?.message);
      return null;
    }

    const userId = userData.user.id;
    let { data, error } = await supabase
      .from('dashboard_data')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found, create a default record
        console.log('No dashboard data found, creating default record for user:', userId);
        const defaultData = {
          user_id: userId,
          personas_count: 0,
          operators_count: 0,
          content_drafts_count: 0,
          upcoming_posts_count: 0,
          connected_accounts_count: 0
        };
        const { data: newData, error: insertError } = await supabase
          .from('dashboard_data')
          .insert(defaultData)
          .select('*')
          .single();

        if (insertError) {
          console.error('Error creating default dashboard data:', insertError.message);
          return null;
        }
        return newData as DashboardData;
      } else {
        console.error('Error fetching dashboard data:', error.message);
        return null;
      }
    }

    return data as DashboardData;
  } catch (err) {
    console.error('Unexpected error fetching dashboard data:', err);
    return null;
  }
};

/**
 * Updates dashboard data for the authenticated user.
 * If no record exists, it will be created (upsert).
 * @param updates - The fields to update or set.
 * @returns Promise with the updated dashboard data or null if update fails.
 */
export const updateDashboardData = async (updates: Partial<DashboardData>): Promise<DashboardData | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error fetching user data for update:', userError?.message);
      return null;
    }

    const updatedData = { ...updates, user_id: userData.user.id };
    const { data, error } = await supabase
      .from('dashboard_data')
      .upsert(updatedData)
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      console.error('Error updating dashboard data:', error.message);
      return null;
    }

    return data as DashboardData;
  } catch (err) {
    console.error('Unexpected error updating dashboard data:', err);
    return null;
  }
};

/**
 * Subscribes to real-time updates for dashboard data for the authenticated user.
 * @param callback - Function to call when data changes.
 * @returns Promise with subscription object to unsubscribe if needed.
 */
export const subscribeToDashboardData = async (callback: (data: DashboardData) => void): Promise<{ unsubscribe: () => void }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error fetching user data for subscription:', userError?.message);
      return { unsubscribe: () => {} };
    }

    const userId = userData.user.id;
    if (!userId) {
      console.error('User ID is empty or invalid for subscription.');
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel(`dashboard_data:user:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dashboard_data',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as DashboardData);
      })
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  } catch (err) {
    console.error('Unexpected error subscribing to dashboard data:', err);
    return { unsubscribe: () => {} };
  }
};
