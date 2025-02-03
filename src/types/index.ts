export type UserRole = 'user' | 'manager' | 'admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  manager_id: string | null;
}

export interface Client {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  allocated_hours: number;
  created_by: string;
  is_active: boolean;
  client_id: string;
  client?: Client;
}

export interface Timesheet {
  id: string;
  user_id: string;
  project_id: string;
  week_number: number;
  year: number;
  monday_hours: number;
  tuesday_hours: number;
  wednesday_hours: number;
  thursday_hours: number;
  friday_hours: number;
  total_hours: number;
  status: string;
  submitted_at: string;
  approved_by?: string;
  approved_at?: string;
}