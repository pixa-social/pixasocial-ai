

import React from 'react';

export enum ViewName {
  Dashboard = 'Dashboard',
  AudienceModeling = 'Audience Modeling',
  Analytics = 'Analytics',
  OperatorBuilder = 'Operator Builder',
  ContentPlanner = 'Content Planner',
  FeedbackSimulator = 'Feedback Simulator',
  AuditTool = 'Audit Tool',
  Methodology = 'Methodology',
  AdminPanel = 'Admin Panel',
  Calendar = 'Calendar',
  Settings = 'Settings', 
  DataAnalyzer = 'Data Analyzer',
  ContentLibrary = 'Content Library',
  TeamChat = 'Team Chat',
  SocialPoster = 'Social Poster',
}

// For pages within the authentication flow (before user is logged in)
export type AuthViewType = 'home' | 'login' | 'register' | 'features' | 'pricing' | 'documentation' | 'about' | 'contact' | 'privacy' | 'terms';

export enum RoleName {
    Free = 'Free',
    Essentials = 'Essentials',
    Team = 'Team',
    Enterprise = 'Enterprise',
    Admin = 'Admin',
}

// Derived type from Supabase schema
export type RoleType = Database['public']['Tables']['role_types']['Row'];

// Represents the enriched User object with profile and role details
export interface UserProfile extends User {
  role: RoleType;
  ai_usage_count_monthly: number;
  assigned_ai_model_text?: string | null;
  assigned_ai_model_image?: string | null;
}

// Represents a Supabase user, with profile data potentially merged in
export interface User {
  id: string; // Supabase user ID (UUID)
  email?: string;
  name?: string; // from user_metadata or profiles table
  walletAddress?: string | null; // from profiles table
  teamMembers?: string[]; // from profiles table
  role_name?: RoleName;
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


export interface NavItem {
  label: string;
  viewName?: ViewName;
  icon?: React.ReactNode;
  children?: NavItem[];
  isAdminOnly?: boolean;
}

export type RSTTraitLevel = 'Not Assessed' | 'Low' | 'Medium' | 'High';

export interface RSTProfile {
  bas: RSTTraitLevel; // Behavioral Approach System
  bis: RSTTraitLevel; // Behavioral Inhibition System
  fffs: RSTTraitLevel; // Fight-Flight-Freeze System
}

// Derived type from Supabase schema
export type Persona = Database['public']['Tables']['personas']['Row'];

// Represents a persona from the imported library (Nemotron-style)
// Derived type from Supabase schema
export type LibraryPersona = Database['public']['Tables']['persona_library']['Row'];

// Derived type from Supabase schema
export type Operator = Database['public']['Tables']['operators']['Row'];

export type MediaType = 'none' | 'image' | 'video';
export type ImageSourceType = 'generate' | 'upload' | 'library';

export interface PlatformContentDetail {
  content: string;
  hashtags: string[];
  mediaType: MediaType;
  subject?: string; 

  imageSourceType?: ImageSourceType; 
  imagePrompt?: string; 
  uploadedImageBase64?: string;
  libraryAssetId?: string; // Changed to string for uuid
  memeText?: string;
  processedImageUrl?: string; 

  videoIdea?: string;

