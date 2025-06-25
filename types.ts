
export enum ViewName {
  Dashboard = 'Dashboard',
  AudienceModeling = 'Audience Modeling',
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
}

// For pages within the authentication flow (before user is logged in)
export type AuthViewType = 'home' | 'login' | 'register';

export interface User {
  id: string;
  name?: string;
  email: string;
  passwordHash: string; // In a real app, this would be a securely hashed password
  walletAddress?: string;
  teamMembers?: string[];
}

export interface NavItem {
  label: string;
  viewName?: ViewName;
  icon?: React.ReactNode;
  children?: NavItem[];
}

export type RSTTraitLevel = 'Not Assessed' | 'Low' | 'Medium' | 'High';

export interface RSTProfile {
  bas: RSTTraitLevel; // Behavioral Approach System
  bis: RSTTraitLevel; // Behavioral Inhibition System
  fffs: RSTTraitLevel; // Fight-Flight-Freeze System
}

export interface Persona {
  id: string;
  name: string;
  demographics: string;
  psychographics: string;
  initialBeliefs: string;
  vulnerabilities?: string[];
  avatarUrl?: string;
  rstProfile?: RSTProfile; 
}

export interface Operator {
  id: string;
  name: string;
  targetAudienceId: string;
  type: 'Hope' | 'Fear' | 'Belonging' | 'Exclusivity' | 'Curiosity' | 'Authority' | 'Novelty' | 'Pride' | 'Nostalgia' | 'Convenience' | 'Custom';
  conditionedStimulus: string;
  unconditionedStimulus:string;
  desiredConditionedResponse: string;
  reinforcementLoop: string;
}

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
  libraryAssetId?: string; 
  memeText?: string;
  processedImageUrl?: string; 

  videoIdea?: string;
}

export type PlatformContentMap = Record<string, PlatformContentDetail>;

export interface ContentDraft {
  id: string;
  operatorId: string;
  personaId: string;
  customPrompt: string;
  platformContents: PlatformContentMap;
}

export interface FeedbackSimulationResult {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  engagementForecast: 'Low' | 'Medium' | 'High';
  potentialRisks?: string[];
}

export interface AuditStep {
  id: string;
  title: string;
  description: string;
  content?: string;
  isCompleted: boolean;
  riskAlerts?: string[];
}

export enum AiProviderType {
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  Anthropic = 'Anthropic',
  Groq = 'Groq',
  Deepseek = 'Deepseek',
  Qwen = 'Qwen',
  Placeholder = 'Placeholder (Not Implemented)',
}

export interface AiProviderModelSet {
  text: string[];
  image?: string[];
  chat?: string[];
}
export interface AiProviderConfig {
  id: AiProviderType;
  name: string;
  apiKey: string | null;
  isEnabled: boolean;
  isGemini?: boolean;
  models: AiProviderModelSet;
  notes?: string;
  baseURL?: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string;
    title?: string;
  };
}

export type ScheduledPostStatus = 'Scheduled' | 'Published' | 'Missed' | 'Cancelled';

export interface ScheduledPostResource {
  contentDraftId: string;
  platformKey: string;
  status: ScheduledPostStatus;
  notes?: string;
  personaId: string;
  operatorId: string;
}
export interface ScheduledPost {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: ScheduledPostResource;
}

export enum SocialPlatformType {
  X = 'X', 
  Facebook = 'Facebook',
  Instagram = 'Instagram',
  LinkedIn = 'LinkedIn',
  Pinterest = 'Pinterest',
  TikTok = 'TikTok',
  YouTube = 'YouTube',
}

export interface ConnectedAccount {
  platform: SocialPlatformType;
  accountId: string; 
  displayName: string; 
  profileImageUrl?: string; 
  connectedAt: string; 
}

export interface ContentLibraryAsset {
  id: string;
  name: string;
  type: 'image' | 'video'; 
  dataUrl: string; 
  fileName: string;
  fileType: string; 
  size: number; 
  uploadedAt: string; 
}

export interface ChatMessageAttachment {
  name: string;
  type: string; 
  size: number; 
  dataUrl?: string; 
}

export interface ChatMessage {
  id: string;
  channelId: string; 
  senderEmail: string;
  senderName: string; 
  timestamp: string; 
  text?: string;
  attachment?: ChatMessageAttachment;
}

export interface CustomChannel {
  id: string;
  name: string; // User-defined channel name, e.g., "#marketing-campaign"
  createdBy: string; // Email of the user who created it
  createdAt: string; // ISO date string
}

export interface CampaignData {
  personas: Persona[];
  operators: Operator[];
  contentDrafts: ContentDraft[];
  scheduledPosts: ScheduledPost[];
  connectedAccounts: ConnectedAccount[]; 
  contentLibraryAssets: ContentLibraryAsset[];
  customChannels: CustomChannel[]; // Added for custom chat channels
  chatMessages: ChatMessage[];
}

export interface AISuggestionRequest {
  prompt: string;
  context?: string;
}

export interface AIParsedJsonResponse<T> {
  data: T | null;
  error?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export interface ToastContextType {
  showToast: (message: string, type: ToastMessage['type'], duration?: number) => void;
}
