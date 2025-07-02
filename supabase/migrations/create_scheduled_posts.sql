/*
  # Create Scheduled Posts Table

  1. New Tables
     - `scheduled_posts`
       - `id` (uuid, primary key)
       - `user_id` (uuid, references users)
       - `content_draft_id` (text)
       - `platform_key` (text)
       - `title` (text)
       - `start_date` (timestamptz)
       - `end_date` (timestamptz)
       - `all_day` (boolean)
       - `status` (text)
       - `notes` (text)
       - `persona_id` (text)
       - `operator_id` (text)
       - `created_at` (timestamptz)
  2. Security
     - Enable RLS on `scheduled_posts` table
     - Add policy for authenticated users to manage their own scheduled posts
*/

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_draft_id TEXT NOT NULL,
  platform_key TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'Published', 'Missed', 'Cancelled')),
  notes TEXT DEFAULT '',
  persona_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their scheduled posts"
  ON scheduled_posts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
