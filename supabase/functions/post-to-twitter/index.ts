import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Function to handle token refresh
async function refreshTwitterToken(account: any, supabaseAdmin: SupabaseClient): Promise<string> {
  const twitterClientId = Deno.env.get('TWITTER_CLIENT_ID');
  const twitterClientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${twitterClientId}:${twitterClientSecret}`)}`,
    },
    body: new URLSearchParams({
      refresh_token: account.refreshtoken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Twitter token refresh failed: ${data.error_description || data.error}`);
  }

  const { access_token, refresh_token, expires_in } = data;
  const newExpiry = new Date();
  newExpiry.setSeconds(newExpiry.getSeconds() + expires_in);

  await supabaseAdmin
    .from('connected_accounts')
    .update({
      accesstoken: access_token,
      refreshtoken: refresh_token,
      tokenexpiry: newExpiry.toISOString(),
    })
    .eq('id', account.id);

  return access_token;
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      throw new Error('Post requires text content.');
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

    let { data: account, error: accountError } = await supabaseAdmin
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'X')
      .single();

    if (accountError) throw new Error(`Database error: ${accountError.message}`);
    if (!account) throw new Error("X (Twitter) account not connected for this user.");

    let { accesstoken, tokenexpiry } = account;

    // Check if token is expired
    if (new Date(tokenexpiry) < new Date()) {
      accesstoken = await refreshTwitterToken(account, supabaseAdmin);
    }

    const twitterResponse = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accesstoken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
    });

    const twitterResult = await twitterResponse.json();
    if (!twitterResponse.ok) {
        const errorMessage = twitterResult.detail || 'Unknown error publishing tweet.';
        throw new Error(`Twitter API Error: ${errorMessage}`);
    }

    return new Response(JSON.stringify({ message: 'Post published to X (Twitter) successfully!', postId: twitterResult.data.id }), {
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
