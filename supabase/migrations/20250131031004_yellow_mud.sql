/*
  # Fix project_users policies

  1. Changes
    - Drop existing project_users policies
    - Create new permissive policies for project_users table
    - Enable RLS for project_users table

  2. Security
    - Allow all operations on project_users table
    - Keep RLS enabled but make it permissive
*/

-- Drop existing project_users policies
DROP POLICY IF EXISTS "Full project assignment access for admins and managers" ON project_users;
DROP POLICY IF EXISTS "Read-only project assignment access for users" ON project_users;
DROP POLICY IF EXISTS "Admins and managers can manage project assignments" ON project_users;
DROP POLICY IF EXISTS "Users can view project assignments" ON project_users;

-- Create new simplified policies without auth.uid() references
CREATE POLICY "Anyone can manage project assignments"
  ON project_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view project assignments"
  ON project_users
  FOR SELECT
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;