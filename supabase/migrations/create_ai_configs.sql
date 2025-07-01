/*
  # Create AI Provider User Configs Table

  1. New Tables
    - `ai_provider_user_configs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `provider_id` (text)
      - `encrypted_api_key` (text)
      - `is_enabled` (boolean)
      - `models` (jsonb)
      - `base_url` (text)
  2. Security
    - Enable RLS on `ai_provider_user_configs` table
    - Add policy for authenticated users to manage their own configs
*/

CREATE TABLE IF NOT EXISTS ai_provider_user_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  encrypted_api_key TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  models JSONB,
  base_url TEXT,
  UNIQUE(user_id, provider_id)
);

ALTER TABLE ai_provider_user_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their AI configs"
  ON ai_provider_user_configs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());