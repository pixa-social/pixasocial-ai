
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // This is needed for the Supabase client library to work correctly
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const redditClientId = Deno.env.get('REDDIT_CLIENT_ID');
    const appUrl = Deno.env.get('APP_URL');
    if (!redditClientId) throw new Error('REDDIT_CLIENT_ID is not set in environment variables.');
    if (!appUrl) throw new Error('APP_URL is not set in environment variables.');

    // Initialize Supabase admin client to create a state record
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    
    // Get the authenticated user from the request's Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error(userError?.message || "User not authenticated.");

    // Create a new state record in the database to link this request to the user
    const { data: stateData, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .insert({ user_id: user.id })
      .select('state')
      .single();

    if (stateError) throw stateError;
    const state = stateData.state;

    // Construct the Reddit authorization URL with the frontend redirect URI
    const redirectUri = new URL('/dashboard/settings/', appUrl).toString();
    const scopes = 'identity submit read'.split(' ').join(',');

    const authUrl = new URL('https://www.reddit.com/api/v1/authorize');
    authUrl.searchParams.set('client_id', redditClientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('duration', 'permanent'); // To get a refresh token
    authUrl.searchParams.set('scope', scopes);

    // Return the URL to the client to perform the redirect
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