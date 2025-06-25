
import React from 'react';
import { ViewName, NavItem, AuditStep, Persona, MediaType, AiProviderType, AiProviderConfig, RSTTraitLevel, RSTProfile, SocialPlatformType } from './types';
import type { Operator } from './types';
import { 
    XIcon, FacebookIcon, InstagramIcon, LinkedInIcon, 
    PinterestIcon, TikTokIcon, YouTubeIcon, LinkIcon,
    PhotoIcon,
    DocumentDuplicateIcon,
    ChatBubbleLeftEllipsisIcon // Added Chat Icon
} from './components/ui/Icons';

export const APP_TITLE = "PixaSocial Ai";

export const NAVIGATION_ITEMS: NavItem[] = [
  { label: ViewName.Dashboard, viewName: ViewName.Dashboard },
  { label: ViewName.AudienceModeling, viewName: ViewName.AudienceModeling },
  {
    label: 'Campaign Tools',
    children: [
      { label: ViewName.OperatorBuilder, viewName: ViewName.OperatorBuilder },
      { label: ViewName.ContentPlanner, viewName: ViewName.ContentPlanner },
      { label: ViewName.Calendar, viewName: ViewName.Calendar },
      { label: ViewName.ContentLibrary, viewName: ViewName.ContentLibrary, icon: React.createElement(PhotoIcon) },
      { label: ViewName.FeedbackSimulator, viewName: ViewName.FeedbackSimulator },
      { label: ViewName.AuditTool, viewName: ViewName.AuditTool },
    ],
  },
  { label: ViewName.TeamChat, viewName: ViewName.TeamChat, icon: React.createElement(ChatBubbleLeftEllipsisIcon) }, // Added Team Chat
  { label: ViewName.Methodology, viewName: ViewName.Methodology },
  { label: ViewName.AdminPanel, viewName: ViewName.AdminPanel },
  { label: ViewName.Settings, viewName: ViewName.Settings }, 
];

export const GEMINI_TEXT_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_IMAGE_MODEL_NAME = 'imagen-3.0-generate-002';

export const DEFAULT_PERSONA_AVATAR = 'https://picsum.photos/seed/persona/100/100';

export const OPERATOR_TYPES: Operator['type'][] = [
    'Hope', 
    'Fear', 
    'Belonging', 
    'Exclusivity', 
    'Curiosity', 
    'Authority', 
    'Novelty', 
    'Pride', 
    'Nostalgia', 
    'Convenience', 
    'Custom'
];

export const AUDIT_TOOL_STEPS_DATA: Array<Pick<AuditStep, 'id' | 'title' | 'description'>> = [
    { id: 'D0', title: 'D0: Plan', description: 'Define the campaign objectives and scope.' },
    { id: 'D1', title: 'D1: Establish the Team', description: 'Identify key personnel and responsibilities (for this tool, you are the team).' },
    { id: 'D2', title: 'D2: Describe the Problem/Opportunity', description: 'Clearly define the issue the campaign addresses or the opportunity it pursues.' },
    { id: 'D3', title: 'D3: Develop Interim Containment Actions (ICA)', description: 'If addressing an ongoing issue, what immediate steps can be taken?' },
    { id: 'D4', title: 'D4: Identify and Verify Root Causes', description: 'Analyze why the problem exists or what factors will influence the opportunity.' },
    { id: 'D5', title: 'D5: Choose and Verify Permanent Corrective Actions (PCA)', description: 'Develop and select long-term solutions or strategies.' },
    { id: 'D6', title: 'D6: Implement and Validate PCA', description: 'Put the chosen strategies into action and verify their effectiveness.' },
    { id: 'D7', title: 'D7: Prevent Recurrence', description: 'Establish measures to ensure sustained success and avoid similar issues in the future.' },
    { id: 'D8', title: 'D8: Congratulate the Team', description: 'Acknowledge the effort and successful completion of the planning/auditing process.' },
];

