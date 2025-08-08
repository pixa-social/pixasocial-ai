import React from 'react';
import type { SocialPlatformType } from './app';

// Manually defined from supabase schema to break circular dependency
export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: 'X' | 'Facebook' | 'Instagram' | 'LinkedIn' | 'Pinterest' | 'TikTok' | 'YouTube' | 'Telegram' | 'Bluesky' | 'GoogleBusiness' | 'Threads' | 'Discord' | 'Reddit' | 'Snapchat';
  accountid: string;
  accountname: string | null;
  accesstoken: string | null;
  tokenexpiry: string | null;
  refreshtoken: string | null;
  created_at: string | null;
  encrypted_bot_token: string | null;
  channel_id: string | null;
}

// Manually defined from supabase schema to break circular dependency
export interface ContentLibraryAsset {
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
  publicUrl?: string;
}

// For the detailed connection flow modal
export interface ConnectionOption {
  type: string;
  title: string;
  description: string;
  features: string[];
  recommended?: boolean;
  warning?: string;
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