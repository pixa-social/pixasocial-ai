
import { AIParsedJsonResponse, GroundingChunk, AiProviderType, UserProfile } from "../types";
import { getActiveAiProviderType, handleNonImplementedProvider, getApiKeyForProvider, getModelForProvider } from './ai/aiUtils';
import * as GeminiService from './ai/geminiAIService';
import * as OpenAICompatibleService from './ai/openAICompatibleAIService';
import { supabase } from './supabaseClient';

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

  const activeProviderType = getActiveAiProviderType();
  const apiKey = await getApiKeyForProvider(activeProviderType);
  if (!apiKey) return { text: null, error: `API Key for ${activeProviderType} is not configured.` };

  const modelName = await getModelForProvider(activeProviderType, 'text', user);
  if (!modelName) return { text: null, error: `Text model for ${activeProviderType} is not configured.` };


  switch (activeProviderType) {
    case AiProviderType.Gemini:
      return GeminiService.generateTextInternal(prompt, apiKey, modelName, systemInstruction);
    case AiProviderType.OpenAI:
    case AiProviderType.Deepseek:
    case AiProviderType.Groq:
    case AiProviderType.Openrouter:
    case AiProviderType.MistralAI:
      const result = await OpenAICompatibleService.generateTextInternal(activeProviderType, apiKey, modelName, prompt, systemInstruction);
      return { ...result, groundingChunks: [] };
    default:
      const res = await handleNonImplementedProvider(activeProviderType, "Text generation");
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
  
  const activeProviderType = getActiveAiProviderType();
  const apiKey = await getApiKeyForProvider(activeProviderType);
  if (!apiKey) return { text: null, error: `API Key for ${activeProviderType} is not configured.` };

  const modelName = await getModelForProvider(activeProviderType, 'text', user);
  if (!modelName) return { text: null, error: `Text model for ${activeProviderType} is not configured.` };

  if (activeProviderType === AiProviderType.Gemini) {
    return GeminiService.generateTextWithGoogleSearchInternal(prompt, apiKey, modelName, systemInstruction);
  } else {
    console.warn(`Google Search grounding is a Gemini-specific feature. ${activeProviderType} does not support it.`);
    return { text: null, error: `Google Search grounding is only available for Gemini. Current provider: ${activeProviderType}`, groundingChunks: [] };
  }
};

export const generateJson = async <T,>(
  prompt: string,
  user: UserProfile,
  systemInstruction?: string
): Promise<AIParsedJsonResponse<T> & { groundingChunks?: GroundingChunk[] }> => {
  const usageCheck = await checkAndIncrementUsage(user);
  if (!usageCheck.allowed) return { data: null, error: usageCheck.error, groundingChunks: [] };
  
  const activeProviderType = getActiveAiProviderType();
  const apiKey = await getApiKeyForProvider(activeProviderType);
  if (!apiKey) return { data: null, error: `API Key for ${activeProviderType} is not configured.` };

  const modelName = await getModelForProvider(activeProviderType, 'text', user);
  if (!modelName) return { data: null, error: `Text model for ${activeProviderType} is not configured.` };

  switch (activeProviderType) {
    case AiProviderType.Gemini:
      return GeminiService.generateJsonInternal<T>(prompt, apiKey, modelName, systemInstruction);
    case AiProviderType.OpenAI:
    case AiProviderType.Deepseek:
    case AiProviderType.Groq:
    case AiProviderType.Openrouter:
    case AiProviderType.MistralAI:
      const result = await OpenAICompatibleService.generateJsonInternal<T>(activeProviderType, apiKey, modelName, prompt, systemInstruction);
      return { ...result, groundingChunks: [] };
    default:
      const res = await handleNonImplementedProvider(activeProviderType, "JSON generation");
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

  const activeProviderType = getActiveAiProviderType();
  const apiKey = await getApiKeyForProvider(activeProviderType);
  if (!apiKey) return { images: null, error: `API Key for ${activeProviderType} is not configured.` };

  const modelName = await getModelForProvider(activeProviderType, 'image', user);
  if (!modelName) return { images: null, error: `Image model for ${activeProviderType} is not configured.` };


  switch (activeProviderType) {
    case AiProviderType.Gemini:
      return GeminiService.generateImagesInternal(prompt, apiKey, modelName, numberOfImages);
    case AiProviderType.OpenAI:
      return OpenAICompatibleService.generateOpenAIImagesInternal(prompt, apiKey, modelName, numberOfImages);
    default:
      const res = await handleNonImplementedProvider(activeProviderType, "Image generation");
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
  
  const activeProviderType = getActiveAiProviderType();
  const apiKey = await getApiKeyForProvider(activeProviderType);
  if (!apiKey) { onError(`API Key for ${activeProviderType} is not configured.`); return; }
  
  const modelName = await getModelForProvider(activeProviderType, 'chat', user);
  if (!modelName) { onError(`Chat model for ${activeProviderType} is not configured.`); return; }

  switch (activeProviderType) {
    case AiProviderType.Gemini:
      return GeminiService.generateTextStreamInternal(prompt, apiKey, modelName, onStreamChunk, onStreamComplete, onError, systemInstruction);
    case AiProviderType.OpenAI:
    case AiProviderType.Deepseek:
    case AiProviderType.Groq:
    case AiProviderType.Openrouter:
    case AiProviderType.MistralAI:
      return OpenAICompatibleService.generateTextStreamInternal(activeProviderType, apiKey, modelName, prompt, onStreamChunk, onStreamComplete, onError, systemInstruction);
    default:
      const res = await handleNonImplementedProvider(activeProviderType, "Streaming text generation");
      onError(res.error);
  }
};