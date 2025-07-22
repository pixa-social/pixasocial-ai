import { Database } from './supabase';
import { GroundingSource } from './ai';

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
  text?: string;
  attachment?: ChatMessageAttachment;
  created_at: string;
  updated_at?: string; // For message edits
  isEditing?: boolean; // Client-side flag
  grounding_sources?: GroundingSource[];
}

export interface CustomChannel {
  id: string; // Client-side generated, hence string
  uuid: string;
  name: string;
  created_by: string;
  created_at: string;
}

export type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];