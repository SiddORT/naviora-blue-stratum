export interface Organization {
  id: number;
  uuid: string;
  name: string;
  code: string;
  email: string | null;
  subscription_status: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
  user_count: number;
}

export interface User {
  id: number;
  uuid: string;
  email: string;
  full_name: string;
  status: string;
  organization_id: number | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  roles: string[];
}

export interface DashboardStats {
  total_organizations: number;
  active_organizations: number;
  total_users: number;
  active_users: number;
  total_assessments: number;
  total_simulator_sessions: number;
  pending_enquiries: number;
  active_plans: number;
}
