/*
  # Fix Project RLS Policies

  1. Changes
    - Drop all existing project policies
    - Create new simplified policies for project management
    - Ensure proper access for admins and managers

  2. Security
    - Enable RLS on projects table
    - Add policies for:
      - Project creation by admins and managers
      - Project updates by admins and managers
      - Project viewing by all authenticated users
*/

-- Drop all existing project policies
DROP POLICY IF EXISTS "Admins and managers can create projects" ON projects;
DROP POLICY IF EXISTS "Admins and managers can update projects" ON projects;
DROP POLICY IF EXISTS "Admins and managers can delete projects" ON projects;
DROP POLICY IF EXISTS "All authenticated users can view projects" ON projects;

-- Create new simplified policies
CREATE POLICY "Admins and managers can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "All users can view projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;