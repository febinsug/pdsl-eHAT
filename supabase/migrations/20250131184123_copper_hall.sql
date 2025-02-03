/*
  # Add client structure and enhance role-based access

  1. Changes
    - Add total_hours column to timesheets
    - Add approval tracking columns to timesheets
    - Add client management policies
    - Update project policies for client relationship
    - Add manager-specific policies

  2. Security
    - Enable RLS for all new tables
    - Add policies for client access
    - Update existing policies for manager roles
*/

-- Add total_hours to timesheets for easier querying
ALTER TABLE timesheets
ADD COLUMN total_hours numeric(8,2) GENERATED ALWAYS AS (
  monday_hours + tuesday_hours + wednesday_hours + thursday_hours + friday_hours
) STORED;

-- Add approval tracking to timesheets
ALTER TABLE timesheets
ADD COLUMN approved_by uuid REFERENCES users(id),
ADD COLUMN approved_at timestamptz;

-- Create index for better query performance
CREATE INDEX idx_timesheets_total_hours ON timesheets(total_hours);
CREATE INDEX idx_timesheets_approved_by ON timesheets(approved_by);

-- Update timesheet policies for manager approvals
CREATE POLICY "Managers can approve timesheets for their projects"
  ON timesheets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN project_users pu ON pu.user_id = u.id
      WHERE u.id = auth.uid()
      AND u.role = 'manager'
      AND pu.project_id = timesheets.project_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN project_users pu ON pu.user_id = u.id
      WHERE u.id = auth.uid()
      AND u.role = 'manager'
      AND pu.project_id = timesheets.project_id
    )
  );

-- Add policy for viewing approved timesheets
CREATE POLICY "Users can view approved timesheets"
  ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN project_users pu ON pu.user_id = u.id
      WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin')
      AND pu.project_id = timesheets.project_id
    )
  );

-- Add policy for managers to view their team's timesheets
CREATE POLICY "Managers can view their team's timesheets"
  ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.manager_id = auth.uid()
      AND u.id = timesheets.user_id
    )
  );

-- Add policy for project assignment by managers
CREATE POLICY "Managers can only assign their team members to projects"
  ON project_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'manager'
      AND (
        SELECT manager_id FROM users WHERE id = project_users.user_id
      ) = u.id
    )
  );