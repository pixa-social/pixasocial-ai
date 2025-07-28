import { AiProviderType } from "./app";

export type Sentiment = 'positive' | 'neutral' | 'negative' | null;

export interface GroundingSource {
  uri: string;
  title: string;
  [key: string]: any;
}

export interface SmartReply {
  id: string;
  text: string;
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

export interface OceanScores {
    creativity: number;
    organization: number;
    sociability: number;
    kindness: number;
    emotionalStability: number;
}

export interface AIPersonaAnalysis {
  explanation: string;
  strategy: string;
}

export interface AIOceanResponse {
  oceanScores: OceanScores;
  analysis: AIPersonaAnalysis;
}

export interface AIComparisonResponse {
  persona1Scores: OceanScores;
  persona2Scores: OceanScores;
  comparisonText: string;
}

export interface AudienceArchetype {
  name: string;
  description: string;
  recommendedStrategy: string;
}

export interface AIAudienceSnapshotResponse {
    averageOceanScores: OceanScores;
    strategicSummary: string;
    archetypes: AudienceArchetype[];
}

export interface AIPersonaDeepDive {
  communicationStyle: string;
  mediaHabits: string;
  motivations: string;
  marketingHooks: string[];
}

export interface AIOperatorEffectivenessAnalysis {
    effectivenessScore: number;
    alignmentAnalysis: string;
    improvementSuggestions: string[];
}

export interface AuditStep {
  id: string;
  title: string;
  description: string;
  content?: string;
  isCompleted: boolean;
  riskAlerts?: string[];
}

export interface AiProviderModelSet {
  text: string[];
  image?: string[];
  chat?: string[];
  embedding?: string[];
}
export interface AiProviderConfig {
  id: AiProviderType;
  name: string;
  api_key: string | null;
  is_enabled: boolean;
  models: AiProviderModelSet;
  notes?: string;
  base_url?: string;
  updated_at?: string;
}

export type AiProviderConfigForExport = Omit<AiProviderConfig, 'api_key'> & { apiKey?: null };


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

export interface AISuggestionRequest {
  prompt: string;
  context?: string;
}

export interface AIParsedJsonResponse<T> {
  data: T | null;
  error?: string;
}