  fontFamily?: string;
  fontColor?: string; 
  aiSuggestedFontCategory?: string;
}

export type PlatformContentMap = Record<string, PlatformContentDetail>;

export interface ContentDraft {
  id: string;
  user_id: string;
  operator_id: number;
  persona_id: number;
  key_message: string | null;
  custom_prompt: string;
  platform_contents: PlatformContentMap;
  platform_media_overrides: Record<string, MediaType | 'global'> | null;
  created_at: string;
  updated_at: string | null;
}

export interface FeedbackSimulationResult {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  engagementForecast: 'Low' | 'Medium' | 'High';
  potentialRisks?: string[];
}

export interface OceanScores {
    creativity: number;
    organization: number;
    sociability: number;
    kindness: number;
    emotionalStability: number;
}

export interface AIPersonaAnalysis {
  explanation: string;
  strategy: string;
}

export interface AIOceanResponse {
  oceanScores: OceanScores;
  analysis: AIPersonaAnalysis;
}

export interface AIComparisonResponse {
  persona1Scores: OceanScores;
  persona2Scores: OceanScores;
  comparisonText: string;
}

export interface AuditStep {
  id: string;
  title: string;
  description: string;
  content?: string;
  isCompleted: boolean;
  riskAlerts?: string[];
}

export enum AiProviderType {
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  Anthropic = 'Anthropic',
  Groq = 'Groq',
  Deepseek = 'Deepseek',
  Qwen = 'Qwen',
  Openrouter = 'Openrouter',
  MistralAI = 'MistralAI',
  NovitaAI = 'NovitaAI',
  Placeholder = 'Placeholder (Not Implemented)',
}

export interface AiProviderModelSet {
  text: string[];
  image?: string[];
  chat?: string[];
}
export interface AiProviderConfig {
  id: AiProviderType;
  name: string;
  api_key: string | null; 
  is_enabled: boolean;
  models: AiProviderModelSet;
  notes?: string;
  base_url?: string;
  updated_at?: string;
}

export type AiProviderConfigForExport = Omit<AiProviderConfig, 'api_key'> & { apiKey?: null };


export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string;
    title?: string;
  };
}

export type ScheduledPostStatus = 'Scheduled' | 'Publishing' | 'Published' | 'Failed' | 'Missed' | 'Cancelled';

export interface ScheduledPostResource {
  contentDraftId: string;
  platformKey: string;
  status: ScheduledPostStatus;
  notes?: string;
  personaId: number;
  operatorId: number;
  last_attempted_at?: string;
  error_message?: string;
}

export interface ScheduledPost {
  id: string; 
  db_id: number;
  title: string;
  start: Date; 
  end: Date;   
  allDay?: boolean;
  resource: ScheduledPostResource;
}

// Derived type from Supabase schema
export type ScheduledPostDbRow = Database['public']['Tables']['scheduled_posts']['Row'];

export enum SocialPlatformType {
  X = 'X', 
  Facebook = 'Facebook',
  Instagram = 'Instagram',
  LinkedIn = 'LinkedIn',
  Pinterest = 'Pinterest',
  TikTok = 'TikTok',
  YouTube = 'YouTube',
  Telegram = 'Telegram',
  Bluesky = 'Bluesky',
  GoogleBusiness = 'GoogleBusiness',
  Threads = 'Threads',
  Discord = 'Discord',
  Reddit = 'Reddit',
  Snapchat = 'Snapchat',
}

// Derived type from Supabase schema
export type ConnectedAccount = Database['public']['Tables']['connected_accounts']['Row'];

// For the detailed connection flow modal
export interface ConnectionOption {
  type: string;
  title: string;
  description: string;
  features: string[];
  recommended?: boolean;
  warning?: string;
  // This would be the actual auth URL in a real implementation
  authUrl?: string; 
}

export interface SocialPlatformConnectionDetails {
  id: SocialPlatformType;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  description: string;
  brandColor?: string;
  connectionOptions: ConnectionOption[];
}

// Derived type from Supabase schema, with added publicUrl property for client-side use
export type ContentLibraryAsset = Database['public']['Tables']['content_library_assets']['Row'] & {
  publicUrl?: string;
};

export interface ChatMessageAttachment {
  name: string;
  type: string; 
  size: number; 
  publicUrl: string; 
}

export interface ChatMessage {
  id: string; // Client-side generated, hence string
  channel_id: string;
  user_id: string;
  sender_name: string; 
  created_at: string; 
  updated_at?: string; // For message edits
  text?: string;
  attachment?: ChatMessageAttachment;
  isEditing?: boolean; // Client-side flag
}

export interface CustomChannel {
  id: string; // Client-side generated, hence string
  uuid: string;
  name: string; 
  created_by: string;
  created_at: string; 
}

export interface AISuggestionRequest {
  prompt: string;
  context?: string;
}

