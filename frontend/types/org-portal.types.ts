export interface OrgUser {
  uuid: string;
  email: string;
  full_name: string;
  user_type: string;
  organization_id: number;
  organization_name: string;
  organization_code: string;
  avatar_url?: string | null;
  status: string;
}

export interface OrgDashboardStats {
  total_users: number;
  total_candidates: number;
  active_assessments: number;
  completed_assessments: number;
  pass_rate: number;
  current_plan: string | null;
  plan_renewal_date: string | null;
  max_users: number;
  max_candidates: number;
  users_used: number;
  candidates_used: number;
}

export interface OrgUserListItem {
  uuid: string;
  email: string;
  full_name: string;
  user_type: string;
  status: string;
  avatar_url?: string | null;
  last_login?: string | null;
  created_at?: string | null;
}

export interface OrgCandidate {
  id: number;
  uuid: string;
  email: string;
  full_name: string;
  phone?: string | null;
  organization_id?: number | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  rank_or_designation?: string | null;
  seafarer_id?: string | null;
  avatar_url?: string | null;
  status: string;
  is_active: boolean;
  last_login?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface OrgCandidateListItem {
  id: number;
  uuid: string;
  email: string;
  full_name: string;
  phone?: string | null;
  organization_id?: number | null;
  rank_or_designation?: string | null;
  seafarer_id?: string | null;
  status: string;
  is_active: boolean;
  last_login?: string | null;
  created_at?: string | null;
}

export interface OrgSubscription {
  plan_name: string;
  plan_slug: string;
  billing_cycle: string;
  subscription_status: string;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  max_users: number;
  max_simulators: number;
  max_candidates: number | null;
  price_monthly: number;
  current_users: number;
  current_candidates: number;
  active_simulators: number;
  assessments_this_month: number;
}

export interface OrgProfile {
  id: number;
  uuid: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  timezone: string | null;
  runtime_mode: string | null;
  organization_type: string | null;
  logo_url: string | null;
  subscription_status: string;
  max_users: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrgSettingsUpdate {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  timezone?: string;
  logo_url?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
