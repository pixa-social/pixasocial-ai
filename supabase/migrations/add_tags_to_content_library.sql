/*
  # Add Tags Column to Content Library Assets Table

  1. Modification:
    - Add `tags` column (text array) to `content_library_assets` table for storing asset tags
  2. Security:
    - No changes to RLS policies needed for this update
*/

ALTER TABLE IF EXISTS content_library_assets
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
