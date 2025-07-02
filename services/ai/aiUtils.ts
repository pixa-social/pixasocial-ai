import { AiProviderConfig, AiProviderType } from "../../types";
import { AI_PROVIDERS_CONFIG_TEMPLATE, LOCAL_STORAGE_AI_CONFIG_KEY } from "../../constants";
import { loadAiProviderConfigsFromSupabase, getActiveAiProviderTypeFromSupabase } from './aiConfigService';

// Get stored AI provider configs, now from Supabase if possible
export const getStoredAiProviderConfigs = async (): Promise<AiProviderConfig[]> => {
  try {
    return await loadAiProviderConfigsFromSupabase();
  } catch (error) {
    console.error("Error fetching configs from Supabase, falling back to local storage:", error);
    const storedConfigs = localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY);
    if (storedConfigs) {
      try {
        return JSON.parse(storedConfigs);
      } catch (e) {
        console.error("Error parsing stored AI configs:", e);
        return AI_PROVIDERS_CONFIG_TEMPLATE;
      }
    }
    return AI_PROVIDERS_CONFIG_TEMPLATE;
  }
};

// Synchronous fallback for getting AI provider configs when async is not possible
export const getStoredAiProviderConfigsSync = (): AiProviderConfig[] => {
  const storedConfigs = localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY);
  if (storedConfigs) {
    try {
      return JSON.parse(storedConfigs);
    } catch (e) {
      console.error("Error parsing stored AI configs synchronously:", e);
      return AI_PROVIDERS_CONFIG_TEMPLATE;
    }
  }
  return AI_PROVIDERS_CONFIG_TEMPLATE;
};

// Get active AI provider type, considering Supabase
export const getActiveAiProviderType = async (): Promise<AiProviderType> => {
  try {
    return await getActiveAiProviderTypeFromSupabase();
  } catch (error) {
    console.error("Error fetching active provider from Supabase, falling back to local storage:", error);
    const storedActiveProvider = localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY) as AiProviderType | null;
    if (storedActiveProvider) {
      return storedActiveProvider;
    }
    return AiProviderType.Gemini; // Default
  }
};

// Synchronous fallback for contexts where async is not possible
export const getActiveAiProviderTypeSync = (): AiProviderType => {
  const storedActiveProvider = localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY) as AiProviderType | null;
  if (storedActiveProvider) {
    return storedActiveProvider;
  }
  return AiProviderType.Gemini; // Default
};

// Get provider config by type
export const getProviderConfig = (providerType: AiProviderType, configs?: AiProviderConfig[]): AiProviderConfig | undefined => {
  const configSet = configs || AI_PROVIDERS_CONFIG_TEMPLATE;
  return configSet.find(p => p.id === providerType);
};

// Get API key for a specific provider
export const getApiKeyForProvider = async (providerType: AiProviderType): Promise<string | null> => {
  const configs = await getStoredAiProviderConfigs();
  const providerConfig = getProviderConfig(providerType, configs);
  return providerConfig?.apiKey || null;
};

// Get model for a specific provider and feature type
export const getModelForProvider = (providerType: AiProviderType, featureType: 'chat' | 'text' | 'image'): string | null => {
  const config = getProviderConfig(providerType);
  if (!config || !config.isEnabled) {
    console.warn(`${providerType} provider is not configured or not enabled.`);
    return null;
  }
  
  switch (featureType) {
    case 'chat':
      return config.models?.chat || null;
    case 'text':
      return config.models?.text || null;
    case 'image':
      return config.models?.image || null;
    default:
      console.warn(`Unknown feature type ${featureType} for provider ${providerType}.`);
      return null;
  }
};

// Handle non-implemented providers
export const handleNonImplementedProvider = (providerType: AiProviderType, feature: string): { error: string } => {
  console.warn(`Provider ${providerType} is not fully implemented for ${feature}.`);
  return { error: `The ${feature} feature is not yet implemented for ${providerType}. Please select a different provider in Admin Panel.` };
};

// Parse JSON from text response, handling code blocks and incomplete JSON
export const parseJsonFromText = (text: string): any => {
  try {
    // First, check if it's already valid JSON
    return JSON.parse(text);
  } catch (e) {
    // If not, try to extract JSON from code blocks or partial JSON
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```|```(?:javascript)?\s*([\s\S]*?)\s*```|{[\s\S]*}/g;
    const matches = Array.from(text.matchAll(jsonRegex));
    
    for (const match of matches) {
      const potentialJson = match[1] || match[2] || match[0];
      if (potentialJson) {
        try {
          // Clean up any trailing commas or incomplete brackets
          const cleanedJson = potentialJson
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/}\s*$/gm, '}')
            .trim();
          return JSON.parse(cleanedJson);
        } catch (error) {
          console.error("Failed to parse extracted JSON:", error);
        }
      }
    }
    
    // If no valid JSON found, return null or throw
    console.warn("No valid JSON found in text response");
    return null;
  }
};
