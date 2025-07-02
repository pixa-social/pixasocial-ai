/*
  # Create Personas Table

  1. New Tables
    - `personas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text)
      - `demographics` (text)
      - `psychographics` (text)
      - `initial_beliefs` (text)
      - `vulnerabilities` (text array)
      - `avatar_url` (text)
      - `rst_profile_bas` (enum)
      - `rst_profile_bis` (enum)
      - `rst_profile_fffs` (enum)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `personas` table
    - Add policy for authenticated users to manage their own personas
*/

CREATE TYPE rst_trait_level AS ENUM ('Not Assessed', 'Low', 'Medium', 'High');
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  demographics TEXT NOT NULL,
  psychographics TEXT NOT NULL,
  initial_beliefs TEXT NOT NULL,
  vulnerabilities TEXT[],
  avatar_url TEXT,
  rst_profile_bas rst_trait_level DEFAULT 'Not Assessed',
  rst_profile_bis rst_trait_level DEFAULT 'Not Assessed',
  rst_profile_fffs rst_trait_level DEFAULT 'Not Assessed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their personas"
  ON personas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
