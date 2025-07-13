

import React from 'react';
import { ViewName, NavItem, AuditStep, Persona, MediaType, AiProviderType, AiProviderConfig, RSTTraitLevel, RSTProfile, SocialPlatformType, SocialPlatformConnectionDetails } from './types';
import type { Operator } from './types';
import { 
    XIcon, FacebookIcon, InstagramIcon, LinkedInIcon, 
    PinterestIcon, TikTokIcon, YouTubeIcon, LinkIcon,
    PhotoIcon,
    DocumentDuplicateIcon,
    ChatBubbleLeftEllipsisIcon,
    PaperAirplaneIcon,
    TelegramIcon, BlueskyIcon, GoogleBusinessIcon, 
    ThreadsIcon, DiscordIcon, RedditIcon, SnapchatIcon,
    ChartPieIcon
} from './components/ui/Icons';

export const APP_TITLE = "PixaSocial Ai";

export const NAVIGATION_ITEMS: NavItem[] = [
  { label: ViewName.Dashboard, viewName: ViewName.Dashboard },
  { label: ViewName.AudienceModeling, viewName: ViewName.AudienceModeling },
  { label: ViewName.Analytics, viewName: ViewName.Analytics, icon: React.createElement(ChartPieIcon, { className: 'w-4 h-4' }) },
  {
    label: 'Campaign Tools',
    children: [
      { label: ViewName.OperatorBuilder, viewName: ViewName.OperatorBuilder },
      { label: ViewName.ContentPlanner, viewName: ViewName.ContentPlanner },
      { label: ViewName.Calendar, viewName: ViewName.Calendar },
      { label: ViewName.SocialPoster, viewName: ViewName.SocialPoster, icon: React.createElement(PaperAirplaneIcon, { className: 'w-4 h-4' }) },
      { label: ViewName.ContentLibrary, viewName: ViewName.ContentLibrary, icon: React.createElement(PhotoIcon, { className: 'w-4 h-4' }) },
      { label: ViewName.FeedbackSimulator, viewName: ViewName.FeedbackSimulator },
      { label: ViewName.AuditTool, viewName: ViewName.AuditTool },
    ],
  },
  { label: ViewName.TeamChat, viewName: ViewName.TeamChat, icon: React.createElement(ChatBubbleLeftEllipsisIcon, { className: 'w-5 h-5' }) }, 
  { label: ViewName.AdminPanel, viewName: ViewName.AdminPanel, isAdminOnly: true },
  { label: ViewName.Settings, viewName: ViewName.Settings }, 
];

export const GEMINI_TEXT_MODEL_NAME = 'gemini-2.5-flash';
export const GEMINI_IMAGE_MODEL_NAME = 'imagen-3.0-generate-002';

export const DEFAULT_PERSONA_AVATAR = 'https://picsum.photos/seed/persona/100/100';

export const OPERATOR_TYPES = [
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
] as const;

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
    label: 'Poster (16:9 Landscape)', 
    styleGuideline: "Focus on generating a detailed 'imagePrompt' for a visually rich landscape (16:9 aspect ratio, e.g., 1280x720px) image suitable for a poster. Also provide 'memeText' if applicable. No post content or hashtags needed for AI generation for this platform.", 
    icon: React.createElement(DocumentDuplicateIcon, { className: "w-4 h-4 inline-block" }),
    isPoster: true,
    targetWidth: 1280,
    targetHeight: 720,
  },
];

export const RST_TRAIT_LEVELS: RSTTraitLevel[] = ['Not Assessed', 'Low', 'Medium', 'High'];

export const RST_TRAIT_LEVEL_OPTIONS: Array<{ value: RSTTraitLevel; label: string }> = RST_TRAIT_LEVELS.map(level => ({
  value: level,
  label: level,
}));

export const RST_FILTER_OPTIONS: Array<{ value: RSTTraitLevel | 'Any'; label: string }> = [
  { value: 'Any', label: 'Any Level' },
  ...RST_TRAIT_LEVEL_OPTIONS
];


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

