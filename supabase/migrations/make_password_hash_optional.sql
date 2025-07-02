/*
  # Make Password Hash Optional

  1. Schema Update
    - Alter the `users` table to make `password_hash` column optional
    - This is necessary because Supabase Auth handles password hashing internally
*/

ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;
