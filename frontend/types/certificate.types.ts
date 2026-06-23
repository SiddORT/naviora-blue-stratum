export type CertificateStatus = "Draft" | "Issued" | "Expired" | "Revoked" | "Suspended";
export type CertificateType = "Competency" | "Completion" | "STCW" | "Professional" | "Custom";

export interface CertificateTemplate {
  id: number;
  uuid: string;
  template_name: string;
  template_code: string;
  description: string | null;
  certificate_type: CertificateType;
  background_image_path: string | null;
  logo_path: string | null;
  signature_image_path: string | null;
  is_default: boolean;
  status: "active" | "inactive";
  template_html: string | null;
  template_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateRule {
  id: number;
  uuid: string;
  assessment_id: number;
  assessment_name: string | null;
  template_id: number | null;
  template_name: string | null;
  minimum_score: number;
  require_review_approval: boolean;
  auto_issue: boolean;
  validity_period_months: number | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CertificateListItem {
  id: number;
  uuid: string;
  certificate_number: string;
  certificate_type: CertificateType;
  candidate_name: string | null;
  candidate_email: string | null;
  organization_name: string | null;
  assessment_name: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  score: number | null;
  status: CertificateStatus;
  verification_url: string | null;
  created_at: string;
}

export interface CertificateHistoryEntry {
  id: number;
  action_type: string;
  previous_status: string | null;
  new_status: string | null;
  remarks: string | null;
  action_by: string | null;
  created_at: string;
}

export interface Certificate extends CertificateListItem {
  organization_id: number | null;
  candidate_id: number;
  assessment_id: number | null;
  template_id: number | null;
  template_name: string | null;
  pdf_path: string | null;
  verification_hash: string | null;
  remarks: string | null;
  issued_by: string | null;
  history: CertificateHistoryEntry[];
  updated_at: string;
}

export interface CertificateSettings {
  id: number;
  uuid: string;
  certificate_prefix: string;
  next_certificate_number: number;
  reset_frequency: "never" | "yearly" | "monthly";
  last_reset_year: number | null;
  last_reset_month: number | null;
  include_year_in_number: boolean;
  updated_at: string;
}

export interface CertificateAnalytics {
  total_issued: number;
  total_active: number;
  total_expiring_soon: number;
  total_expired: number;
  total_revoked: number;
  total_suspended: number;
  recent_issuances: Array<{
    certificate_number: string;
    candidate_name: string | null;
    issue_date: string | null;
    status: string;
  }>;
}

export interface VerifyResult {
  found: boolean;
  certificate_number: string | null;
  candidate_name: string | null;
  assessment_name: string | null;
  organization_name: string | null;
  certificate_type: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string | null;
  verification_status: string | null;
  score: number | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
