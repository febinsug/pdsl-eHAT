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

-- Drop existing project policies
DROP POLICY IF EXISTS "Admins and managers can create projects" ON projects;
DROP POLICY IF EXISTS "Admins and managers can update projects" ON projects;
DROP POLICY IF EXISTS "All users can view projects" ON projects;

-- Create new project policies
CREATE POLICY "Admins and managers can manage projects"
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

CREATE POLICY "Users can view projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Project users policies
DROP POLICY IF EXISTS "All users can view project assignments" ON project_users;
DROP POLICY IF EXISTS "Admins and managers can manage project assignments" ON project_users;

CREATE POLICY "Admins and managers can manage project assignments"
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

CREATE POLICY "Users can view project assignments"
  ON project_users
  FOR SELECT
  TO authenticated
  USING (true);