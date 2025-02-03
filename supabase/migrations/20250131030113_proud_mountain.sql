/*
  # Fix Project Management Policies

  1. Changes
    - Drop existing project policies
    - Create new, more permissive policies for project management
    - Add policies for project users table
  
  2. Security
    - Enable RLS for all tables
    - Add proper policies for admins and managers
*/

-- Drop existing project policies if they exist
DROP POLICY IF EXISTS "Admins and managers can create projects" ON projects;
DROP POLICY IF EXISTS "Admins and managers can update projects" ON projects;
DROP POLICY IF EXISTS "All users can view projects" ON projects;
DROP POLICY IF EXISTS "Admins and managers can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects" ON projects;

-- Create new comprehensive project policies
CREATE POLICY "Full project access for admins and managers"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Read-only project access for users"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Project users policies
DROP POLICY IF EXISTS "All users can view project assignments" ON project_users;
DROP POLICY IF EXISTS "Admins and managers can manage project assignments" ON project_users;
DROP POLICY IF EXISTS "Users can view project assignments" ON project_users;

CREATE POLICY "Full project assignment access for admins and managers"
  ON project_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Read-only project assignment access for users"
  ON project_users
  FOR SELECT
  TO authenticated
  USING (true);