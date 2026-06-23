export interface AssessmentSnippet {
  uuid: string;
  assessment_name: string;
  assessment_code: string;
  duration_minutes: number | null;
  passing_score: number | null;
  max_attempts: number | null;
  exercise_count: number;
}

export interface CampaignListItem {
  uuid: string;
  campaign_name: string;
  campaign_code: string;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  assignment_count: number;
  assessment_name: string | null;
  created_at: string;
}

export interface CampaignDetail {
  uuid: string;
  campaign_name: string;
  campaign_code: string;
  description: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  timezone: string;
  duration_override_minutes: number | null;
  passing_score_override: number | null;
  max_attempts_override: number | null;
  randomize_exercises: boolean;
  randomize_variants: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  assessment: AssessmentSnippet | null;
  assignment_count: number;
}

export type CampaignStatus = "Draft" | "Published" | "Active" | "Completed" | "Archived";

export interface CampaignCreate {
  campaign_name: string;
  description?: string;
  assessment_id?: number;
  start_date?: string;
  end_date?: string;
  timezone?: string;
  duration_override_minutes?: number;
  passing_score_override?: number;
  max_attempts_override?: number;
  randomize_exercises?: boolean;
  randomize_variants?: boolean;
}

export interface CampaignUpdate extends Partial<CampaignCreate> {}

export interface CandidateSnippet {
  uuid: string;
  full_name: string;
  email: string;
  rank_or_designation: string | null;
  seafarer_id: string | null;
}

export interface ActivityLogItem {
  id: number;
  activity_type: string;
  activity_description: string | null;
  created_at: string;
}

export type AssignmentStatus =
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Passed"
  | "Failed"
  | "Expired"
  | "Cancelled";

export type ResultStatus = "Pending" | "Passed" | "Failed";

export interface AssignmentListItem {
  uuid: string;
  assignment_status: AssignmentStatus;
  result_status: ResultStatus;
  attempt_count: number;
  final_score: number | null;
  due_date: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  candidate_name: string | null;
  candidate_email: string | null;
  rank_or_designation: string | null;
  campaign_name: string | null;
  assessment_name: string | null;
}

export interface AssignmentDetail {
  uuid: string;
  assignment_status: AssignmentStatus;
  result_status: ResultStatus;
  attempt_count: number;
  final_score: number | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  candidate: CandidateSnippet | null;
  campaign_name: string | null;
  campaign_code: string | null;
  assessment_name: string | null;
  activity_logs: ActivityLogItem[];
}

export interface ProgressRow {
  assignment_uuid: string;
  candidate_name: string;
  candidate_email: string;
  rank_or_designation: string | null;
  assessment_name: string | null;
  campaign_name: string;
  assignment_status: AssignmentStatus;
  result_status: ResultStatus;
  attempt_count: number;
  final_score: number | null;
  assigned_at: string | null;
  completed_at: string | null;
  due_date: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  campaign_code: string;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  assignment_count: number;
  assessment_name: string | null;
}

export interface ActiveAssessmentOption {
  id: number;
  uuid: string;
  assessment_name: string;
  assessment_code: string;
  assessment_type: string;
  duration_minutes: number | null;
  passing_score: number | null;
  max_attempts: number | null;
  exercise_count: number;
}

export interface PaginatedCampaigns {
  items: CampaignListItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedAssignments {
  items: AssignmentListItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedProgress {
  items: ProgressRow[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ProgressSummary {
  total: number;
  assigned: number;
  in_progress: number;
  completed: number;
  passed: number;
  failed: number;
  expired: number;
  pass_rate: number;
  completion_rate: number;
}

export interface CampaignStats {
  total: number;
  draft: number;
  published: number;
  active: number;
  completed: number;
  archived: number;
}
