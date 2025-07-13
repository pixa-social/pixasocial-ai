// Deno-compatible URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

// CORS headers are now self-contained within this file.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions are also self-contained to avoid import issues.
enum SocialPlatformType {
  Telegram = 'Telegram',
}

interface ConnectTelegramPayload {
  platform: SocialPlatformType;
  displayName: string;
  botToken?: string; // Token is now optional
  channelId: string;
}

// Main Edge Function Logic
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { platform, displayName, botToken, channelId }: ConnectTelegramPayload = await req.json();

    if (!channelId || !platform || !displayName) {
      throw new Error('Channel ID, Platform, and Display Name are required.');
    }

    // Initialize the Admin client with environment variables
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    
    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header.");
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error(userError?.message || "User not authenticated.");
    }

    // Prepare data for insertion into the 'connected_accounts' table
    const accountData = {
      user_id: user.id,
      platform: platform,
      accountid: channelId,
      accountname: displayName,
      encrypted_bot_token: botToken || null, // Store token if provided, otherwise null
      channel_id: channelId,
      created_at: new Date().toISOString()
    };

    // Upsert the data
    const { data, error } = await supabaseAdmin
      .from('connected_accounts')
      .upsert(accountData, { onConflict: 'user_id, platform' })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});