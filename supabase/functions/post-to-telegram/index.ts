// Deno-compatible URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { text, imageData } = await req.json(); // imageData is a base64 data URL

    if (!text && !imageData) {
        throw new Error('Post requires either text or an image.');
    }

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

    let telegramResponse;
    let telegramResult;

    if (imageData) {
        const telegramApiUrl = `https://api.telegram.org/bot${tokenToUse}/sendPhoto`;
        // Convert data URL to Blob
        const imageBlob = await (await fetch(imageData)).blob();
        
        const formData = new FormData();
        formData.append('chat_id', channelId);
        formData.append('photo', imageBlob, 'photo.jpg');
        if (text) {
            formData.append('caption', text);
        }

        telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            body: formData,
        });
        telegramResult = await telegramResponse.json();

    } else {
        const telegramApiUrl = `https://api.telegram.org/bot${tokenToUse}/sendMessage`;
        telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: channelId, text: text }),
        });
        telegramResult = await telegramResponse.json();
    }
    
    if (!telegramResponse.ok || !telegramResult.ok) {
        throw new Error(`Telegram API Error: ${telegramResult.description || 'Unknown error. Check Bot Token, Channel ID, and bot permissions.'}`);
    }

    return new Response(JSON.stringify({ message: 'Post published to Telegram successfully!' }), {
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