
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
    const { code, state } = await req.json();

    if (!code || !state) {
      throw new Error('Invalid request. Missing code or state.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { data: stateData, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('user_id')
      .eq('state', state)
      .single();

    if (stateError || !stateData) throw new Error("Invalid or expired state token. Please try connecting again.");
    
    await supabaseAdmin.from('oauth_states').delete().eq('state', state);

    const { user_id } = stateData;
    
    const redditClientId = Deno.env.get('REDDIT_CLIENT_ID');
    const redditClientSecret = Deno.env.get('REDDIT_CLIENT_SECRET');
    const appUrl = Deno.env.get('APP_URL');
    if (!appUrl) throw new Error('APP_URL is not set in environment variables.');

    // This must exactly match the URI used to initiate the auth flow
    const redirectUri = new URL('/dashboard/settings/', appUrl).toString();

    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${redditClientId}:${redditClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PixaSocialApp/1.0',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(`Reddit token exchange failed: ${tokenData.error_description || tokenData.error || JSON.stringify(tokenData)}`);

    const { access_token, refresh_token, expires_in } = tokenData;

    const userMeResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: { 
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'PixaSocialApp/1.0',
      },
    });
    const redditUser = await userMeResponse.json();
    if (!userMeResponse.ok) throw new Error(`Failed to fetch Reddit user identity: ${redditUser.message}`);

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

    const accountData = {
      user_id: user_id,
      platform: 'Reddit',
      accountid: redditUser.id,
      accountname: redditUser.name,
      accesstoken: access_token,
      refreshtoken: refresh_token,
      tokenexpiry: expiryDate.toISOString(),
    };
    
    const { error: upsertError } = await supabaseAdmin
      .from('connected_accounts')
      .upsert(accountData, { onConflict: 'user_id, platform' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true }), {
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