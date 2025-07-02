/*
  # Create dashboard_data table
  1. New Table: dashboard_data (id uuid, user_id uuid, personas_count integer, operators_count integer, content_drafts_count integer, upcoming_posts_count integer, connected_accounts_count integer, created_at timestamptz, updated_at timestamptz)
  2. Security: Enable RLS, add policies for authenticated users to read and update their own data
*/

CREATE TABLE IF NOT EXISTS dashboard_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  personas_count integer DEFAULT 0,
  operators_count integer DEFAULT 0,
  content_drafts_count integer DEFAULT 0,
  upcoming_posts_count integer DEFAULT 0,
  connected_accounts_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own dashboard data"
  ON dashboard_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard data"
  ON dashboard_data
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard data"
  ON dashboard_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_data_user_id ON dashboard_data(user_id);
