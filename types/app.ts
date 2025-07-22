import React from 'react';

export enum ViewName {
  Dashboard = 'Dashboard',
  AIAgents = 'AI Agents',
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

export interface NavItem {
  label: string;
  viewName?: ViewName;
  icon?: React.ReactNode;
  children?: NavItem[];
  isAdminOnly?: boolean;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ToastContextType {
  showToast: (message: string, type: ToastMessage['type'], duration?: number) => void;
}

export enum RoleName {
    Free = 'Free',
    Essentials = 'Essentials',
    Team = 'Team',
    Enterprise = 'Enterprise',
    Admin = 'Admin',
}

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

export type ScheduledPostStatus = 'Scheduled' | 'Publishing' | 'Published' | 'Failed' | 'Missed' | 'Cancelled';

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
