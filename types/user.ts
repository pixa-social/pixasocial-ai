import { Database } from './supabase';
import { RoleName } from './app';

// Represents a Supabase user, with profile data potentially merged in
export interface User {
  id: string; // Supabase user ID (UUID)
  email?: string;
  name?: string; // from user_metadata or profiles table
  walletAddress?: string | null; // from profiles table
  teamMembers?: string[]; // from profiles table
  role_name?: RoleName;
}

// Derived type from Supabase schema, but with the 'name' property strongly typed to the RoleName enum
export type RoleType = Omit<Database['public']['Tables']['role_types']['Row'], 'name'> & {
  name: RoleName;
};

// Represents the enriched User object with profile and role details
export interface UserProfile extends User {
  role: RoleType;
  ai_usage_count_monthly: number;
  assigned_ai_model_text?: string | null;
  assigned_ai_model_image?: string | null;
}

// Represents a row from the admin_users_view for the Admin Panel, also with a strongly typed role_name
export type AdminUserView = Omit<Database['public']['Views']['admin_users_view']['Row'], 'role_name'> & {
  role_name: RoleName | null;
};
