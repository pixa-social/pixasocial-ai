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

// Manually defined to break circular dependency with supabase types.
// This needs to be kept in sync with the 'role_types' table in the database.
export interface RoleType {
  id: string;
  name: RoleName;
  max_personas: number;
  max_ai_uses_monthly: number;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  created_at: string;
  updated_at: string | null;
}

// Represents the enriched User object with profile and role details
export interface UserProfile extends User {
  role: RoleType;
  ai_usage_count_monthly: number;
  assigned_ai_model_text?: string | null;
  assigned_ai_model_image?: string | null;
}

// Manually defined to break circular dependency with supabase types.
// This needs to be kept in sync with the 'admin_users_view' view in the database.
export interface AdminUserView {
  id: string | null;
  email: string | null;
  name: string | null;
  role_name: RoleName | null;
  ai_usage_count_monthly: number | null;
  assigned_ai_model_text: string | null;
  assigned_ai_model_image: string | null;
  updated_at: string | null;
}