// Local Storage Keys are deprecated in favor of database storage for settings.
// This section is now empty.


export const AI_PROVIDERS_CONFIG_TEMPLATE: AiProviderConfig[] = [
  {
    id: AiProviderType.Gemini,
    name: 'Google Gemini',
    api_key: null,
    is_enabled: true,
    models: {
      text: [GEMINI_TEXT_MODEL_NAME],
      image: [GEMINI_IMAGE_MODEL_NAME],
      chat: [GEMINI_TEXT_MODEL_NAME]
    },
    notes: `Global key for all users. Managed by Admin.`
  },
  {
    id: AiProviderType.OpenAI,
    name: 'OpenAI (GPT)',
    api_key: null,
    is_enabled: false,
    models: {
      text: ['gpt-4-turbo', 'gpt-3.5-turbo'],
      image: ['dall-e-3'],
      chat: ['gpt-4-turbo', 'gpt-3.5-turbo']
    },
    notes: 'Uses OpenAI API.',
    base_url: 'https://api.openai.com/v1'
  },
  {
    id: AiProviderType.Groq,
    name: 'Groq',
    api_key: null,
    is_enabled: false,
    models: {
      text: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'],
      chat: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768']
    },
    notes: 'Uses GroqCloud API (OpenAI compatible).',
    base_url: 'https://api.groq.com/openai/v1'
  },
  {
    id: AiProviderType.Deepseek,
    name: 'Deepseek',
    api_key: null,
    is_enabled: false,
    models: {
      text: ['deepseek-chat', 'deepseek-coder'],
      chat: ['deepseek-chat', 'deepseek-coder']
    },
    notes: 'Uses Deepseek API (OpenAI compatible).',
    base_url: 'https://api.deepseek.com/v1'
  },
  {
    id: AiProviderType.Openrouter,
    name: 'OpenRouter.ai',
    api_key: null,
    is_enabled: false,
    models: {
      text: [
        'google/gemma-3-27b-it:free', 
        'mistralai/mistral-7b-instruct', 
        'google/gemini-pro', 
        'openai/gpt-4o',
        'nvidia/llama-3.3-nemotron-super-49b-v1:free',
        'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
        'qwen/qwen3-235b-a22b:free',
        'google/gemini-2.0-flash-exp:free'
      ],
      chat: [
        'google/gemma-3-27b-it:free', 
        'mistralai/mistral-7b-instruct', 
        'google/gemini-pro', 
        'openai/gpt-4o',
        'nvidia/llama-3.3-nemotron-super-49b-v1:free',
        'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
        'qwen/qwen3-235b-a22b:free',
        'google/gemini-2.0-flash-exp:free'
      ]
    },
    notes: 'Acts as a router to many models. Use your OpenRouter API key.',
    base_url: 'https://openrouter.ai/api/v1'
  },
  {
    id: AiProviderType.MistralAI,
    name: 'Mistral AI',
    api_key: null,
    is_enabled: false,
    models: {
      text: ['open-mistral-7b', 'open-mixtral-8x7b', 'mistral-large-latest'],
      chat: ['open-mistral-7b', 'open-mixtral-8x7b', 'mistral-large-latest']
    },
    notes: 'Uses the official Mistral AI API (OpenAI compatible).',
    base_url: 'https://api.mistral.ai/v1'
  },
  {
    id: AiProviderType.Anthropic,
    name: 'Anthropic (Claude)',
    api_key: null,
    is_enabled: false,
    models: { text: [], chat: [] },
    notes: 'Placeholder only. This provider is not implemented as it requires a custom SDK.',
  },
  {
    id: AiProviderType.Qwen,
    name: 'Qwen (Alibaba)',
    api_key: null,
    is_enabled: false,
    models: { text: [], chat: [] },
    notes: 'Placeholder only. This provider is not implemented as it requires a custom SDK.',
  },
];

