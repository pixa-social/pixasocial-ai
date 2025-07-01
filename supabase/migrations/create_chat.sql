/*
  # Create Chat Channels and Messages Tables

  1. New Tables
    - `chat_channels`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `name` (text)
      - `is_direct_message` (boolean)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
    - `chat_messages`
      - `id` (bigserial, primary key)
      - `channel_id` (uuid, references chat_channels)
      - `sender_id` (uuid, references users)
      - `text_content` (text)
      - `attachment_storage_path` (text)
      - `attachment_file_name` (text)
      - `attachment_file_type` (text)
      - `attachment_size` (bigint)
      - `timestamp` (timestamptz)
  2. Security
    - Enable RLS on `chat_channels` and `chat_messages` tables
    - Add policies for authenticated users to manage chat data
*/

CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_direct_message BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  text_content TEXT,
  attachment_storage_path TEXT,
  attachment_file_name TEXT,
  attachment_file_type TEXT,
  attachment_size BIGINT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage channels"
  ON chat_channels
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Channel members can manage messages"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (
    channel_id IN (
      SELECT id FROM chat_channels 
      WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );