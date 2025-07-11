

import { AIParsedJsonResponse, GroundingChunk, AiProviderType, UserProfile } from "../types";
import { handleNonImplementedProvider, getExecutionConfig } from './ai/aiUtils';
import * as GeminiService from './ai/geminiAIService';
import * as OpenAICompatibleService from './ai/openAICompatibleAIService';
import { supabase } from './supabaseClient';
import { supabase as sb } from './supabaseClient';

const checkAndIncrementUsage = async (user: UserProfile): Promise<{allowed: boolean, error?: string}> => {
    if (user.ai_usage_count_monthly >= user.role.max_ai_uses_monthly) {
        return { 
            allowed: false, 
            error: `You have exceeded your monthly AI usage limit (${user.role.max_ai_uses_monthly}) for the '${user.role.name}' plan.` 
        };
    }
    
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ ai_usage_count_monthly: user.ai_usage_count_monthly + 1 })
        .eq('id', user.id);

    if (updateError) {
        console.error("Failed to increment AI usage count:", updateError);
        // Allow the call but log the error, this indicates a potential issue with the DB/RLS.
    } else {
        // This is a client-side update to avoid a full re-fetch for this single call.
        // The global state will be properly updated on the next full profile fetch.
        user.ai_usage_count_monthly++;
    }

    return { allowed: true };
}


// --- Unified Text Generation ---
export const generateText = async (
  prompt: string,
  user: UserProfile,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const usageCheck = await checkAndIncrementUsage(user);
  if (!usageCheck.allowed) return { text: null, error: usageCheck.error, groundingChunks: [] };

  const execConfig = await getExecutionConfig('text', user);

  if (!execConfig) {
    return { text: null, error: "Could not determine a valid AI model configuration. Check Admin Panel settings.", groundingChunks: [] };
  }
  
  const { provider, model, apiKey } = execConfig;

  if (!apiKey) {
    return { text: null, error: `API Key for ${provider} is not configured.`, groundingChunks: [] };
  }

  switch (provider) {
    case AiProviderType.Gemini:
      return GeminiService.generateTextInternal(prompt, apiKey, model, systemInstruction);
    case AiProviderType.OpenAI:
    case AiProviderType.Deepseek:
    case AiProviderType.Groq:
    case AiProviderType.Openrouter:
    case AiProviderType.MistralAI:
      const result = await OpenAICompatibleService.generateTextInternal(provider, apiKey, model, prompt, systemInstruction);
      return { ...result, groundingChunks: [] };
    default:
      const res = await handleNonImplementedProvider(provider, "Text generation");
      return { text: null, error: res.error, groundingChunks: [] };
  }
};

export const generateTextWithGoogleSearch = async (
  prompt: string,
  user: UserProfile,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const usageCheck = await checkAndIncrementUsage(user);
  if (!usageCheck.allowed) return { text: null, error: usageCheck.error, groundingChunks: [] };
  
  const execConfig = await getExecutionConfig('text', user);

  if (!execConfig) {
    return { text: null, error: "Could not determine a valid AI model configuration. Check Admin Panel settings.", groundingChunks: [] };
  }

  const { provider, model, apiKey } = execConfig;

  if (!apiKey) return { text: null, error: `API Key for ${provider} is not configured.`, groundingChunks: [] };

  if (provider === AiProviderType.Gemini) {
    return GeminiService.generateTextWithGoogleSearchInternal(prompt, apiKey, model, systemInstruction);
  } else {
    console.warn(`Google Search grounding is a Gemini-specific feature. ${provider} does not support it.`);
    return { text: null, error: `Google Search grounding is only available for Gemini. Current provider: ${provider}`, groundingChunks: [] };
  }
};

export const generateJson = async <T,>(
  prompt: string,
  user: UserProfile,
  systemInstruction?: string
): Promise<AIParsedJsonResponse<T> & { groundingChunks?: GroundingChunk[] }> => {
  const usageCheck = await checkAndIncrementUsage(user);
  if (!usageCheck.allowed) return { data: null, error: usageCheck.error, groundingChunks: [] };
  
  const execConfig = await getExecutionConfig('text', user);

  if (!execConfig) {
    return { data: null, error: "Could not determine a valid AI model configuration for JSON generation. Check Admin Panel settings.", groundingChunks: [] };
  }

  const { provider, model, apiKey } = execConfig;

  if (!apiKey) return { data: null, error: `API Key for ${provider} is not configured.`, groundingChunks: [] };

  switch (provider) {
    case AiProviderType.Gemini:
      return GeminiService.generateJsonInternal<T>(prompt, apiKey, model, systemInstruction);
    case AiProviderType.OpenAI:
    case AiProviderType.Deepseek:
    case AiProviderType.Groq:
    case AiProviderType.Openrouter:
    case AiProviderType.MistralAI:
      const result = await OpenAICompatibleService.generateJsonInternal<T>(provider, apiKey, model, prompt, systemInstruction);
      return { ...result, groundingChunks: [] };
    default:
      const res = await handleNonImplementedProvider(provider, "JSON generation");
      return { data: null, error: res.error, groundingChunks: [] };
  }
};

export const generateImages = async (
  prompt: string,
  user: UserProfile,
  numberOfImages: number = 1,
): Promise<{ images: string[] | null; error?: string }> => {
  const usageCheck = await checkAndIncrementUsage(user);
  if (!usageCheck.allowed) return { images: null, error: usageCheck.error };

  const execConfig = await getExecutionConfig('image', user);

  if (!execConfig) {
    return { images: null, error: "Could not determine a valid AI model configuration for Image generation. Check Admin Panel settings." };
  }
  
  const { provider, model, apiKey } = execConfig;

  if (!apiKey) return { images: null, error: `API Key for ${provider} is not configured.` };
  
  switch (provider) {
    case AiProviderType.Gemini:
      return GeminiService.generateImagesInternal(prompt, apiKey, model, numberOfImages);
    case AiProviderType.OpenAI:
      return OpenAICompatibleService.generateOpenAIImagesInternal(prompt, apiKey, model, numberOfImages);
    default:
      const res = await handleNonImplementedProvider(provider, "Image generation");
      return { images: null, error: res.error };
  }
};

export const generateTextStream = async (
  prompt: string,
  user: UserProfile,
  onStreamChunk: (chunkText: string) => void,
  onStreamComplete: (fullText: string) => void,
  onError: (error: string) => void,
  systemInstruction?: string
): Promise<void> => {
  const usageCheck = await checkAndIncrementUsage(user);
  if (!usageCheck.allowed && usageCheck.error) {
    onError(usageCheck.error);
    return;
  }
  
  const execConfig = await getExecutionConfig('chat', user);

  if (!execConfig) {
    onError("Could not determine a valid AI model configuration for streaming chat. Check Admin Panel settings.");
    return;
  }
  
  const { provider, model, apiKey } = execConfig;

  if (!apiKey) { onError(`API Key for ${provider} is not configured.`); return; }
  
  switch (provider) {
    case AiProviderType.Gemini:
      return GeminiService.generateTextStreamInternal(prompt, apiKey, model, onStreamChunk, onStreamComplete, onError, systemInstruction);
    case AiProviderType.OpenAI:
    case AiProviderType.Deepseek:
    case AiProviderType.Groq:
    case AiProviderType.Openrouter:
    case AiProviderType.MistralAI:
      return OpenAICompatibleService.generateTextStreamInternal(provider, apiKey, model, prompt, onStreamChunk, onStreamComplete, onError, systemInstruction);
    default:
      const res = await handleNonImplementedProvider(provider, "Streaming text generation");
      onError(res.error);
  }
};