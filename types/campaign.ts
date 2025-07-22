import { Database, Json } from './supabase';
import { ScheduledPostStatus } from './app';

export type RSTTraitLevel = 'Not Assessed' | 'Low' | 'Medium' | 'High';

export interface RSTProfile {
  bas: RSTTraitLevel; // Behavioral Approach System
  bis: RSTTraitLevel; // Behavioral Inhibition System
  fffs: RSTTraitLevel; // Fight-Flight-Freeze System
}

// Derived type from Supabase schema
export type Persona = Database['public']['Tables']['personas']['Row'];

// AdminPersona is structurally a Persona without user-specific fields.
// This is structurally equivalent to the admin_personas table row but helps with type compatibility.
export type AdminPersona = Omit<Persona, 'user_id' | 'source_admin_persona_id'>;

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

  // New properties for A/B variants
  variant_content?: string;
  is_variant_generating?: boolean;
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