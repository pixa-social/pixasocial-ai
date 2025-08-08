import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
      .select('user_id, code_verifier')
      .eq('state', state)
      .single();

    if (stateError || !stateData) throw new Error("Invalid or expired state token. Please try connecting again.");

    await supabaseAdmin.from('oauth_states').delete().eq('state', state);

    const { user_id, code_verifier } = stateData;
    if (!code_verifier) throw new Error("Could not find code_verifier for this state. Please try again.");

    const twitterClientId = Deno.env.get('TWITTER_CLIENT_ID');
    const twitterClientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');
    const appUrl = Deno.env.get('APP_URL');
    if (!appUrl) throw new Error('APP_URL is not set in environment variables.');

    const redirectUri = new URL('/dashboard/settings/', appUrl).toString();

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twitterClientId}:${twitterClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: code_verifier,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(`Twitter token exchange failed: ${tokenData.error_description || tokenData.error || JSON.stringify(tokenData)}`);

    const { access_token, refresh_token, expires_in } = tokenData;

    const userMeResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
          'Authorization': `Bearer ${access_token}`,
      },
    });
    const twitterUser = await userMeResponse.json();
    if (!userMeResponse.ok) throw new Error(`Failed to fetch Twitter user identity: ${twitterUser.detail || JSON.stringify(twitterUser)}`);
    const { id, name, username } = twitterUser.data;

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

    const accountData = {
      user_id: user_id,
      platform: 'X', // Use 'X' for consistency with frontend
      accountid: id,
      accountname: `${name} (@${username})`,
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
