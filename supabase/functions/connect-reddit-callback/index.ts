
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');
  const appRedirectUrl = new URL(Deno.env.get('APP_URL') || 'http://localhost:3000/');
  appRedirectUrl.pathname = '/dashboard/settings'; // Ensure it redirects to the correct page

  // If Reddit returns an error (e.g., user denied access), redirect with an error message
  if (errorParam) {
    appRedirectUrl.searchParams.set('connect_error', `Reddit authorization failed: ${errorParam}`);
    return Response.redirect(appRedirectUrl.toString(), 302);
  }

  // If the callback is missing required parameters, it's an invalid request
  if (!code || !state) {
    appRedirectUrl.searchParams.set('connect_error', 'Invalid callback from Reddit. Missing code or state.');
    return Response.redirect(appRedirectUrl.toString(), 302);
  }

  // Initialize Supabase admin client
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  try {
    // 1. Verify the state parameter against the database to prevent CSRF
    const { data: stateData, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('user_id')
      .eq('state', state)
      .single();

    if (stateError || !stateData) throw new Error("Invalid or expired state token. Please try connecting again.");
    
    // Clean up the used state token immediately to prevent replay attacks
    await supabaseAdmin.from('oauth_states').delete().eq('state', state);

    const { user_id } = stateData;

    // 2. Exchange the authorization code for access and refresh tokens
    const redditClientId = Deno.env.get('REDDIT_CLIENT_ID');
    const redditClientSecret = Deno.env.get('REDDIT_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/connect-reddit-callback`;

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
    if (!tokenResponse.ok) throw new Error(`Reddit token exchange failed: ${tokenData.error_description || tokenData.error}`);

    const { access_token, refresh_token, expires_in } = tokenData;

    // 3. Use the access token to get the user's identity from Reddit
    const userMeResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: { 
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'PixaSocialApp/1.0',
      },
    });
    const redditUser = await userMeResponse.json();
    if (!userMeResponse.ok) throw new Error(`Failed to fetch Reddit user identity: ${redditUser.message}`);

    // 4. Prepare and save the connection details to the database
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

    const accountData = {
      user_id: user_id,
      platform: 'Reddit',
      accountid: redditUser.id,
      accountname: redditUser.name,
      accesstoken: access_token,      // Storing unencrypted as per current DB schema
      refreshtoken: refresh_token,    // Storing unencrypted as per current DB schema
      tokenexpiry: expiryDate.toISOString(),
    };
    
    const { error: upsertError } = await supabaseAdmin
      .from('connected_accounts')
      .upsert(accountData, { onConflict: 'user_id, platform' });

    if (upsertError) throw upsertError;

    // 5. Redirect back to the frontend application with a success message
    appRedirectUrl.searchParams.set('connect_success', 'reddit');
    return Response.redirect(appRedirectUrl.toString(), 302);

  } catch (error) {
    // On any error, redirect back to the frontend with an error message
    appRedirectUrl.searchParams.set('connect_error', error.message);
    return Response.redirect(appRedirectUrl.toString(), 302);
  }
});
