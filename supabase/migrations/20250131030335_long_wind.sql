/*
  # Fix Project RLS Policies

  1. Changes
    - Drop existing project policies
    - Create new policies that properly handle all operations
    - Ensure proper authentication checks
  
  2. Security
    - Enable RLS on projects table
    - Add policies for CRUD operations
    - Ensure proper role checks
*/

-- Drop existing project policies
DROP POLICY IF EXISTS "Full project access for admins and managers" ON projects;
DROP POLICY IF EXISTS "Read-only project access for users" ON projects;

-- Create new project policies
CREATE POLICY "Admins and managers can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "All authenticated users can view projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);