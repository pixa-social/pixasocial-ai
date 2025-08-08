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
      .select('accesstoken, accountid')
      .eq('user_id', user.id)
      .eq('platform', 'Facebook')
      .single();

    if (accountError) throw new Error(`Database error: ${accountError.message}`);
    if (!account) throw new Error("Facebook account not connected for this user.");

    const { accesstoken: pageAccessToken, accountid: pageId } = account;
    if (!pageAccessToken || !pageId) throw new Error("Facebook Page connection is incomplete.");

    let facebookResponse;

    if (imageData) {
      // API endpoint for photo uploads
      const apiUrl = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      const imageBlob = await (await fetch(imageData)).blob();

      const formData = new FormData();
      formData.append('access_token', pageAccessToken);
      if (text) {
        formData.append('caption', text);
      }
      formData.append('source', imageBlob, 'photo.jpg');

      facebookResponse = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

    } else {
      // API endpoint for text-only posts
      const apiUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      const body = {
        message: text,
        access_token: pageAccessToken,
      };

      facebookResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    const facebookResult = await facebookResponse.json();
    if (!facebookResponse.ok) {
        const errorMessage = facebookResult.error?.message || 'Unknown error. Check API permissions and token validity.';
        throw new Error(`Facebook API Error: ${errorMessage}`);
    }

    return new Response(JSON.stringify({ message: 'Post published to Facebook successfully!', postId: facebookResult.id }), {
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
