/*
  # Create Content Library Assets Table

  1. New Tables
    - `content_library_assets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text)
      - `type` (text)
      - `storage_path` (text)
      - `file_name` (text)
      - `file_type` (text)
      - `size` (bigint)
      - `uploaded_at` (timestamptz)
  2. Security
    - Enable RLS on `content_library_assets` table
    - Add policy for authenticated users to manage their own assets
*/

CREATE TABLE IF NOT EXISTS content_library_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_library_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their content library assets"
  ON content_library_assets
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());