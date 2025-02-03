-- Drop all existing project policies
DROP POLICY IF EXISTS "Admins and managers can create projects" ON projects;
DROP POLICY IF EXISTS "Admins and managers can update projects" ON projects;
DROP POLICY IF EXISTS "Admins and managers can delete projects" ON projects;
DROP POLICY IF EXISTS "All authenticated users can view projects" ON projects;

-- Create new simplified policies without auth.uid() references
CREATE POLICY "Anyone can manage projects"
  ON projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view projects"
  ON projects
  FOR SELECT
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;