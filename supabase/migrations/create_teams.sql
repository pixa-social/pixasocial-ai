/*
  # Create Teams and Team Members Tables

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `owner_id` (uuid, references users)
      - `created_at` (timestamptz)
    - `team_members`
      - `team_id` (uuid, references teams)
      - `user_id` (uuid, references users)
      - `role` (enum: owner, admin, member)
      - `joined_at` (timestamptz)
    - `team_invitations`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `email` (text)
      - `token` (text, unique)
      - `status` (enum: pending, accepted, declined, expired)
      - `invited_by` (uuid, references users)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `teams`, `team_members`, and `team_invitations` tables
    - Add policies for authenticated users to manage team data
*/

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role team_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status invitation_status DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can manage teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Team members can view teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view member data"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can manage invitations"
  ON team_invitations
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