export interface AIParsedJsonResponse<T> {
  data: T | null;
  error?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export interface ToastContextType {
  showToast: (message: string, type: ToastMessage['type'], duration?: number) => void;
}


// --- Supabase Schema Definition ---

// Simplified Json type to avoid "type instantiation is excessively deep" errors with Supabase client.
// This is a pragmatic fix for a common TS/compiler issue with complex recursive types.
export type Json = any;

export interface Database {
  public: {
    Tables: {
      app_global_settings: {
        Row: {
          id: number;
          active_ai_provider: string;
          global_default_text_model: string | null;
          global_default_image_model: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          active_ai_provider?: string;
          global_default_text_model?: string | null;
          global_default_image_model?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          active_ai_provider?: string;
          global_default_text_model?: string | null;
          global_default_image_model?: string | null;
          updated_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          wallet_address: string | null;
          team_members: string[] | null;
          ai_usage_count_monthly: number;
          assigned_ai_model_text: string | null;
          assigned_ai_model_image: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name?: string | null;
          wallet_address?: string | null;
          team_members?: string[] | null;
          ai_usage_count_monthly?: number;
          assigned_ai_model_text?: string | null;
          assigned_ai_model_image?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          wallet_address?: string | null;
          team_members?: string[] | null;
          ai_usage_count_monthly?: number;
          assigned_ai_model_text?: string | null;
          assigned_ai_model_image?: string | null;
          updated_at?: string | null;
        };
      };
      user_roles: {
        Row: {
          id: number;
          user_id: string;
          role_id: string;
          assigned_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          role_id: string;
          assigned_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          role_id?: string;
          assigned_at?: string;
        };
      };
      ai_provider_global_configs: {
        Row: {
          id: AiProviderType;
          name: string;
          api_key: string | null;
          is_enabled: boolean;
          models: Json;
          notes: string | null;
          base_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: AiProviderType;
          name: string;
          api_key?: string | null;
          is_enabled?: boolean;
          models: Json;
          notes?: string | null;
          base_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: AiProviderType;
          name?: string;
          api_key?: string | null;
          is_enabled?: boolean;
          models?: Json;
          notes?: string | null;
          base_url?: string | null;
          updated_at?: string | null;
        };
      };
      personas: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          demographics: string | null;
          psychographics: string | null;
          initial_beliefs: string | null;
          vulnerabilities: string[] | null;
          avatar_url: string | null;
          rst_profile: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          name: string;
          demographics?: string | null;
          psychographics?: string | null;
          initial_beliefs?: string | null;
          vulnerabilities?: string[] | null;
          avatar_url?: string | null;
          rst_profile?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string;
          demographics?: string | null;
          psychographics?: string | null;
          initial_beliefs?: string | null;
          vulnerabilities?: string[] | null;
          avatar_url?: string | null;
          rst_profile?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      operators: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          target_audience_id: number;
          type: 'Hope' | 'Fear' | 'Belonging' | 'Exclusivity' | 'Curiosity' | 'Authority' | 'Novelty' | 'Pride' | 'Nostalgia' | 'Convenience' | 'Custom';
          conditioned_stimulus: string;
          unconditioned_stimulus:string;
          desired_conditioned_response: string;
          reinforcement_loop: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          name: string;
          target_audience_id: number;
          type: 'Hope' | 'Fear' | 'Belonging' | 'Exclusivity' | 'Curiosity' | 'Authority' | 'Novelty' | 'Pride' | 'Nostalgia' | 'Convenience' | 'Custom';
          conditioned_stimulus: string;
          unconditioned_stimulus:string;
          desired_conditioned_response: string;
          reinforcement_loop: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string;
          target_audience_id?: number;
          type?: 'Hope' | 'Fear' | 'Belonging' | 'Exclusivity' | 'Curiosity' | 'Authority' | 'Novelty' | 'Pride' | 'Nostalgia' | 'Convenience' | 'Custom';
          conditioned_stimulus?: string;
          unconditioned_stimulus?:string;
          desired_conditioned_response?: string;
          reinforcement_loop?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      content_drafts: {
        Row: {
          id: string;
          user_id: string;
          operator_id: number;
          persona_id: number;
          key_message: string | null;
          custom_prompt: string;
          platform_contents: Json;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          operator_id: number;
          persona_id: number;
          key_message?: string | null;
          custom_prompt: string;
          platform_contents: Json;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          operator_id?: number;
          persona_id?: number;
          key_message?: string | null;
          custom_prompt?: string;
          platform_contents?: Json;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      content_library_assets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'image' | 'video';
          storage_path: string;
          file_name: string;
          file_type: string;
          size: number;
          tags: string[] | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'image' | 'video';
          storage_path: string;
          file_name: string;
          file_type: string;
          size: number;
          tags?: string[] | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'image' | 'video';
          storage_path?: string;
          file_name?: string;
          file_type?: string;
          size?: number;
          tags?: string[] | null;
          uploaded_at?: string;
        };
      };
      scheduled_posts: {
        Row: {
          id: number;
          user_id: string;
          content_draft_id: string;
          platform_key: string;
          status: ScheduledPostStatus;
          notes: string | null;
          scheduled_at: string; // ISO string
          error_message: string | null;
          last_attempted_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          content_draft_id: string;
          platform_key: string;
          status?: ScheduledPostStatus;
          notes?: string | null;
          scheduled_at: string;
          error_message?: string | null;
          last_attempted_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          content_draft_id?: string;
          platform_key?: string;
          status?: ScheduledPostStatus;
          notes?: string | null;
          scheduled_at?: string;
          error_message?: string | null;
          last_attempted_at?: string | null;
        };
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: SocialPlatformType;
          accountid: string;
          accountname: string | null;
          accesstoken: string | null;
          tokenexpiry: string | null;
          refreshtoken: string | null;
          created_at: string | null;
          encrypted_bot_token: string | null;
          channel_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: SocialPlatformType;
          accountid: string;
          accountname?: string | null;
          accesstoken?: string | null;
          tokenexpiry?: string | null;
          refreshtoken?: string | null;
          created_at?: string | null;
          encrypted_bot_token?: string | null;
          channel_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: SocialPlatformType;
          accountid?: string;
          accountname?: string | null;
          accesstoken?: string | null;
          tokenexpiry?: string | null;
          refreshtoken?: string | null;
          created_at?: string | null;
          encrypted_bot_token?: string | null;
          channel_id?: string | null;
        };
      };
      role_types: {
        Row: {
          id: string;
          name: RoleName;
          max_personas: number;
          max_ai_uses_monthly: number;
          price_monthly: number;
          price_yearly: number;
          features: string[];
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name: RoleName;
          max_personas: number;
          max_ai_uses_monthly: number;
          price_monthly: number;
          price_yearly: number;
          features: string[];
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: RoleName;
          max_personas?: number;
          max_ai_uses_monthly?: number;
          price_monthly?: number;
          price_yearly?: number;
          features?: string[];
          created_at?: string;
          updated_at?: string | null;
        };
      };
      seo_settings: {
        Row: {
          id: string;
          header_scripts: string | null;
          footer_scripts: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          header_scripts?: string | null;
          footer_scripts?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          header_scripts?: string | null;
          footer_scripts?: string | null;
          updated_at?: string | null;
        };
      };
      persona_library: {
          Row: {
            id: string;
            name: string;
            occupation: string;
            age: number;
            personality: string;
            hobbies: string[];
            relationship_status: string;
            values: string[];
            fears: string[];
            goals: string[];
          };
          Insert: {
            id: string;
            name: string;
            occupation: string;
            age: number;
            personality: string;
            hobbies: string[];
            relationship_status: string;
            values: string[];
            fears: string[];
            goals: string[];
          };
          Update: {
            id?: string;
            name?: string;
            occupation?: string;
            age?: number;
            personality?: string;
            hobbies?: string[];
            relationship_status?: string;
            values?: string[];
            fears?: string[];
            goals?: string[];
          };
      };
    };
    Views: {
      admin_users_view: {
        Row: {
          id: string | null;
          email: string | null;
          name: string | null;
          role_name: RoleName | null;
          ai_usage_count_monthly: number | null;
          assigned_ai_model_text: string | null;
          assigned_ai_model_image: string | null;
          updated_at: string | null;
        };
      };
    };
    Functions: {
      search_personas: {
        Args: {
          search_term: string;
        };
        Returns: {
          id: string;
          name: string;
          occupation: string;
          age: number;
          personality: string;
          hobbies: string[];
          relationship_status: string;
          values: string[];
          fears: string[];
          goals: string[];
        }[];
      };
    };
  };
}


export type DbSchema = Database['public'];