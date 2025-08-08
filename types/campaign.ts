import type { ScheduledPostStatus } from './app';
import type { Json } from './supabase';

export type RSTTraitLevel = 'Not Assessed' | 'Low' | 'Medium' | 'High';

export interface RSTProfile {
  bas: RSTTraitLevel;
  bis: RSTTraitLevel;
  fffs: RSTTraitLevel;
}

// Manually defined from supabase schema to break circular dependency
export interface Persona {
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
  source_admin_persona_id: number | null;
}

// Manually defined from supabase schema
export interface AdminPersona {
    id: number;
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
}

// Manually defined from supabase schema
export interface LibraryPersona {
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
}

// Manually defined from supabase schema
export interface Operator {
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
}

export type MediaType = 'none' | 'image' | 'video';
export type ImageSourceType = 'generate' | 'upload' | 'library';
export type KanbanStatus = 'Draft' | 'For Review' | 'Approved' | 'Scheduled';

export interface PlatformContentDetail {
  content: string;
  hashtags: string[];
  mediaType: MediaType;
  subject?: string;

  imageSourceType?: ImageSourceType;
  imagePrompt?: string;
  uploadedImageBase64?: string;
  libraryAssetId?: string;
  libraryAssetUrl?: string;
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
  title: string;
  key_message: string | null;
  custom_prompt: string;
  platform_contents: PlatformContentMap;
  platform_media_overrides: Record<string, MediaType | 'global'> | null;
  created_at: string;
  updated_at: string | null;
  tags: string[] | null;
  status: KanbanStatus;
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

// Manually defined from supabase schema
export interface ScheduledPostDbRow {
  id: number;
  user_id: string;
  content_draft_id: string;
  platform_key: string;
  status: 'Scheduled' | 'Publishing' | 'Published' | 'Failed' | 'Missed' | 'Cancelled';
  notes: string | null;
  scheduled_at: string; // ISO string
  error_message: string | null;
  last_attempted_at: string | null;
}

export interface AuditStep {
  id: string;
  title: string;
  description: string;
  content: string;
  isCompleted: boolean;
}