export const SOCIAL_PLATFORMS_TO_CONNECT: SocialPlatformConnectionDetails[] = [
  { 
    id: SocialPlatformType.Instagram, 
    name: 'Instagram', 
    icon: InstagramIcon, 
    description: "Connect Business accounts for direct scheduling or Personal accounts for notifications.", 
    brandColor: "text-pink-500",
    connectionOptions: [
      {
        type: 'Personal',
        title: 'Personal Profile',
        description: 'Most used to share to family and friends.',
        features: ['Notification-based publishing: Receive a mobile notification to post yourself.'],
      },
      {
        type: 'Professional',
        title: 'Professional',
        description: 'For Business or Creator Accounts.',
        features: [
          'Automatic publishing: Schedule and we’ll publish for you (for images and short videos).',
          'Analytics & engagement data (on our higher-tier plans).',
          'Notification-based publishing for Stories and other formats.'
        ],
        recommended: true,
        warning: "If your account type isn’t Professional yet, Instagram will prompt you to change it during the connection process."
      }
    ]
  },
  { 
    id: SocialPlatformType.Facebook, 
    name: 'Facebook', 
    icon: FacebookIcon, 
    description: "Link Facebook Pages to manage content and engage audiences.", 
    brandColor: "text-blue-600",
    connectionOptions: [
      {
        type: 'Page',
        title: 'Facebook Page',
        description: 'Connect a Facebook Page you manage to enable direct publishing.',
        features: [
            'Directly publish posts, images, and videos.',
            'Schedule content far in advance.',
            'Access to analytics for your Page (on higher-tier plans).'
        ],
        recommended: true,
      }
    ]
  },
  { 
    id: SocialPlatformType.X, 
    name: 'X (Twitter)', 
    icon: XIcon, 
    description: "Connect your X account to schedule and publish posts.", 
    brandColor: "text-black dark:text-white",
    connectionOptions: [
        {
        type: 'Profile',
        title: 'X Profile',
        description: 'Connect your X profile for direct posting and scheduling.',
        features: [
            'Directly publish posts (tweets) with text, images, and links.',
            'Schedule posts for optimal timing.',
            'Engage with your audience directly from the platform.'
        ],
        recommended: true,
        }
    ]
  },
  { 
    id: SocialPlatformType.LinkedIn, 
    name: 'LinkedIn', 
    icon: LinkedInIcon, 
    description: "Manage LinkedIn Pages and personal profiles for professional content.", 
    brandColor: "text-sky-700",
    connectionOptions: [
        {
        type: 'Profile',
        title: 'LinkedIn Profile or Page',
        description: 'Connect a LinkedIn profile or a Company Page you administer.',
        features: [
            'Directly publish professional articles, updates, and media.',
            'Schedule content for your professional network or company followers.',
        ],
        recommended: true,
        warning: 'LinkedIn API rules apply. Frequent non-engaging posts can be throttled.'
        }
    ]
  },
  { 
    id: SocialPlatformType.Pinterest, 
    name: 'Pinterest', 
    icon: PinterestIcon, 
    description: "Schedule Pins to your Pinterest boards.", 
    brandColor: "text-red-600",
    connectionOptions: [
        {
        type: 'Profile',
        title: 'Pinterest Profile',
        description: 'Connect your Pinterest account to schedule Pins to your boards.',
        features: [
            'Schedule image and video Pins to any of your public boards.',
            'Plan visual content campaigns.',
        ],
        recommended: true,
        }
    ]
  },
  { 
    id: SocialPlatformType.TikTok, 
    name: 'TikTok', 
    icon: TikTokIcon, 
    description: "Connect TikTok for content planning and publishing reminders.", 
    brandColor: "text-black dark:text-white",
     connectionOptions: [
        {
        type: 'Business',
        title: 'TikTok Business Account',
        description: 'Connect your TikTok account to receive publishing reminders.',
        features: [
            'Notification-based publishing: We’ll prepare your video and send a notification to your phone for you to post.',
        ],
        recommended: true,
        warning: 'Direct automatic posting to TikTok is highly restricted by their API. Our reminder workflow is the most reliable method.'
        }
    ]
  },
  { 
    id: SocialPlatformType.YouTube, 
    name: 'YouTube', 
    icon: YouTubeIcon, 
    description: "Manage video uploads and scheduling for your YouTube channels.", 
    brandColor: "text-red-500",
    connectionOptions: [
        {
        type: 'Channel',
        title: 'YouTube Channel',
        description: 'Connect your YouTube channel to manage video uploads.',
        features: [
            'Upload videos directly to your channel.',
            'Schedule videos to go live at a specific time.',
            'Update video titles, descriptions, and privacy settings.'
        ],
        recommended: true,
        }
    ]
  },
  { 
    id: SocialPlatformType.Telegram, 
    name: 'Telegram', 
    icon: TelegramIcon, 
    description: "Connect to broadcast messages to channels and groups.", 
    brandColor: "text-sky-500",
    connectionOptions: [{
        type: 'Bot',
        title: 'Telegram Bot/Channel',
        description: 'Connect a Telegram bot to post messages to channels or groups.',
        features: ['Directly publish messages to channels.', 'Schedule broadcasts.'],
        recommended: true
    }]
  },
  { 
    id: SocialPlatformType.Bluesky, 
    name: 'Bluesky', 
    icon: BlueskyIcon, 
    description: "Connect your Bluesky account to post and schedule content.", 
    brandColor: "text-blue-500",
    connectionOptions: [{
        type: 'Profile',
        title: 'Bluesky Profile',
        description: 'Connect your Bluesky profile for direct posting.',
        features: ['Directly publish posts (skeets).', 'Schedule content.'],
        recommended: true
    }]
  },
  { 
    id: SocialPlatformType.GoogleBusiness, 
    name: 'Google Business Profile', 
    icon: GoogleBusinessIcon, 
    description: "Manage posts and updates for your Google Business Profile listings.", 
    brandColor: "text-green-600",
    connectionOptions: [{
        type: 'Profile',
        title: 'Google Business Profile',
        description: 'Connect your GBP to post updates, offers, and events.',
        features: ['Publish posts directly to your profile.', 'Schedule updates to keep your profile active.'],
        recommended: true
    }]
  },
  { 
    id: SocialPlatformType.Threads, 
    name: 'Threads', 
    icon: ThreadsIcon, 
    description: "Connect Threads for content planning and posting.", 
    brandColor: "text-black dark:text-white",
    connectionOptions: [{
        type: 'Profile',
        title: 'Threads Profile',
        description: 'Connect your Threads account for direct publishing.',
        features: ['Directly publish posts and replies.', 'Schedule your Threads content in advance.'],
        recommended: true,
        warning: "Threads API is new and features may change."
    }]
  },
    { 
    id: SocialPlatformType.Reddit,
    name: 'Reddit', 
    icon: RedditIcon, 
    description: "Share content and join discussions on Reddit communities.", 
    brandColor: "text-orange-500",
    connectionOptions: [{
        type: 'Profile',
        title: 'Reddit Profile',
        description: 'Connect your Reddit profile to post to subreddits.',
        features: ['Post links, text, and media to relevant subreddits.'],
        recommended: true
    }]
  },
  { 
    id: SocialPlatformType.Snapchat,
    name: 'Snapchat', 
    icon: SnapchatIcon, 
    description: "Share snaps and stories with your friends.", 
    brandColor: "text-yellow-400",
    connectionOptions: [{
        type: 'Profile',
        title: 'Snapchat Profile',
        description: 'Connect via notification-based publishing.',
        features: ['Receive reminders to post your content to Snapchat.'],
        recommended: true
    }]
  },
  { 
    id: SocialPlatformType.Discord, 
    name: 'Discord', 
    icon: DiscordIcon, 
    description: "Connect Discord via webhooks to post messages to specific channels.", 
    brandColor: "text-indigo-500",
    connectionOptions: [{
        type: 'Webhook',
        title: 'Discord Webhook',
        description: 'Connect a Discord channel webhook to send automated messages.',
        features: ['Post messages to a specific channel.', 'Schedule announcements or updates.', 'Use markdown for formatting.'],
        recommended: true,
        warning: "This connection requires you to create a webhook in your Discord server settings."
    }]
  },
];