export const REGION_COUNTRY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'Global', label: 'Global / Any' },
  { value: 'North America', label: 'North America (Region)' },
  { value: 'USA', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Europe', label: 'Europe (Region)' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Asia', label: 'Asia (Region)' },
  { value: 'China', label: 'China' },
  { value: 'India', label: 'India' },
  { value: 'Japan', label: 'Japan' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'South America', label: 'South America (Region)' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Africa', label: 'Africa (Region)' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'South Africa', label: 'South Africa' },
  { value: 'Oceania', label: 'Oceania (Region)' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Middle East', label: 'Middle East (Region)' },
];

export const CONTENT_PLATFORMS: Array<{ 
    key: string; 
    label: string; 
    characterLimit?: number; 
    styleGuideline: string; 
    icon?: string | React.ReactNode;
    isPoster?: boolean;
    targetWidth?: number;
    targetHeight?: number;
}> = [
  { key: 'X', label: 'X (Twitter)', characterLimit: 280, styleGuideline: "Generate a concise and impactful post, ideally under 280 characters. Include 2-3 highly relevant hashtags. Emojis are encouraged if appropriate for the tone.", icon: "🐦" },
  { key: 'Facebook', label: 'Facebook', styleGuideline: "Craft an engaging post that can be longer and more detailed. Aim to spark discussion or provide valuable information. Include 3-5 relevant hashtags. Emojis can enhance engagement.", icon: "👍" },
  { key: 'Instagram', label: 'Instagram Caption', styleGuideline: "Create a visually descriptive or compellingly narrative caption. Start with a strong hook to capture attention. Include 5-10 relevant hashtags, mixing popular with niche. Emojis are highly recommended to match the visual nature of the platform.", icon: "📸" },
  { key: 'LinkedIn', label: 'LinkedIn', styleGuideline: "Develop a professional and insightful post suitable for a business audience. Focus on industry trends, thought leadership, or career development. Include 2-4 relevant professional hashtags. Avoid overly casual emojis.", icon: React.createElement(LinkedInIcon, { className: "w-4 h-4 inline-block" }) },
  { key: 'Email', label: 'Email', styleGuideline: "Craft a professional and engaging email. Provide a clear 'subject' line and compelling 'content' for the email body. Ensure the tone is appropriate for email communication. Do not include hashtags unless specifically requested in custom prompt.", icon: "✉️" },
  { 
    key: 'Poster11', 
    label: 'Poster (1:1 Square)', 
    styleGuideline: "Focus on generating a detailed 'imagePrompt' for a visually rich square (1:1 aspect ratio, e.g., 1024x1024px) image suitable for a poster. Also provide 'memeText' if applicable. No post content or hashtags needed for AI generation for this platform.", 
    icon: React.createElement(DocumentDuplicateIcon, { className: "w-4 h-4 inline-block" }),
    isPoster: true,
    targetWidth: 1024,
    targetHeight: 1024,
  },
  { 
    key: 'Poster169', 
    label: 'Poster (1:9 Landscape)', 
    styleGuideline: "Focus on generating a detailed 'imagePrompt' for a visually rich landscape (16:9 aspect ratio, e.g., 1280x720px) image suitable for a poster. Also provide 'memeText' if applicable. No post content or hashtags needed for AI generation for this platform.", 
    icon: React.createElement(DocumentDuplicateIcon, { className: "w-4 h-4 inline-block" }),
    isPoster: true,
    targetWidth: 1280,
    targetHeight: 720,
  },
];

// RST Constants
export const RST_TRAIT_LEVELS: RSTTraitLevel[] = ['Not Assessed', 'Low', 'Medium', 'High'];

export const RST_TRAIT_LEVEL_OPTIONS: Array<{ value: RSTTraitLevel; label: string }> = RST_TRAIT_LEVELS.map(level => ({
  value: level,
  label: level,
}));

export const RST_TRAITS: Array<{ key: keyof RSTProfile; label: string; description: string }> = [
    { key: 'bas', label: 'Behavioral Approach System (BAS)', description: 'Sensitivity to rewards, positive outcomes, and approach motivation. High BAS individuals are often impulsive and seek novelty.' },
    { key: 'bis', label: 'Behavioral Inhibition System (BIS)', description: 'Sensitivity to punishment, non-reward, novelty, and negative outcomes. High BIS individuals are often anxious and avoidant of potential threats.' },
    { key: 'fffs', label: 'Fight-Flight-Freeze System (FFFS)', description: 'Response to acute aversive stimuli and fear. High FFFS activation leads to defensive behaviors like fight, flight, or freezing.' },
];


export const MEDIA_TYPE_OPTIONS: Array<{ value: MediaType; label: string }> = [
  { value: 'none', label: 'Text Only' },
  { value: 'image', label: 'Image with Meme Text' },
  { value: 'video', label: 'Video Idea/Script' },
];

export const TONE_OF_VOICE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Default/Neutral' },
  { value: 'Professional', label: 'Professional' },
  { value: 'Casual', label: 'Casual' },
  { value: 'Enthusiastic', label: 'Enthusiastic' },
  { value: 'Empathetic', label: 'Empathetic' },
  { value: 'Humorous', label: 'Humorous' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'Authoritative', label: 'Authoritative' },
  { value: 'Inspirational', label: 'Inspirational' },
  { value: 'Sarcastic', label: 'Sarcastic' },
  { value: 'Concerned', label: 'Concerned' },
];

// Local Storage Keys
export const LOCAL_STORAGE_AI_CONFIG_KEY = 'pixasocial_ai_provider_configs';
export const LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY = 'pixasocial_active_ai_provider';
export const LOCAL_STORAGE_CAMPAIGN_DATA_KEY = 'pixasocial_campaign_data';
export const LOCAL_STORAGE_USERS_KEY = 'pixasocial_users'; // For mock user registration
export const LOCAL_STORAGE_AUTH_TOKEN_KEY = 'pixasocial_auth_token'; // For mock login state


