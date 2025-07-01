/*
  # Create Operator Builder Table

  1. New Tables
    - `operator_builder`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text)
      - `description` (text)
      - `configuration` (jsonb, for storing operator settings)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `operator_builder` table
    - Add policy for authenticated users to manage their own operator configurations
*/

CREATE TABLE IF NOT EXISTS operator_builder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE operator_builder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their operator configurations"
  ON operator_builder
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());