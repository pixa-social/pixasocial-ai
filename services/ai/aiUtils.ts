import { AiProviderType, AiProviderConfig } from "../../types";
import { AI_PROVIDERS_CONFIG_TEMPLATE, LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, LOCAL_STORAGE_AI_CONFIG_KEY } from "../../constants";

// Cached configs to avoid repeated localStorage access
let cachedAiConfigs: AiProviderConfig[] | null = null;
let cachedActiveProvider: AiProviderType | null = null;

// Load configs from local storage or use default template
const loadAiConfigs = (): AiProviderConfig[] => {
  if (cachedAiConfigs) return cachedAiConfigs;
  
  const localConfigs = localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY);
  cachedAiConfigs = localConfigs ? JSON.parse(localConfigs) : AI_PROVIDERS_CONFIG_TEMPLATE;
  return cachedAiConfigs;
};

// Get active provider type synchronously from local storage if available
export const getActiveAiProviderType = (): AiProviderType => {
  if (cachedActiveProvider) return cachedActiveProvider;
  
  const localActiveProvider = localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY) as AiProviderType | null;
  if (localActiveProvider) {
    cachedActiveProvider = localActiveProvider;
    return localActiveProvider;
  }
  
  // If not in local storage, determine from configs
  const configs = loadAiConfigs();
  const enabledConfigs = configs.filter(c => c.isEnabled);
  if (enabledConfigs.length > 0) {
    const geminiConfig = enabledConfigs.find(c => c.id === AiProviderType.Gemini);
    cachedActiveProvider = geminiConfig ? AiProviderType.Gemini : enabledConfigs[0].id;
  } else {
    cachedActiveProvider = AiProviderType.Gemini; // Default fallback
  }
  
  localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, cachedActiveProvider);
  return cachedActiveProvider;
};

// Get provider config by type
export const getProviderConfig = (providerType: AiProviderType): AiProviderConfig | undefined => {
  const configs = loadAiConfigs();
  return configs.find(config => config.id === providerType);
};

// Get API key for a provider
export const getApiKeyForProvider = (providerType: AiProviderType): string | null => {
  const config = getProviderConfig(providerType);
  return config && config.isEnabled ? config.apiKey || null : null;
};

// Get appropriate model for a provider based on task type
export const getModelForProvider = (providerType: AiProviderType, taskType: 'text' | 'chat' | 'image' | 'json' = 'text'): string | null => {
  const config = getProviderConfig(providerType);
  if (!config || !config.isEnabled) return null;
  
  const models = config.models;
  if (!models) return null;
  
  // For OpenAI-compatible, 'chat' is used for text generation with OpenAI SDK
  if (taskType === 'chat' && models.chat && models.chat.length > 0) {
    return models.chat[0];
  }
  
  // For image generation
  if (taskType === 'image' && models.image && models.image.length > 0) {
    return models.image[0];
  }
  
  // Default to text models (also used for JSON tasks)
  return models.text && models.text.length > 0 ? models.text[0] : null;
};

// Handle non-implemented providers with a user-friendly message
export const handleNonImplementedProvider = (providerType: AiProviderType, feature: string): { error: string } => {
  const config = getProviderConfig(providerType);
  const providerName = config?.name || providerType;
  return {
    error: `The ${feature} feature is not yet implemented for ${providerName}. Please select a different provider in the Admin Panel.`,
  };
};

// Parse JSON from text response, handling potential errors
export const parseJsonFromText = <T,>(text: string): { data: T | null; error?: string } => {
  try {
    // Attempt to extract JSON from code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    const parsed = JSON.parse(jsonText);
    return { data: parsed as T };
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", e);
    return { data: null, error: `Failed to parse JSON from response: ${text.substring(0, 100)}...` };
  }
};

// Reset cached values (useful for logout or config changes)
export const resetAiConfigCache = (): void => {
  cachedAiConfigs = null;
  cachedActiveProvider = null;
};

// Get stored AI provider configs synchronously
export const getStoredAiProviderConfigsSync = (): AiProviderConfig[] => {
  return loadAiConfigs();
};