export const AI_PROVIDERS_CONFIG_TEMPLATE: AiProviderConfig[] = [
  {
    id: AiProviderType.Gemini,
    name: 'Google Gemini',
    apiKey: null,
    isEnabled: true,
    isGemini: true,
    models: {
      text: [GEMINI_TEXT_MODEL_NAME],
      image: [GEMINI_IMAGE_MODEL_NAME],
      chat: [GEMINI_TEXT_MODEL_NAME]
    },
    notes: `Uses pre-configured environment API key if available. Otherwise, enter your key.`
  },
  {
    id: AiProviderType.OpenAI,
    name: 'OpenAI (GPT)',
    apiKey: null,
    isEnabled: false,
    models: {
      text: ['gpt-4-turbo', 'gpt-3.5-turbo'],
      image: ['dall-e-3', 'dall-e-2'],
      chat: ['gpt-4-turbo', 'gpt-3.5-turbo']
    },
    notes: 'Requires API key. Uses OpenAI API.',
    baseURL: 'https://api.openai.com/v1'
  },
  {
    id: AiProviderType.Deepseek,
    name: 'Deepseek',
    apiKey: null,
    isEnabled: false,
    models: {
      text: ['deepseek-chat', 'deepseek-coder'],
      chat: ['deepseek-chat', 'deepseek-coder']
    },
    notes: 'Requires API key. Uses an OpenAI-compatible API. Image generation not typically supported.',
    baseURL: 'https://api.deepseek.com/v1'
  },
  {
    id: AiProviderType.Groq,
    name: 'GroqCloud',
    apiKey: null,
    isEnabled: false,
    models: {
      text: ['mixtral-8x7b-32768', 'llama3-70b-8192', 'llama3-8b-8192', 'gemma-7b-it'],
      chat: ['mixtral-8x7b-32768', 'llama3-70b-8192', 'llama3-8b-8192', 'gemma-7b-it']
    },
    notes: 'Requires API key. For GroqCloud (api.groq.com) fast inference. Uses OpenAI-compatible API. Image generation not supported.',
    baseURL: 'https://api.groq.com/openai/v1'
  },
  {
    id: AiProviderType.Anthropic,
    name: 'Anthropic (Claude)',
    apiKey: null,
    isEnabled: false,
    models: {
      text: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      chat: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    },
    notes: 'Requires API key. (Full API integration for Anthropic SDK not yet implemented in app; currently placeholder)'
  },
  {
    id: AiProviderType.Qwen,
    name: 'Qwen (Alibaba)',
    apiKey: null,
    isEnabled: false,
    models: {
        text: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
        image: ['qwen-vl-plus', 'qwen-vl-max'],
        chat: ['qwen-turbo', 'qwen-plus', 'qwen-max']
    },
    notes: 'Requires API key. (Full API integration not yet implemented in app; currently placeholder)'
  },
];

export const SOCIAL_PLATFORMS_TO_CONNECT: Array<{ id: SocialPlatformType; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; description: string; brandColor?: string }> = [
  { id: SocialPlatformType.X, name: 'X (Twitter)', icon: XIcon, description: "Connect your X account to schedule and publish posts.", brandColor: "text-black dark:text-white" },
  { id: SocialPlatformType.Facebook, name: 'Facebook', icon: FacebookIcon, description: "Link Facebook Pages to manage content and engage audiences.", brandColor: "text-blue-600" },
  { id: SocialPlatformType.Instagram, name: 'Instagram', icon: InstagramIcon, description: "Connect Instagram Business accounts for content scheduling.", brandColor: "text-pink-500" },
  { id: SocialPlatformType.LinkedIn, name: 'LinkedIn', icon: LinkedInIcon, description: "Manage LinkedIn Pages and personal profiles.", brandColor: "text-sky-700" },
  { id: SocialPlatformType.Pinterest, name: 'Pinterest', icon: PinterestIcon, description: "Schedule Pins to your Pinterest boards.", brandColor: "text-red-600" },
  { id: SocialPlatformType.TikTok, name: 'TikTok', icon: TikTokIcon, description: "Connect TikTok to plan and analyze video content (Note: Direct posting API is limited).", brandColor: "text-black dark:text-white" },
  { id: SocialPlatformType.YouTube, name: 'YouTube', icon: YouTubeIcon, description: "Manage video uploads and scheduling for your YouTube channels.", brandColor: "text-red-500" },
];

export const MAX_FILE_UPLOAD_SIZE_MB = 2; // Kept small for localStorage
export const CHAT_IMAGE_PREVIEW_MAX_SIZE_BYTES = 100 * 1024; // 100KB for chat image previews
export const MAX_FILE_UPLOAD_SIZE_BYTES = MAX_FILE_UPLOAD_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm']; // Note: Video previews in chat won't be a focus
export const ACCEPTED_CHAT_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES, 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']; // Broader for chat
export const ACCEPTED_MEDIA_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];


export const MAX_TEAM_MEMBERS = 3; // Added for team management
export const GENERAL_CHAT_CHANNEL_ID = "general";
export const GENERAL_CHAT_CHANNEL_NAME = "#general";