
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Corrected import: removed generateImages as it's not exported correctly on esm.sh for this version
import { streamText, generateText } from 'https://esm.sh/ai@3.2.32';
import { createGoogleGenerativeAI } from 'https://esm.sh/@ai-sdk/google@0.0.26';
import { createOpenAI } from 'https://esm.sh/@ai-sdk/openai@0.0.38';
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    const { task, provider, model, apiKey, baseUrl, stream, params// Model parameters
     } = body;
    // --- Improved Validation ---
    if (!task) throw new Error("Missing required parameter: task");
    if (!provider) throw new Error("Missing required parameter: provider");
    if (!model) throw new Error("Missing required parameter: model");
    if (!apiKey) throw new Error(`API Key for provider '${provider}' is missing. Please configure it in the Admin Panel.`);
    if (!params) throw new Error("Missing required parameter: params");
    // --- Authenticate the user ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: {
        persistSession: false
      }
    });
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error(userError?.message || "User not authenticated.");
    // --- Task-based routing ---
    switch(task){
      case 'generateText':
        {
          let textModel;
          switch(provider){
            case 'Gemini':
              textModel = createGoogleGenerativeAI({
                apiKey
              })(model);
              break;
            case 'OpenAI':
              textModel = createOpenAI({
                apiKey
              })(model);
              break;
            default:
              if (!baseUrl) throw new Error(`Provider '${provider}' requires a 'baseUrl'.`);
              textModel = createOpenAI({
                apiKey,
                baseURL: baseUrl
              })(model);
              break;
          }
          if (stream) {
            const result = await streamText({
              model: textModel,
              system: params.system,
              prompt: params.prompt
            });
            // Important: CORS headers must be added to the streamed response
            const response = result.toAIStreamResponse();
            Object.entries(corsHeaders).forEach(([key, value])=>{
              response.headers.set(key, value);
            });
            return response;
          } else {
            const { text } = await generateText({
              model: textModel,
              system: params.system,
              prompt: params.prompt,
              mode: params.mode === 'json' ? 'json' : undefined
            });
            return new Response(JSON.stringify({
              text
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 200
            });
          }
        }
      case 'generateImage':
        {
          let imageModel;
          
          // Create a specific params object for the image generation call
          // to handle differences between providers (e.g., Gemini vs OpenAI).
          const finalImageParams: {
            prompt: string;
            numberOfImages?: number;
            width?: number;
            height?: number;
            n?: number;
            size?: string;
            responseFormat?: 'b64_json';
          } = {
            prompt: params.prompt,
          };
          
          switch(provider){
            case 'Gemini':
              imageModel = createGoogleGenerativeAI({ apiKey }).image(model);
              
              // Translate common params (n, size) to Gemini-specific params.
              if (params.n) {
                  finalImageParams.numberOfImages = params.n;
              }
              if (params.size) {
                  const [width, height] = params.size.split('x').map(Number);
                  finalImageParams.width = width;
                  finalImageParams.height = height;
              }
              // Gemini doesn't use responseFormat; it returns Uint8Array by default with this SDK.
              break;
              
            case 'OpenAI':
            default:
              imageModel = createOpenAI({ apiKey, baseURL: baseUrl }).image(model);
              
              // Use OpenAI compatible params directly and ensure b64_json format.
              if (params.n) finalImageParams.n = params.n;
              if (params.size) finalImageParams.size = params.size;
              finalImageParams.responseFormat = 'b64_json';
              break;
          }

          const { images } = await imageModel.generate(finalImageParams as any);

          const base64Images = await Promise.all(images.map(async (image)=>{
            if (typeof image === 'string') return image; // Already base64 from b64_json
            if (image instanceof URL) {
              const response = await fetch(image);
              const buffer = await response.arrayBuffer();
              return encodeBase64(new Uint8Array(buffer));
            }
            // Handle Uint8Array/Buffer from Gemini
            return encodeBase64(image);
          }));
          return new Response(JSON.stringify({
            images: base64Images
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  } catch (error) {
    console.error('AI Proxy Error:', error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});