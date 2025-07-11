

import { 
    LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, 
    AI_PROVIDERS_CONFIG_TEMPLATE, 
    GEMINI_TEXT_MODEL_NAME, 
    GEMINI_IMAGE_MODEL_NAME,
    LOCAL_STORAGE_GLOBAL_DEFAULT_TEXT_MODEL_KEY,
    LOCAL_STORAGE_GLOBAL_DEFAULT_IMAGE_MODEL_KEY
} from '../../constants';
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
  
  // Merge with template to ensure all providers are present and model lists are up-to-date.
  const configsWithDefaults = AI_PROVIDERS_CONFIG_TEMPLATE.map(templateConfig => {
    const storedConfig = fetchedConfigs.find(sc => sc.id === templateConfig.id);
    if (storedConfig) {
      // The template is the source of truth for name, notes, base_url and available models.
      // The stored config is the source of truth for user settings (API key, enabled status).
      return {
        ...storedConfig, // Start with all user settings from the database
        name: templateConfig.name, // Overwrite with latest from template
        notes: templateConfig.notes, // Overwrite with latest from template
        base_url: templateConfig.base_url, // Overwrite with latest from template
        models: templateConfig.models, // CRITICAL: Always use the model list from the code
      };
    }
    return templateConfig; // No stored config, so use the template as-is.
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

export const getExecutionConfig = async (
    modelType: 'text' | 'image' | 'chat',
    user: UserProfile
  ): Promise<{ provider: AiProviderType; model: string; apiKey: string | null; baseUrl?: string } | null> => {
  
    const allConfigs = await getStoredAiProviderConfigs();
  
    const findProviderForModel = (modelName: string): AiProviderConfig | undefined => {
      return allConfigs.find(p => 
        p.is_enabled && (
          p.models.text?.includes(modelName) ||
          p.models.image?.includes(modelName) ||
          p.models.chat?.includes(modelName)
        )
      );
    };
  
    let targetModel: string | undefined;
    let targetProvider: AiProviderConfig | undefined;
  
    // 1. Check for user-specific assigned model
    if (modelType === 'text' || modelType === 'chat') {
      targetModel = user.assigned_ai_model_text;
    } else if (modelType === 'image') {
      targetModel = user.assigned_ai_model_image;
    }
  
    if (targetModel) {
      targetProvider = findProviderForModel(targetModel);
    }
  
    // 2. If no user model, check for global default model
    if (!targetProvider) {
      const globalDefaultModelKey = modelType === 'image' ? LOCAL_STORAGE_GLOBAL_DEFAULT_IMAGE_MODEL_KEY : LOCAL_STORAGE_GLOBAL_DEFAULT_TEXT_MODEL_KEY;
      targetModel = localStorage.getItem(globalDefaultModelKey) || undefined;
      if (targetModel) {
        targetProvider = findProviderForModel(targetModel);
      }
    }
  
    // 3. If still no provider, fall back to active provider
    if (!targetProvider) {
      const activeProviderType = getActiveAiProviderType();
      targetProvider = allConfigs.find(p => p.id === activeProviderType && p.is_enabled);
      targetModel = undefined; // Reset targetModel so we can pick a default from the active provider
    }
  
    // 4. If no valid provider could be determined, fail
    if (!targetProvider) {
      console.error("Could not determine a valid, enabled AI provider.");
      return null;
    }
  
    // 5. Determine the final model name
    let finalModel = targetModel;
    if (!finalModel) {
      if (targetProvider.id === AiProviderType.Gemini) {
        finalModel = modelType === 'image' ? GEMINI_IMAGE_MODEL_NAME : GEMINI_TEXT_MODEL_NAME;
      } else {
        const providerModels = targetProvider.models;
        if (modelType === 'image') {
          finalModel = providerModels.image?.[0];
        } else { // text or chat
          finalModel = (modelType === 'chat' ? providerModels.chat?.[0] : providerModels.text?.[0]) || providerModels.text?.[0] || providerModels.chat?.[0];
        }
      }
    }
    
    if (!finalModel) {
        console.error(`No suitable model of type '${modelType}' found for provider '${targetProvider.name}'.`);
        return null;
    }
  
    return {
      provider: targetProvider.id,
      model: finalModel,
      apiKey: targetProvider.api_key,
      baseUrl: targetProvider.base_url
    };
};