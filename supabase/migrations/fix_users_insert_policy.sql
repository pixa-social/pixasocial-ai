/*
  # Fix Users Insert Policy

  1. Policy Update
    - Drop the existing INSERT policy that restricts based on user ID
    - Create a new INSERT policy that allows public insertion for new user registration
*/

DROP POLICY IF EXISTS "Users can insert their own data" ON users;

CREATE POLICY "Allow public user registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);
