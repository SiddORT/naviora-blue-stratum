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
  username?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  status: string;
  user_type: string;
  organization_id: number | null;
  is_active: boolean;
  last_login: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  roles: string[];
}

export interface Permission {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description: string | null;
  is_active: boolean;
}

export interface RolePermissionDetail extends Permission {
  scope: string;
}

export interface Role {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  permission_count: number;
  user_count: number;
}

export interface RoleDetail {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: RolePermissionDetail[];
}

export interface Invitation {
  id: number;
  uuid: string;
  email: string;
  full_name: string | null;
  organization_id: number | null;
  role_id: number | null;
  organization_name: string | null;
  role_name: string | null;
  status: string;
  message: string | null;
  expires_at: string;
  accepted_at: string | null;
  invited_by_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface OrgAssignment {
  id: number;
  user_id: number;
  organization_id: number;
  user_name: string | null;
  user_email: string | null;
  organization_name: string | null;
  assignment_type: string;
  assigned_by: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id: string | null;
  module: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type EnquiryType = "CONTACT" | "CUSTOM_PLAN" | "ORGANIZATION_REGISTRATION" | "CANDIDATE_REGISTRATION";
export type EnquiryStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "APPROVED" | "REJECTED" | "CONVERTED";
export type OnboardingType = "ORGANIZATION" | "CANDIDATE";
export type OnboardingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CONVERTED";

export interface EnquiryConsent {
  id: number;
  enquiry_id: number;
  privacy_accepted: boolean;
  terms_accepted: boolean;
  data_processing_accepted: boolean;
  marketing_accepted: boolean;
  consent_version: string | null;
  ip_address: string | null;
  accepted_at: string;
}

export interface EnquiryNote {
  id: number;
  uuid: string;
  enquiry_id: number;
  note: string;
  note_by: string | null;
  note_by_uuid: string | null;
  created_at: string;
}

export interface EnquiryListItem {
  id: number;
  uuid: string;
  enquiry_type: EnquiryType;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string | null;
  country: string | null;
  selected_plan_id: number | null;
  selected_plan_name: string | null;
  status: EnquiryStatus;
  duplicate_flag: boolean;
  assigned_to: string | null;
  created_at: string;
}

export interface EnquiryDetail extends EnquiryListItem {
  phone: string | null;
  message: string | null;
  source_page: string | null;
  ip_address: string | null;
  updated_at: string;
  notes: EnquiryNote[];
  consent: EnquiryConsent | null;
}

export interface OnboardingRequest {
  id: number;
  uuid: string;
  enquiry_id: number;
  enquiry_uuid: string | null;
  enquiry_email: string | null;
  enquiry_name: string | null;
  onboarding_type: OnboardingType;
  onboarding_status: OnboardingStatus;
  organization_id: number | null;
  user_id: number | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsentRecord {
  id: number;
  enquiry_id: number;
  enquiry_email: string | null;
  enquiry_name: string | null;
  enquiry_type: string | null;
  privacy_accepted: boolean;
  terms_accepted: boolean;
  data_processing_accepted: boolean;
  marketing_accepted: boolean;
  consent_version: string | null;
  ip_address: string | null;
  accepted_at: string;
}

export interface Candidate {
  id: number;
  uuid: string;
  email: string;
  full_name: string;
  username: string | null;
  phone: string | null;
  organization_id: number | null;
  date_of_birth: string | null;
  nationality: string | null;
  rank_or_designation: string | null;
  seafarer_id: string | null;
  avatar_url: string | null;
  status: string;
  is_active: boolean;
  last_login: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
