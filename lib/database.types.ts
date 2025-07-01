export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ai_provider_configs: {
        Row: {
          base_url: string | null
          created_at: string
          encrypted_api_key: string | null
          id: string
          is_enabled: boolean
          models: Json
          notes: string | null
          provider_id: Database["public"]["Enums"]["ai_provider_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          encrypted_api_key?: string | null
          id?: string
          is_enabled?: boolean
          models?: Json
          notes?: string | null
          provider_id: Database["public"]["Enums"]["ai_provider_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          encrypted_api_key?: string | null
          id?: string
          is_enabled?: boolean
          models?: Json
          notes?: string | null
          provider_id?: Database["public"]["Enums"]["ai_provider_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_direct_message: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_direct_message?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_direct_message?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_storage_path: string | null
          attachment_type: string | null
          channel_id: string
          id: string
          sender_id: string
          text_content: string | null
          timestamp: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_storage_path?: string | null
          attachment_type?: string | null
          channel_id: string
          id?: string
          sender_id: string
          text_content?: string | null
          timestamp?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_storage_path?: string | null
          attachment_type?: string | null
          channel_id?: string
          id?: string
          sender_id?: string
          text_content?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      connected_accounts: {
        Row: {
          account_id: string
          connected_at: string
          display_name: string
          encrypted_access_token: string | null
          id: string
          platform: Database["public"]["Enums"]["social_platform_type"]
          profile_image_url: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          connected_at?: string
          display_name: string
          encrypted_access_token?: string | null
          id?: string
          platform: Database["public"]["Enums"]["social_platform_type"]
          profile_image_url?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          connected_at?: string
          display_name?: string
          encrypted_access_token?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["social_platform_type"]
          profile_image_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      content_drafts: {
        Row: {
          created_at: string
          custom_prompt: string
          id: string
          operator_id: string
          persona_id: string
          platform_contents: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_prompt: string
          id?: string
          operator_id: string
          persona_id: string
          platform_contents?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_prompt?: string
          id?: string
          operator_id?: string
          persona_id?: string
          platform_contents?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_drafts_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_drafts_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      content_library_assets: {
        Row: {
          file_name: string
          file_type: string
          id: string
          name: string
          size: number
          storage_path: string
          type: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_type: string
          id?: string
          name: string
          size: number
          storage_path: string
          type: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          file_type?: string
          id?: string
          name?: string
          size?: number
          storage_path?: string
          type?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_library_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      operators: {
        Row: {
          conditioned_stimulus: string
          created_at: string
          desired_conditioned_response: string
          id: string
          name: string
          reinforcement_loop: string
          target_audience_id: string
          type: Database["public"]["Enums"]["operator_type"]
          unconditioned_stimulus: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conditioned_stimulus: string
          created_at?: string
          desired_conditioned_response: string
          id?: string
          name: string
          reinforcement_loop: string
          target_audience_id: string
          type: Database["public"]["Enums"]["operator_type"]
          unconditioned_stimulus: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conditioned_stimulus?: string
          created_at?: string
          desired_conditioned_response?: string
          id?: string
          name?: string
          reinforcement_loop?: string
          target_audience_id?: string
          type?: Database["public"]["Enums"]["operator_type"]
          unconditioned_stimulus?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operators_target_audience_id_fkey"
            columns: ["target_audience_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      personas: {
        Row: {
          avatar_url: string | null
          created_at: string
          demographics: string
          id: string
          initial_beliefs: string
          name: string
          psychographics: string
          rst_profile_bas: Database["public"]["Enums"]["rst_trait_level"]
          rst_profile_bis: Database["public"]["Enums"]["rst_trait_level"]
          rst_profile_fffs: Database["public"]["Enums"]["rst_trait_level"]
          updated_at: string
          user_id: string
          vulnerabilities: string[]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          demographics: string
          id?: string
          initial_beliefs: string
          name: string
          psychographics: string
          rst_profile_bas?: Database["public"]["Enums"]["rst_trait_level"]
          rst_profile_bis?: Database["public"]["Enums"]["rst_trait_level"]
          rst_profile_fffs?: Database["public"]["Enums"]["rst_trait_level"]
          updated_at?: string
          user_id: string
          vulnerabilities?: string[]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          demographics?: string
          id?: string
          initial_beliefs?: string
          name?: string
          psychographics?: string
          rst_profile_bas?: Database["public"]["Enums"]["rst_trait_level"]
          rst_profile_bis?: Database["public"]["Enums"]["rst_trait_level"]
          rst_profile_fffs?: Database["public"]["Enums"]["rst_trait_level"]
          updated_at?: string
          user_id?: string
          vulnerabilities?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "personas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          team_members: string[]
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          team_members?: string[]
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          team_members?: string[]
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      scheduled_posts: {
        Row: {
          all_day: boolean
          content_draft_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          operator_id: string
          persona_id: string
          platform_key: string
          start_time: string
          status: Database["public"]["Enums"]["scheduled_post_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          content_draft_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          operator_id: string
          persona_id: string
          platform_key: string
          start_time: string
          status?: Database["public"]["Enums"]["scheduled_post_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          content_draft_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          operator_id?: string
          persona_id?: string
          platform_key?: string
          start_time?: string
          status?: Database["public"]["Enums"]["scheduled_post_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_content_draft_id_fkey"
            columns: ["content_draft_id"]
            isOneToOne: false
            referencedRelation: "content_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_provider_type: "Gemini" | "OpenAI" | "Anthropic" | "Groq" | "Deepseek" | "Qwen"
      image_source_type: "generate" | "upload" | "library"
      media_type: "none" | "image" | "video"
      operator_type: "Hope" | "Fear" | "Belonging" | "Exclusivity" | "Curiosity" | "Authority" | "Novelty" | "Pride" | "Nostalgia" | "Convenience" | "Custom"
      rst_trait_level: "Not Assessed" | "Low" | "Medium" | "High"
      scheduled_post_status: "Scheduled" | "Published" | "Missed" | "Cancelled"
      social_platform_type: "X" | "Facebook" | "Instagram" | "LinkedIn" | "Pinterest" | "TikTok" | "YouTube"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}