export const MAX_FILE_UPLOAD_SIZE_MB = 10; 
export const CHAT_IMAGE_PREVIEW_MAX_SIZE_BYTES = 100 * 1024; 
export const MAX_FILE_UPLOAD_SIZE_BYTES = MAX_FILE_UPLOAD_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']; 
export const ACCEPTED_CHAT_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES, 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']; 
export const ACCEPTED_MEDIA_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];


export const MAX_TEAM_MEMBERS = 3; 
export const GENERAL_CHAT_CHANNEL_ID = "general";
export const GENERAL_CHAT_CHANNEL_NAME = "#general";

// Font Customization Constants
export const DEFAULT_FONT_FAMILY = 'Roboto'; // Matches a Google Font
export const DEFAULT_FONT_COLOR = '#FFFFFF';

export const CURATED_FONT_OPTIONS: Array<{ value: string; label: string; style: React.CSSProperties }> = [
  { value: 'system-default', label: 'System Default', style: { fontFamily: 'Arial, sans-serif' } },
  { value: 'AI Suggested', label: 'AI Suggested', style: { fontStyle: 'italic', color: '#1E40AF' } },
  { value: 'Roboto', label: 'Roboto', style: { fontFamily: "'Roboto', sans-serif" } },
  { value: 'Open Sans', label: 'Open Sans', style: { fontFamily: "'Open Sans', sans-serif" } },
  { value: 'Lato', label: 'Lato', style: { fontFamily: "'Lato', sans-serif" } },
  { value: 'Montserrat', label: 'Montserrat', style: { fontFamily: "'Montserrat', sans-serif" } },
  { value: 'Impact', label: 'Impact', style: { fontFamily: 'Impact, sans-serif' } },
  { value: 'Anton', label: 'Anton', style: { fontFamily: "'Anton', sans-serif" } },
  { value: 'Bangers', label: 'Bangers', style: { fontFamily: "'Bangers', cursive" } },
  { value: 'Creepster', label: 'Creepster', style: { fontFamily: "'Creepster', cursive" } },
  { value: 'Pacifico', label: 'Pacifico', style: { fontFamily: "'Pacifico', cursive" } },
  { value: 'Lobster', label: 'Lobster', style: { fontFamily: "'Lobster', cursive" } },
];

export const FONT_CATEGORY_MAP: Record<string, string> = {
  'default': DEFAULT_FONT_FAMILY,
  'playful-script': 'Pacifico',
  'bold-impactful': 'Anton',
  'horror-themed': 'Creepster',
  'modern-clean': 'Roboto',
  'comic-fun': 'Bangers',
  'elegant-serif': 'Lato', 
  'retro-script': 'Lobster',
  'sans-serif': 'Open Sans',
  'geometric-sans': 'Montserrat',
  'impactful-display': 'Impact',
};

export const MEME_TEXT_COLOR_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#000000', label: 'Black' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#FF0000', label: 'Red' },
  { value: '#00FF00', label: 'Lime Green' },
  { value: '#00FFFF', label: 'Cyan' },
  { value: '#FF00FF', label: 'Magenta' },
  { value: '#FFC0CB', label: 'Pink' },
  { value: '#FFA500', label: 'Orange' },
];

export const ITEMS_PER_PAGE = 6;