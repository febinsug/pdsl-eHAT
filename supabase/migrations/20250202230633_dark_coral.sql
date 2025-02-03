/*
  # Add rejection reason to timesheets

  1. Changes
    - Add rejection_reason column to timesheets table
    - This allows managers/admins to provide a reason when rejecting a timesheet
*/

-- Add rejection_reason column to timesheets
ALTER TABLE timesheets
ADD COLUMN rejection_reason text;

-- Create index for better query performance when filtering by rejection reason
CREATE INDEX idx_timesheets_rejection_reason ON timesheets(rejection_reason)
WHERE rejection_reason IS NOT NULL;