
import { LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, AI_PROVIDERS_CONFIG_TEMPLATE } from '../../constants';
import { AIParsedJsonResponse, AiProviderType, AiProviderConfig, UserProfile } from "../../types";
import { supabase } from '../supabaseClient';

// --- Helper functions to manage AI provider configurations ---

let globalAiConfigCache: AiProviderConfig[] | null = null;
let lastCacheFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getStoredAiProviderConfigs = async (forceRefetch = false): Promise<AiProviderConfig[]> => {
  const now = Date.now();
  if (!forceRefetch && globalAiConfigCache && (now - lastCacheFetchTime < CACHE_DURATION)) {
    return globalAiConfigCache;
  }

  const { data, error } = await supabase.from('ai_provider_global_configs').select('*');
  if (error) {
    console.error("Error fetching global AI configs, returning template:", error);
    // Return template but don't cache it
    return AI_PROVIDERS_CONFIG_TEMPLATE;
  }
  
  const fetchedConfigs = data as AiProviderConfig[];
  
  // Merge with template to ensure all providers are present
  const configsWithDefaults = AI_PROVIDERS_CONFIG_TEMPLATE.map(templateConfig => {
    const storedConfig = fetchedConfigs.find(sc => sc.id === templateConfig.id);
    return storedConfig ? { ...templateConfig, ...storedConfig } : templateConfig;
  });

  globalAiConfigCache = configsWithDefaults;
  lastCacheFetchTime = now;
  return configsWithDefaults;
};

export const getActiveAiProviderType = (): AiProviderType => {
  // This remains client-side preference, but we could move it to user profiles later
  return (localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY) as AiProviderType) || AiProviderType.Gemini;
};

export const getProviderConfig = async (providerType: AiProviderType): Promise<AiProviderConfig | undefined> => {
    const configs = await getStoredAiProviderConfigs();
    return configs.find(c => c.id === providerType);
};

export const getApiKeyForProvider = async (providerType: AiProviderType): Promise<string | null> => {
  const config = await getProviderConfig(providerType);
  if (!config || !config.is_enabled) return null;
  return config.api_key || null;
};

export const parseJsonFromText = <T,>(text: string): AIParsedJsonResponse<T> => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    const parsedData = JSON.parse(jsonStr);
    return { data: parsedData };
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original text:", text);
    return { data: null, error: `Failed to parse JSON: ${(e as Error).message}. Original text: ${text.slice(0,100)}...` };
  }
};

export const handleNonImplementedProvider = async (providerType: AiProviderType, feature: string = "AI"): Promise<{ error: string }> => {
  const providerConfig = await getProviderConfig(providerType);
  const errorMsg = `${feature} features for '${providerConfig?.name || providerType}' are not implemented or supported client-side. Select a different provider or update the AI service.`;
  console.warn(errorMsg);
  return { error: errorMsg };
};

export const getModelForProvider = async (
  providerType: AiProviderType, 
  modelType: 'text' | 'image' | 'chat',
  user: UserProfile
): Promise<string | null> => {
    // Check for user-specific override first
    if (modelType === 'text' && user.assigned_ai_model_text) {
        return user.assigned_ai_model_text;
    }
    if (modelType === 'image' && user.assigned_ai_model_image) {
        return user.assigned_ai_model_image;
    }

    // Fallback to global config
    const config = await getProviderConfig(providerType);
    if (!config || !config.is_enabled) {
        console.warn(`Provider ${providerType} is not configured or not enabled.`);
        return null;
    }
    
    const models = config.models[modelType];
    if (models && models.length > 0) {
        return models[0]; // Default to the first model in the list
    }
    // Fallback logic for chat/text models
    if (modelType === 'chat' && config.models.text && config.models.text.length > 0) {
        return config.models.text[0];
    }
    if (modelType === 'text' && config.models.chat && config.models.chat.length > 0) {
        return config.models.chat[0];
    }
    console.warn(`No suitable ${modelType} model found for provider ${providerType} in configuration.`);
    return null;
}
