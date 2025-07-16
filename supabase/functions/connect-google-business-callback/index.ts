
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw new Error('Invalid request. Missing code or state.');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    const redirectUri = `https://${projectRef}.supabase.co/functions/v1/connect-google-business-callback`;

    const supabaseAdmin = createClient(
      supabaseUrl,
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
    
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const appUrl = Deno.env.get('APP_URL');

    if (!googleClientId || !googleClientSecret || !appUrl) {
      throw new Error("Missing Google credentials or App URL in environment variables.");
    }
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            code,
            client_id: googleClientId,
            client_secret: googleClientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        })
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(`Google token exchange failed: ${tokens.error_description || JSON.stringify(tokens)}`);
    
    const { access_token, refresh_token, expires_in } = tokens;

    const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    const accountsData = await accountsResponse.json();
    if (!accountsResponse.ok) throw new Error(`Failed to fetch Google Business accounts: ${accountsData.error?.message || 'Error fetching accounts'}`);
    if (!accountsData.accounts || accountsData.accounts.length === 0) {
        throw new Error("No Google Business Profile accounts were found for this Google account. Please ensure you have access to at least one profile.");
    }

    const firstAccount = accountsData.accounts[0];
    const expiryDate = new Date(Date.now() + expires_in * 1000);

    const accountDataToStore = {
      user_id: user_id,
      platform: 'GoogleBusiness',
      accountid: firstAccount.name, // e.g., "accounts/12345"
      accountname: firstAccount.accountName,
      accesstoken: access_token,
      refreshtoken: refresh_token,
      tokenexpiry: expiryDate.toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from('connected_accounts')
      .upsert(accountDataToStore, { onConflict: 'user_id, platform' });

    if (upsertError) throw upsertError;

    const appRedirectUrl = new URL('/dashboard/settings', appUrl);
    appRedirectUrl.searchParams.set('connect_success', 'Google Business');
    
    return Response.redirect(appRedirectUrl.toString());

  } catch (error) {
    console.error('Google Business callback error:', error.message);
    const appUrl = Deno.env.get('APP_URL');
    const errorRedirectUrl = new URL('/dashboard/settings', appUrl || 'http://localhost:3000');
    errorRedirectUrl.searchParams.set('error', `Connection failed: ${error.message}`);
    return Response.redirect(errorRedirectUrl.toString());
  }
});
