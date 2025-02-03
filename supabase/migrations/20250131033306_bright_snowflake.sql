/*
  # Fix timesheet permissions and overview access

  1. Changes
    - Drop existing timesheet policies
    - Create new policies for proper user/manager access
    - Add policy for timesheet approvals

  2. Security
    - Users can only view/manage their own timesheets
    - Managers can view/manage timesheets for their projects
    - Admins have full access
*/

-- Drop existing timesheet policies
DROP POLICY IF EXISTS "Timesheet management policy" ON timesheets;

-- Create new timesheet policies
CREATE POLICY "Users can manage their own timesheets"
  ON timesheets
  FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_users pu
      JOIN users u ON u.id = auth.uid()
      WHERE pu.project_id = timesheets.project_id
      AND pu.user_id = u.id
      AND u.role IN ('manager', 'admin')
    )
  );

-- Create policy for timesheet approvals
CREATE POLICY "Managers can approve timesheets"
  ON timesheet_approvals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );