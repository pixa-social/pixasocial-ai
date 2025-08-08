-- Add a column to store the PKCE code verifier for OAuth 2.0 flows that require it (e.g., Twitter).
ALTER TABLE public.oauth_states
ADD COLUMN code_verifier TEXT;
