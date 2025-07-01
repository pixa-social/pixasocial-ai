import { LOCAL_STORAGE_AI_CONFIG_KEY, LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, AI_PROVIDERS_CONFIG_TEMPLATE } from '../../constants';
import { AIParsedJsonResponse, GroundingChunk, AiProviderType, AiProviderConfig } from "../../types";

// --- Helper functions to manage AI provider configurations ---
export const getStoredAiProviderConfigs = (): AiProviderConfig[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY);
  if (stored) {
    try {
      const parsedConfigs = JSON.parse(stored) as AiProviderConfig[];
      // Ensure all template providers are present and merge stored data
      const configsWithDefaults = AI_PROVIDERS_CONFIG_TEMPLATE.map(templateConfig => {
        const storedConfig = parsedConfigs.find(sc => sc.id === templateConfig.id);
        return storedConfig ? { ...templateConfig, ...storedConfig } : templateConfig;
      });
      return configsWithDefaults;
    } catch (e) {
      console.error("Error parsing stored AI configs, returning template:", e);
      return AI_PROVIDERS_CONFIG_TEMPLATE;
    }
  }
  return AI_PROVIDERS_CONFIG_TEMPLATE;
};

export const getActiveAiProviderType = (): AiProviderType => {
  const activeProviderId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY) as AiProviderType;
  const configs = getStoredAiProviderConfigs();
  const activeConfig = configs.find(c => c.id === activeProviderId && c.isEnabled);

  if (activeConfig) {
    return activeConfig.id;
  }
  // Fallback logic if active provider is not enabled or not found
  const geminiConfig = configs.find(c => c.id === AiProviderType.Gemini && c.isEnabled);
  if (geminiConfig) return AiProviderType.Gemini;
  
  const firstEnabled = configs.find(c => c.isEnabled);
  if (firstEnabled) return firstEnabled.id;
  
  // Ultimate fallback if nothing is enabled (though AdminPanel tries to prevent this)
  return AiProviderType.Gemini; 
};

export const getProviderConfig = (providerType: AiProviderType): AiProviderConfig | undefined => {
    const configs = getStoredAiProviderConfigs();
    return configs.find(c => c.id === providerType);
};

export const getApiKeyForProvider = (providerType: AiProviderType): string | null => {
  const config = getProviderConfig(providerType);
  if (!config || !config.isEnabled) return null;

  if (providerType === AiProviderType.Gemini) {
    // For Gemini, prioritize explicitly set key in config, then env var
    if (config.apiKey && config.apiKey.trim() !== "") return config.apiKey;
    // Check for process.env.API_KEY if available in the execution context
    // In a pure client-side context, process.env might not be directly available as expected in Node.js
    // This check is more for environments where it might be polyfilled or set.
    // If process.env is not defined or API_KEY is not on it, this will be falsy.
    const envApiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : null;
    return envApiKey || null; 
  }
  return config.apiKey || null;
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

export const handleNonImplementedProvider = (providerType: AiProviderType, feature: string = "AI"): { error: string } => {
  const providerConfig = getProviderConfig(providerType);
  const errorMsg = `${feature} features for '${providerConfig?.name || providerType}' are not implemented or supported client-side. Select a different provider or update the AI service.`;
  console.warn(errorMsg);
  return { error: errorMsg };
};

export const getModelForProvider = (providerType: AiProviderType, modelType: 'text' | 'image' | 'chat'): string | null => {
    const config = getProviderConfig(providerType);
    if (!config || !config.isEnabled) {
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
