import { supabase } from '../supabaseClient';
import { AiProviderConfig, AiProviderType } from '../../types';
import { AI_PROVIDERS_CONFIG_TEMPLATE, LOCAL_STORAGE_AI_CONFIG_KEY, LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY } from '../../constants';

// Simple encryption function (you might want to use a more robust library in production)
const encryptApiKey = (apiKey: string | null): string | null => {
  if (!apiKey) return null;
  // This is a placeholder for encryption logic. In a real app, use a library like 'crypto-js' or server-side encryption.
  // For now, we'll store it as base64 to simulate encryption.
  return btoa(apiKey);
};

const decryptApiKey = (encryptedApiKey: string | null): string | null => {
  if (!encryptedApiKey) return null;
  // Placeholder for decryption logic.
  return atob(encryptedApiKey);
};

// Load AI provider configs from Supabase for the logged-in user
export const loadAiProviderConfigsFromSupabase = async (): Promise<AiProviderConfig[]> => {
  try {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user) {
      console.error('Error fetching user data or user not logged in:', error);
      // Fallback to local storage if user is not logged in
      const localConfigs = localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY);
      return localConfigs ? JSON.parse(localConfigs) : AI_PROVIDERS_CONFIG_TEMPLATE;
    }

    const userId = userData.user.id;
    const { data, error: configsError } = await supabase
      .from('ai_provider_user_configs')
      .select('*')
      .eq('user_id', userId);

    if (configsError) {
      console.error('Error loading AI configs from Supabase:', configsError);
      // Fallback to local storage or default template
      const localConfigs = localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY);
      return localConfigs ? JSON.parse(localConfigs) : AI_PROVIDERS_CONFIG_TEMPLATE;
    }

    if (!data || data.length === 0) {
      // If no configs in Supabase, return default template
      return AI_PROVIDERS_CONFIG_TEMPLATE;
    }

    // Map Supabase data to AiProviderConfig, decrypting API keys
    return data.map(config => ({
      id: config.provider_id as AiProviderType,
      name: config.provider_id,
      apiKey: decryptApiKey(config.encrypted_api_key),
      isEnabled: config.is_enabled,
      models: config.models || { text: [] },
      baseURL: config.base_url || undefined,
      isGemini: config.provider_id === AiProviderType.Gemini,
      notes: config.notes || undefined,
    }));
  } catch (error) {
    console.error('Unexpected error loading AI configs from Supabase:', error);
    // Fallback to local storage or default
    const localConfigs = localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY);
    return localConfigs ? JSON.parse(localConfigs) : AI_PROVIDERS_CONFIG_TEMPLATE;
  }
};

// Save AI provider configs to Supabase for the logged-in user
export const saveAiProviderConfigsToSupabase = async (configs: AiProviderConfig[], activeProvider: AiProviderType): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user) {
      console.error('User not logged in, cannot save to Supabase:', error);
      // Fallback to local storage
      localStorage.setItem(LOCAL_STORAGE_AI_CONFIG_KEY, JSON.stringify(configs));
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, activeProvider);
      return { success: false, error: 'User not logged in. Saved to local storage instead.' };
    }

    const userId = userData.user.id;
    const configsToSave = configs.map(config => ({
      user_id: userId,
      provider_id: config.id,
      encrypted_api_key: encryptApiKey(config.apiKey),
      is_enabled: config.isEnabled,
      models: config.models,
      base_url: config.baseURL || null,
    }));

    // Use upsert to update existing configs or insert new ones
    const { error: upsertError } = await supabase
      .from('ai_provider_user_configs')
      .upsert(configsToSave, { onConflict: 'user_id,provider_id' });

    if (upsertError) {
      console.error('Error saving AI configs to Supabase:', upsertError);
      // Fallback to local storage
      localStorage.setItem(LOCAL_STORAGE_AI_CONFIG_KEY, JSON.stringify(configs));
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, activeProvider);
      return { success: false, error: `Failed to save to Supabase: ${upsertError.message}. Saved to local storage instead.` };
    }

    // If successful, also save active provider to local storage for quick access
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, activeProvider);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error saving AI configs to Supabase:', error);
    // Fallback to local storage
    localStorage.setItem(LOCAL_STORAGE_AI_CONFIG_KEY, JSON.stringify(configs));
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, activeProvider);
    return { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}. Saved to local storage instead.` };
  }
};

// Load active provider, considering Supabase configs
export const getActiveAiProviderTypeFromSupabase = async (): Promise<AiProviderType> => {
  const localActiveProvider = localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY) as AiProviderType | null;
  if (localActiveProvider) {
    return localActiveProvider;
  }

  // If not in local storage, load configs from Supabase and determine the active provider
  const configs = await loadAiProviderConfigsFromSupabase();
  const enabledConfigs = configs.filter(c => c.isEnabled);
  if (enabledConfigs.length > 0) {
    const geminiConfig = enabledConfigs.find(c => c.id === AiProviderType.Gemini);
    const activeProvider = geminiConfig ? AiProviderType.Gemini : enabledConfigs[0].id;
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, activeProvider);
    return activeProvider;
  }

  return AiProviderType.Gemini; // Default fallback
};
