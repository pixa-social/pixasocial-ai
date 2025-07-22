import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { streamText, StreamTextResult } from 'https://esm.sh/ai@3.2.32';
import { createGoogleGenerativeAI } from 'https://esm.sh/@ai-sdk/google@0.0.26';
import { createOpenAI } from 'https://esm.sh/@ai-sdk/openai@0.0.38';

declare const Deno: any;

type AiProviderType = 'Gemini' | 'OpenAI' | 'Groq' | 'Deepseek' | 'Openrouter' | 'MistralAI' | 'NovitaAI' | 'Anthropic' | 'Qwen';
const GEMINI_TEXT_MODEL_NAME = 'gemini-2.5-flash';

interface AiProviderConfig { id: AiProviderType; name: string; api_key: string | null; is_enabled: boolean; models: any; base_url?: string | null; }
interface UserProfile { id: string; assigned_ai_model_text: string | null; assigned_ai_model_image: string | null; }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getExecutionConfig(supabase: SupabaseClient, user: UserProfile) {
    const { data: configsData } = await supabase.from('ai_provider_global_configs').select('*');
    const allConfigs = (configsData || []) as AiProviderConfig[];
    
    const { data: settingsData } = await supabase.from('app_global_settings').select('active_ai_provider, global_default_text_model').eq('id', 1).single();
    const globalSettings = settingsData || { active_ai_provider: 'Gemini', global_default_text_model: null };

    const findProviderForModel = (modelName: string): AiProviderConfig | undefined => allConfigs.find(p => p.is_enabled && (p.models.text?.includes(modelName) || p.models.image?.includes(modelName) || p.models.chat?.includes(modelName)));

    let targetModel: string | undefined = user.assigned_ai_model_text || undefined;
    let targetProvider: AiProviderConfig | undefined = targetModel ? findProviderForModel(targetModel) : undefined;
    
    if (!targetProvider) {
      targetModel = globalSettings.global_default_text_model || undefined;
      if (targetModel) targetProvider = findProviderForModel(targetModel);
    }
    if (!targetProvider) {
      targetProvider = allConfigs.find(p => p.id === (globalSettings.active_ai_provider as AiProviderType) && p.is_enabled);
      targetModel = undefined; 
    }
    if (!targetProvider) throw new Error("Could not determine a valid, enabled AI provider.");
    
    let finalModel = targetModel;
    if (!finalModel) {
      finalModel = targetProvider.id === 'Gemini' ? GEMINI_TEXT_MODEL_NAME : (targetProvider.models.chat?.[0] || targetProvider.models.text?.[0]);
    }
    if (!finalModel) throw new Error(`No suitable chat/text model found for provider '${targetProvider.name}'.`);
  
    return { provider: targetProvider.id, model: finalModel, apiKey: targetProvider.api_key, baseUrl: targetProvider.base_url };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, data } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Missing 'messages' array in request body.");
    }
    if (!data) {
        throw new Error("Missing 'data' object in request body.");
    }
    const { system_prompt, is_google_search_enabled } = data;
    if (!system_prompt) {
      throw new Error("Missing 'system_prompt' in request body's 'data' object.");
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error("User not authenticated.");

    const { data: profile } = await supabaseAdmin.from('profiles').select('id, assigned_ai_model_text, assigned_ai_model_image').eq('id', user.id).single();
    if (!profile) throw new Error("User profile not found.");

    const execConfig = await getExecutionConfig(supabaseAdmin, profile);
    if (!execConfig.apiKey) throw new Error(`API Key for provider '${execConfig.provider}' is missing.`);
    
    let textModel;
    switch (execConfig.provider) {
      case 'Gemini': textModel = createGoogleGenerativeAI({ apiKey: execConfig.apiKey })(execConfig.model); break;
      case 'OpenAI': textModel = createOpenAI({ apiKey: execConfig.apiKey })(execConfig.model); break;
      default:
        if (!execConfig.baseUrl) throw new Error(`Provider '${execConfig.provider}' requires a 'baseUrl'.`);
        textModel = createOpenAI({ apiKey: execConfig.apiKey, baseURL: execConfig.baseUrl })(execConfig.model);
        break;
    }

    const streamTextOptions: any = {
        model: textModel,
        system: system_prompt,
        messages: messages,
    };
    
    if (is_google_search_enabled) {
        // Vercel AI SDK expects an object for tools, not an array.
        streamTextOptions.tools = { googleSearch: {} };
    }

    const result: StreamTextResult<any> = await streamText(streamTextOptions);

    const stream = new ReadableStream({
        async start(controller) {
            const textEncoder = new TextEncoder();
            for await (const textPart of result.textStream) {
                controller.enqueue(textEncoder.encode(`0:${JSON.stringify(textPart)}\n`));
            }
            if (is_google_search_enabled) {
                const groundingMetadata = await result.groundingMetadata;
                if (groundingMetadata?.groundingChunks) {
                    controller.enqueue(
                        textEncoder.encode(`2:${JSON.stringify({ grounding_sources: groundingMetadata.groundingChunks })}\n`)
                    );
                }
            }
            controller.close();
        }
    });

    return new Response(stream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('AI Proxy Chat Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
