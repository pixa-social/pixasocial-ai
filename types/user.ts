import { Database } from './supabase';
import { RoleName } from './app';

// Derived type from Supabase schema
export type RoleType = Database['public']['Tables']['role_types']['Row'];

// Represents a Supabase user, with profile data potentially merged in
export interface User {
  id: string; // Supabase user ID (UUID)
  email?: string;
  name?: string; // from user_metadata or profiles table
  walletAddress?: string | null; // from profiles table
  teamMembers?: string[]; // from profiles table
  role_name?: RoleName;
}

// Represents the enriched User object with profile and role details
export interface UserProfile extends User {
  role: RoleType;
  ai_usage_count_monthly: number;
  assigned_ai_model_text?: string | null;
  assigned_ai_model_image?: string | null;
}

// Represents a row from the admin_users_view for the Admin Panel
export interface AdminUserView {
  id: string;
  email?: string;
  name?: string;
  role_name: RoleName;
  ai_usage_count_monthly: number;
  assigned_ai_model_text?: string | null;
  assigned_ai_model_image?: string | null;
  updated_at: string;
}