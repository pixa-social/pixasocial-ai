// Deno-compatible ES module imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Access Deno's environment variables
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const CEREBRAS_API_URL = 'https://cloud.cerebras.ai/v1/chat/completions';

// Main Edge Function Logic
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Authenticate the user ---
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header.");
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error(userError?.message || "User not authenticated.");
    }

    // --- 2. Get the Cerebras API Key from the database ---
    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
        .from('ai_provider_global_configs')
        .select('api_key')
        .eq('id', 'Cerebras')
        .single();
    
    if (apiKeyError || !apiKeyData?.api_key) {
        throw new Error("Cerebras API key is not configured in the Admin Panel.");
    }
    const cerebrasApiKey = apiKeyData.api_key;
    
    // --- 3. Proxy the request to Cerebras API ---
    const { messages, model, max_completion_tokens, temperature, top_p } = await req.json();

    if (!messages || !model) {
        throw new Error("Request body must include 'messages' and 'model'.");
    }

    const cerebrasResponse = await fetch(CEREBRAS_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `csk-${cerebrasApiKey}`, // Cerebras uses a 'csk-' prefix
        },
        body: JSON.stringify({
            messages,
            model,
            stream: true, // Always stream for real-time experience
            max_completion_tokens: max_completion_tokens || 40000,
            temperature: temperature || 0.6,
            top_p: top_p || 0.95,
        }),
    });

    if (!cerebrasResponse.ok) {
        const errorBody = await cerebrasResponse.json();
        throw new Error(`Cerebras API Error: ${errorBody.detail || cerebrasResponse.statusText}`);
    }

    // --- 4. Stream the response back to the client ---
    // The body is already a ReadableStream, so we can pass it directly.
    return new Response(cerebrasResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream; charset=utf-8' },
      status: 200,
    });

  } catch (error) {
    console.error('Cerebras Proxy Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
