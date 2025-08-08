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
      .select('user_id')
      .eq('state', state)
      .single();

    if (stateError || !stateData) throw new Error("Invalid or expired state token. Please try connecting again.");

    await supabaseAdmin.from('oauth_states').delete().eq('state', state);

    const { user_id } = stateData;

    const facebookClientId = Deno.env.get('FACEBOOK_CLIENT_ID');
    const facebookClientSecret = Deno.env.get('FACEBOOK_CLIENT_SECRET');
    const appUrl = Deno.env.get('APP_URL');
    if (!appUrl) throw new Error('APP_URL is not set in environment variables.');

    const redirectUri = new URL('/dashboard/settings/', appUrl).toString();

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', facebookClientId!);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('client_secret', facebookClientSecret!);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(`Facebook token exchange failed: ${tokenData.error?.message || JSON.stringify(tokenData)}`);

    const { access_token } = tokenData;

    // Get user's pages
    const pagesUrl = new URL('https://graph.facebook.com/me/accounts');
    pagesUrl.searchParams.set('access_token', access_token);
    const pagesResponse = await fetch(pagesUrl.toString());
    const pagesData = await pagesResponse.json();
    if (!pagesResponse.ok || !pagesData.data || pagesData.data.length === 0) {
      throw new Error("Could not find any Facebook Pages. Please ensure you have at least one Page connected to your Facebook account.");
    }

    // For this example, we'll use the first page found.
    // A real implementation might let the user choose which page to connect.
    const page = pagesData.data[0];
    const { id: pageId, name: pageName, access_token: page_access_token } = page;

    // Store the page connection details
    const accountData = {
      user_id: user_id,
      platform: 'Facebook',
      accountid: pageId,
      accountname: pageName,
      accesstoken: page_access_token, // Use the page access token
      refreshtoken: null, // Facebook page tokens don't expire if they are from a business account
      tokenexpiry: null,
    };

    const { error: upsertError } = await supabaseAdmin
      .from('connected_accounts')
      .upsert(accountData, { onConflict: 'user_id, platform' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, message: `Connected to Facebook Page: ${pageName}` }), {
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
