import React from 'react';
import { Database } from './supabase';
import { SocialPlatformType } from './app';

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