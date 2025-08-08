
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PollyClient, SynthesizeSpeechCommand } from 'https://esm.sh/@aws-sdk/client-polly@3.596.0';
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};


// Helper function to convert a ReadableStream<Uint8Array> to a single Uint8Array.
// This is a robust way to handle streams in Deno environments.
async function streamToByteArray(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks = [];
  while(true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405
    });
  }

  try {
    const { text, voiceId, engine } = await req.json();

    if (!text || typeof text !== 'string' || !voiceId || typeof voiceId !== 'string' || !engine || typeof engine !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid request body. Requires { text: string, voiceId: string, engine: string }.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    if (text.length > 3000) {
        return new Response(JSON.stringify({ error: 'Text exceeds 3000 character limit.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }

    // --- USER AUTHENTICATION & USAGE LIMIT CHECK ---
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    
    const { data: profile } = await supabaseAdmin.from('profiles').select('ai_usage_count_monthly').eq('id', user.id).single();
    const { data: userRole } = await supabaseAdmin.from('user_roles').select('role_id').eq('user_id', user.id).single();
    if (!userRole) throw new Error("User role not found.");
    const { data: role } = await supabaseAdmin.from('role_types').select('max_ai_uses_monthly').eq('id', userRole.role_id).single();
    if (!role) throw new Error("Role definition not found.");
    
    if (profile && profile.ai_usage_count_monthly >= role.max_ai_uses_monthly) {
        return new Response(JSON.stringify({ error: 'Monthly AI usage limit exceeded.' }), { status: 429, headers: {...corsHeaders, 'Content-Type': 'application/json'} });
    }

    // --- AWS POLLY CLIENT INITIALIZATION (with Deno-compatible credential provider) ---
    const region = Deno.env.get('AWS_REGION');
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    if (!region || !accessKeyId || !secretAccessKey) {
        return new Response(JSON.stringify({ error: 'Service misconfigured: AWS credentials not set on server.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    
    const pollyClient = new PollyClient({
      region,
      // The AWS SDK's default credential provider chain attempts to read from the filesystem
      // (`~/.aws/credentials`), which is not available in the Deno runtime, causing a crash.
      // By explicitly providing credentials as a provider function, we bypass this chain and
      // ensure the SDK only uses the provided environment variables.
      credentials: () => Promise.resolve({
          accessKeyId,
          secretAccessKey,
      }),
    });

    // --- SPEECH SYNTHESIS ---
    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: engine,
    });

    const response = await pollyClient.send(command);
    const audioStream = response.AudioStream;
    
    if (!audioStream) {
      throw new Error('Failed to get audio stream from Polly.');
    }

    const audioBytes = await streamToByteArray(audioStream);
    const audioB64 = encodeBase64(audioBytes);
    
    // --- INCREMENT USAGE COUNT (fire and forget) ---
    if (profile) {
        const { error: updateError } = await supabaseAdmin.from('profiles').update({ ai_usage_count_monthly: profile.ai_usage_count_monthly + 1 }).eq('id', user.id);
        if (updateError) console.error(`Failed to increment usage for user ${user.id}:`, updateError.message);
    }

    // --- SEND RESPONSE ---
    return new Response(JSON.stringify({ audioB64 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Text-to-speech internal error:', error);
    return new Response(JSON.stringify({ error: `An internal server error occurred: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
