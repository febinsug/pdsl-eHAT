/*
  # Add Project Completion Support

  1. Changes
    - Add completed_at timestamp column to projects table
    - Create index for better query performance
    - Add constraint to ensure completed projects are also archived
*/

-- Add completed_at column to projects
ALTER TABLE projects
ADD COLUMN completed_at timestamptz;

-- Create index for better query performance
CREATE INDEX idx_projects_completed_at ON projects(completed_at)
WHERE completed_at IS NOT NULL;

-- Add constraint to ensure completed projects are archived
ALTER TABLE projects
ADD CONSTRAINT completed_projects_archived
CHECK (completed_at IS NULL OR (completed_at IS NOT NULL AND is_active = false));