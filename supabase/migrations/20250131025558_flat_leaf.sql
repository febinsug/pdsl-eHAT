/*
  # Add Missing Policies

  1. Changes
    - Add policies for project management
    - Add policies for project assignments
    - Add policies for timesheet management

  2. Security
    - Enable project management for admins and managers
    - Allow project assignment viewing and management
    - Allow timesheet submission and management
*/

-- Project management policies
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
  );

CREATE POLICY "All users can view projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Project assignments policies
CREATE POLICY "All users can view project assignments"
  ON project_users
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Timesheet policies
CREATE POLICY "Users can manage their own timesheets"
  ON timesheets
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "All users can view timesheet approvals"
  ON timesheet_approvals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage timesheet approvals"
  ON timesheet_approvals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );