import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error("User not authenticated.");

    const { data: account, error: accountError } = await supabaseAdmin
      .from('connected_accounts')
      .select('encrypted_bot_token, channel_id')
      .eq('user_id', user.id)
      .eq('platform', 'Telegram')
      .single();

    if (accountError) throw new Error(`Database error: ${accountError.message}`);
    if (!account) throw new Error("Telegram account not connected for this user.");
    
    // Fallback to global bot token logic
    const userProvidedToken = account.encrypted_bot_token;
    const globalToken = Deno.env.get('GLOBAL_TELEGRAM_BOT_TOKEN');
    const tokenToUse = userProvidedToken || globalToken;

    if (!tokenToUse) {
      const errorMessage = userProvidedToken === null
        ? "The global bot token is not configured by the site administrator. Please contact support."
        : "Bot token is missing for the connected Telegram account.";
      throw new Error(errorMessage);
    }

    const { channel_id: channelId } = account;
    if (!channelId) throw new Error("Channel ID is missing.");
    
    const telegramApiUrl = `https://api.telegram.org/bot${tokenToUse}/sendMessage`;
    const testMessage = `Hello from PixaSocial! This is a successful test message to channel ${channelId}. If you see this, your connection is working correctly.`;
    
    let telegramResponse;
    try {
        telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: channelId, text: testMessage }),
        });
    } catch(e) {
        throw new Error(`Network error calling Telegram API: ${(e as Error).message}`);
    }

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
      throw new Error(`Telegram API Error (${telegramResponse.status}): ${telegramResult.description || 'Unknown error. Check if Bot Token and Channel ID are correct and the bot has permission to post.'}`);
    }

    return new Response(JSON.stringify({ message: 'Test message sent successfully!' }), {
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