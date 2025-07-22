import { RoleName, SocialPlatformType, ScheduledPostStatus, AiProviderType } from './app';

// --- Supabase Schema Definition ---

export type Json = | string | number | boolean | null | { [key: string]: Json } | Json[];

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
        Relationships: [];
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
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: number;
          user_id: string;
          role_id: string;
          assigned_at: string;
        };
        Insert: {
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
        Relationships: [];
      };
      oauth_states: {
        Row: {
          state: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          state?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          state?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
          goals: string[] | null;
          fears: string[] | null;
          avatar_url: string | null;
          rst_profile: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          name: string;
          demographics?: string | null;
          psychographics?: string | null;
          initial_beliefs?: string | null;
          vulnerabilities?: string[] | null;
          goals?: string[] | null;
          fears?: string[] | null;
          avatar_url?: string | null;
          rst_profile?: Json | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string;
          demographics?: string | null;
          psychographics?: string | null;
          initial_beliefs?: string | null;
          vulnerabilities?: string[] | null;
          goals?: string[] | null;
          fears?: string[] | null;
          avatar_url?: string | null;
          rst_profile?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      persona_deep_dives: {
        Row: {
          id: string;
          persona_id: number;
          user_id: string;
          communication_style: string;
          media_habits: string;
          motivations: string;
          marketing_hooks: string[];
          created_at: string;
          ai_model_used: string | null;
        };
        Insert: {
          persona_id: number;
          user_id: string;
          communication_style: string;
          media_habits: string;
          motivations: string;
          marketing_hooks: string[];
          ai_model_used?: string | null;
        };
        Update: {
          id?: string;
          persona_id?: number;
          user_id?: string;
          communication_style?: string;
          media_habits?: string;
          motivations?: string;
          marketing_hooks?: string[];
          created_at?: string;
          ai_model_used?: string | null;
        };
        Relationships: [];
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
          effectiveness_score: number | null;
          alignment_analysis: string | null;
          improvement_suggestions: string[] | null;
        };
        Insert: {
          user_id: string;
          name: string;
          target_audience_id: number;
          type: 'Hope' | 'Fear' | 'Belonging' | 'Exclusivity' | 'Curiosity' | 'Authority' | 'Novelty' | 'Pride' | 'Nostalgia' | 'Convenience' | 'Custom';
          conditioned_stimulus: string;
          unconditioned_stimulus:string;
          desired_conditioned_response: string;
          reinforcement_loop: string;
          effectiveness_score?: number | null;
          alignment_analysis?: string | null;
          improvement_suggestions?: string[] | null;
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
          effectiveness_score?: number | null;
          alignment_analysis?: string | null;
          improvement_suggestions?: string[] | null;
        };
        Relationships: [];
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
          user_id: string;
          operator_id: number;
          persona_id: number;
          key_message?: string | null;
          custom_prompt: string;
          platform_contents: Json;
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
        Relationships: [];
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
          user_id: string;
          name: string;
          type: 'image' | 'video';
          storage_path: string;
          file_name: string;
          file_type: string;
          size: number;
          tags?: string[] | null;
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
          Relationships: [];
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          persona_id: number | null;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          persona_id?: number | null;
          title: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          persona_id?: number | null;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
          grounding_sources: Json | null;
        };
        Insert: {
          session_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          grounding_sources?: Json | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
          grounding_sources?: Json | null;
        };
        Relationships: [];
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
