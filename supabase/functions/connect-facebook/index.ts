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
    const facebookClientId = Deno.env.get('FACEBOOK_CLIENT_ID');
    const appUrl = Deno.env.get('APP_URL');
    if (!facebookClientId) throw new Error('FACEBOOK_CLIENT_ID is not set in environment variables.');
    if (!appUrl) throw new Error('APP_URL is not set in environment variables.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error(userError?.message || "User not authenticated.");

    const { data: stateData, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .insert({ user_id: user.id })
      .select('state')
      .single();

    if (stateError) throw stateError;
    const state = stateData.state;

    const redirectUri = new URL('/dashboard/settings/', appUrl).toString();
    // Scopes for managing Facebook Pages
    const scopes = 'pages_show_list,pages_read_engagement,pages_manage_posts,public_profile,email';

    const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    authUrl.searchParams.set('client_id', facebookClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');

    return new Response(JSON.stringify({ redirectUrl: authUrl.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
