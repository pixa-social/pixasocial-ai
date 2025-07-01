/*
  # Initial Schema Setup for PixaSocial AI

  1. New Tables
    - `profiles` - Extended user profiles linked to auth.users
    - `personas` - Audience personas with RST profiles
    - `operators` - Campaign operators with conditioning mechanics
    - `content_drafts` - Multi-platform content drafts
    - `scheduled_posts` - Calendar scheduling for content
    - `connected_accounts` - Social media account connections
    - `content_library_assets` - Media asset storage
    - `chat_channels` - Team chat channels
    - `chat_messages` - Chat message history
    - `ai_provider_configs` - User AI provider configurations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Team-based access for shared resources

  3. Real-time
    - Enable real-time subscriptions for chat functionality
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE rst_trait_level AS ENUM ('Not Assessed', 'Low', 'Medium', 'High');
CREATE TYPE operator_type AS ENUM ('Hope', 'Fear', 'Belonging', 'Exclusivity', 'Curiosity', 'Authority', 'Novelty', 'Pride', 'Nostalgia', 'Convenience', 'Custom');
CREATE TYPE media_type AS ENUM ('none', 'image', 'video');
CREATE TYPE image_source_type AS ENUM ('generate', 'upload', 'library');
CREATE TYPE scheduled_post_status AS ENUM ('Scheduled', 'Published', 'Missed', 'Cancelled');
CREATE TYPE social_platform_type AS ENUM ('X', 'Facebook', 'Instagram', 'LinkedIn', 'Pinterest', 'TikTok', 'YouTube');
CREATE TYPE ai_provider_type AS ENUM ('Gemini', 'OpenAI', 'Anthropic', 'Groq', 'Deepseek', 'Qwen');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  wallet_address TEXT,
  team_members TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  demographics TEXT NOT NULL,
  psychographics TEXT NOT NULL,
  initial_beliefs TEXT NOT NULL,
  vulnerabilities TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  rst_profile_bas rst_trait_level DEFAULT 'Not Assessed',
  rst_profile_bis rst_trait_level DEFAULT 'Not Assessed',
  rst_profile_fffs rst_trait_level DEFAULT 'Not Assessed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_audience_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  type operator_type NOT NULL,
  conditioned_stimulus TEXT NOT NULL,
  unconditioned_stimulus TEXT NOT NULL,
  desired_conditioned_response TEXT NOT NULL,
  reinforcement_loop TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content drafts table
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  custom_prompt TEXT NOT NULL,
  platform_contents JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_draft_id UUID NOT NULL REFERENCES content_drafts(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform_key TEXT NOT NULL,
  status scheduled_post_status DEFAULT 'Scheduled',
  notes TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connected accounts table
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform social_platform_type NOT NULL,
  account_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  encrypted_access_token TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Content library assets table
CREATE TABLE IF NOT EXISTS content_library_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat channels table
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_direct_message BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_content TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_size BIGINT,
  attachment_storage_path TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- AI provider configs table
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id ai_provider_type NOT NULL,
  encrypted_api_key TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  models JSONB DEFAULT '{}',
  base_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for personas
CREATE POLICY "Users can manage own personas"
  ON personas FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for operators
CREATE POLICY "Users can manage own operators"
  ON operators FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for content_drafts
CREATE POLICY "Users can manage own content drafts"
  ON content_drafts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for scheduled_posts
CREATE POLICY "Users can manage own scheduled posts"
  ON scheduled_posts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for connected_accounts
CREATE POLICY "Users can manage own connected accounts"
  ON connected_accounts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for content_library_assets
CREATE POLICY "Users can manage own content library assets"
  ON content_library_assets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for chat_channels
CREATE POLICY "Users can read channels they created or are members of"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);

CREATE POLICY "Users can create channels"
  ON chat_channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

CREATE POLICY "Channel creators can update their channels"
  ON chat_channels FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Channel creators can delete their channels"
  ON chat_channels FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for chat_messages
CREATE POLICY "Users can read messages in channels they have access to"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_channels 
      WHERE chat_channels.id = chat_messages.channel_id 
      AND (chat_channels.user_id = auth.uid() OR chat_channels.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to channels they have access to"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_channels 
      WHERE chat_channels.id = chat_messages.channel_id 
      AND (chat_channels.user_id = auth.uid() OR chat_channels.created_by = auth.uid())
    )
  );

-- RLS Policies for ai_provider_configs
CREATE POLICY "Users can manage own AI provider configs"
  ON ai_provider_configs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_operators_user_id ON operators(user_id);
CREATE INDEX IF NOT EXISTS idx_operators_target_audience ON operators(target_audience_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_user_id ON content_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_operator ON content_drafts(operator_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_persona ON content_drafts(persona_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_start_time ON scheduled_posts(start_time);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Enable real-time for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_channels;