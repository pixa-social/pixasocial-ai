



import { 
    AI_PROVIDERS_CONFIG_TEMPLATE, 
    GEMINI_TEXT_MODEL_NAME, 
    GEMINI_IMAGE_MODEL_NAME
} from '../../constants';
import { AIParsedJsonResponse, AiProviderConfig, AiProviderModelSet } from "../../types/ai";
import { AiProviderType } from "../../types/app";
import { UserProfile } from "../../types/user";
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

  const { data: dbConfigs, error } = await supabase.from('ai_provider_global_configs').select('*');
  
  if (error) {
    console.error("Error fetching global AI configs, returning template:", error.message);
    // Return template but don't cache it
    return AI_PROVIDERS_CONFIG_TEMPLATE;
  }
  
  const finalConfigs = AI_PROVIDERS_CONFIG_TEMPLATE.map(templateConfig => {
    const dbConfig = (dbConfigs || []).find(dbc => dbc.id === templateConfig.id);
    
    // Start with the template as the base
    const mergedConfig = { ...templateConfig };

    // If there's a config in the DB, overwrite applicable fields
    if (dbConfig) {
      mergedConfig.api_key = dbConfig.api_key;
      mergedConfig.is_enabled = dbConfig.is_enabled;
      
      // If the DB has a non-empty model list, use it. Otherwise, stick with the template's.
      const dbModels = dbConfig.models as AiProviderModelSet;
      if (dbModels && (dbModels.text?.length || dbModels.image?.length || dbModels.chat?.length || dbModels.embedding?.length)) {
        mergedConfig.models = {
          text: dbModels.text || [],
          image: dbModels.image || [],
          chat: dbModels.chat || [],
          embedding: dbModels.embedding || [],
        };
      }
    }
    
    return mergedConfig;
  });

  globalAiConfigCache = finalConfigs;
  lastCacheFetchTime = now;
  return finalConfigs;
};

let globalSettingsCache: { 
    active_ai_provider: string; 
    global_default_text_model: string | null; 
    global_default_image_model: string | null;
    global_default_chat_model: string | null;
    global_default_embedding_model: string | null;
} | null = null;
let lastGlobalSettingsFetchTime = 0;
const GLOBAL_SETTINGS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getGlobalAiSettings = async (forceRefetch = false) => {
  const now = Date.now();
  if (!forceRefetch && globalSettingsCache && (now - lastGlobalSettingsFetchTime < GLOBAL_SETTINGS_CACHE_DURATION)) {
    return globalSettingsCache;
  }

  try {
    const { data, error } = await supabase.functions.invoke('get-global-ai-settings');
    
    if (error) {
      throw error;
    }
    
    if (data.error) {
      // Error from within the function logic
      throw new Error(data.error);
    }

    const settings = data || { active_ai_provider: 'Gemini', global_default_text_model: null, global_default_image_model: null, global_default_chat_model: null, global_default_embedding_model: null };
    globalSettingsCache = settings;
    lastGlobalSettingsFetchTime = now;
    return settings;

  } catch(e) {
    console.error("Error fetching global AI settings:", (e as Error).message);
    return { active_ai_provider: 'Gemini', global_default_text_model: null, global_default_image_model: null, global_default_chat_model: null, global_default_embedding_model: null }; // Fallback
  }
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
  
  // Regex to find a JSON code block, allowing for surrounding text.
  // It captures the content inside ```json ... ``` or ``` ... ```.
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = jsonStr.match(fenceRegex);

  if (match && match[1]) {
    // If a fenced code block is found, use its content.
    jsonStr = match[1].trim();
  } else {
    // Fallback for cases where there might be no fence but it's just a JSON object.
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    // Models sometimes include comments which are not valid JSON.
    // This regex removes single-line JS-style comments. It's a common error.
    const jsonWithoutComments = jsonStr.replace(/\/\/.*/g, '');
    const parsedData = JSON.parse(jsonWithoutComments);
    return { data: parsedData };
  } catch (e) {
    // If the above fails, it might be due to other invalid syntax like unquoted text.
    // We log the error and return a failure state. Trying to "fix" arbitrary invalid JSON
    // is brittle and can lead to unexpected data corruption. The fix should be in the prompt.
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
    modelType: 'text' | 'image' | 'chat' | 'embedding',
    user: UserProfile
  ): Promise<{ provider: AiProviderType; model: string; apiKey: string | null; baseUrl?: string } | null> => {
  
    const allConfigs = await getStoredAiProviderConfigs();
    const globalSettings = await getGlobalAiSettings();
  
    const findProviderForModel = (modelName: string): AiProviderConfig | undefined => {
      return allConfigs.find(p => 
        p.is_enabled && (
          p.models.text?.includes(modelName) ||
          p.models.image?.includes(modelName) ||
          p.models.chat?.includes(modelName) ||
          p.models.embedding?.includes(modelName)
        )
      );
    };
  
    let targetModel: string | undefined;
    let targetProvider: AiProviderConfig | undefined;
  
    // 1. User-specific override
    if ((modelType === 'text' || modelType === 'chat') && user.assigned_ai_model_text) {
        targetModel = user.assigned_ai_model_text;
    } else if (modelType === 'image' && user.assigned_ai_model_image) {
        targetModel = user.assigned_ai_model_image;
    }

    if (targetModel) {
        targetProvider = findProviderForModel(targetModel);
    }
  
    // 2. Global default override
    if (!targetProvider) {
        switch (modelType) {
            case 'text': targetModel = globalSettings.global_default_text_model || undefined; break;
            case 'image': targetModel = globalSettings.global_default_image_model || undefined; break;
            case 'chat': targetModel = globalSettings.global_default_chat_model || undefined; break;
            case 'embedding': targetModel = globalSettings.global_default_embedding_model || undefined; break;
        }
        if (targetModel) {
            targetProvider = findProviderForModel(targetModel);
        }
    }
  
    // 3. Fallback to active provider
    if (!targetProvider) {
      const activeProviderType = globalSettings.active_ai_provider as AiProviderType;
      targetProvider = allConfigs.find(p => p.id === activeProviderType && p.is_enabled);
      targetModel = undefined; // Reset model, we'll pick the provider's default
    }
  
    // 4. No valid provider found
    if (!targetProvider) {
      console.error("Could not determine a valid, enabled AI provider.");
      return null;
    }
  
    // 5. Determine the final model name
    let finalModel = targetModel;
    if (!finalModel) {
        const providerModels = targetProvider.models;
        switch (modelType) {
            case 'text': finalModel = providerModels.text?.[0]; break;
            case 'image': finalModel = providerModels.image?.[0]; break;
            case 'chat': finalModel = providerModels.chat?.[0] || providerModels.text?.[0]; break;
            case 'embedding': finalModel = providerModels.embedding?.[0]; break;
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