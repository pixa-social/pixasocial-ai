
import { AIParsedJsonResponse, UserProfile, AiProviderType } from "../types";
import { Database } from "../types/supabase";
import { getExecutionConfig } from './ai/aiUtils';
import { supabase } from './supabaseClient';
import { parseJsonFromText } from './ai/aiUtils';

const checkAndIncrementUsage = async (user: UserProfile): Promise<{allowed: boolean, error?: string}> => {
    if (user.ai_usage_count_monthly >= user.role.max_ai_uses_monthly) {
        return { 
            allowed: false, 
            error: `You have exceeded your monthly AI usage limit (${user.role.max_ai_uses_monthly}) for the '${user.role.name}' plan. Please upgrade your plan to continue.` 
        };
    }
    
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
        ai_usage_count_monthly: user.ai_usage_count_monthly + 1
    };

    const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);

    if (updateError) {
        console.error("Failed to increment AI usage count:", updateError);
    } else {
        // This is a client-side update to keep the UI in sync without re-fetching
        const updatedUser = { ...user, ai_usage_count_monthly: user.ai_usage_count_monthly + 1 };
        // The logic to update the user state would be in the component that calls this service.
        // For now, we can assume the caller will handle the state update.
    }

    return { allowed: true };
}


// --- Unified Text Generation ---
export const generateText = async (
  prompt: string,
  user: UserProfile,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; }> => {
  const usageCheck = await checkAndIncrementUsage(user);
  if (!usageCheck.allowed) return { text: null, error: usageCheck.error };

  const execConfig = await getExecutionConfig('text', user);
  if (!execConfig) {
    return { text: null, error: "Could not determine a valid AI model configuration. Check Admin Panel settings." };
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
            task: 'generateText',
            provider: execConfig.provider,
            model: execConfig.model,
            apiKey: execConfig.apiKey,
            baseUrl: execConfig.baseUrl,
            stream: false,
            params: {
                prompt: prompt,
                system: systemInstruction,
            }
        }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);
    
    return { text: data.text };
  } catch(e) {
    console.error("AI Proxy Error (generateText):", e);
    return { text: null, error: (e as Error).message };
  }
};

export const generateJson = async <T,>(
  prompt: string,
  user: UserProfile,
  systemInstruction?: string
): Promise<AIParsedJsonResponse<T>> => {
  const usageCheck = await checkAndIncrementUsage(user);
  if (!usageCheck.allowed) return { data: null, error: usageCheck.error };
  
  const execConfig = await getExecutionConfig('text', user);
  if (!execConfig) {
    return { data: null, error: "Could not determine a valid AI model configuration for JSON generation. Check Admin Panel settings." };
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
            task: 'generateText',
            provider: execConfig.provider,
            model: execConfig.model,
            apiKey: execConfig.apiKey,
            baseUrl: execConfig.baseUrl,
            stream: false,
            params: {
                prompt: prompt,
                system: systemInstruction,
                mode: 'json'
            }
        }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    if (!data.text) {
        return { data: null, error: "AI returned no content for JSON parsing." };
    }

    return parseJsonFromText(data.text);
  } catch(e) {
      console.error("AI Proxy Error (generateJson):", e);
      return { data: null, error: (e as Error).message };
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
  
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
            task: 'generateImage',
            provider: execConfig.provider,
            model: execConfig.model,
            apiKey: execConfig.apiKey,
            baseUrl: execConfig.baseUrl,
            params: {
                prompt,
                n: numberOfImages,
                size: '1024x1024' // A common default size
            }
        }
    });
    
    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return { images: data.images };
  } catch (e) {
    console.error("AI Proxy Error (generateImages):", e);
    return { images: null, error: (e as Error).message };
  }
};
