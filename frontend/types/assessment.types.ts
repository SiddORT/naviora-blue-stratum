export type AssessmentType = "Training" | "Evaluation" | "Certification" | "Practice";
export type AssessmentStatus = "draft" | "active" | "archived";
export type AssignmentStatus = "Assigned" | "In Progress" | "Completed" | "Passed" | "Failed" | "Expired" | "Cancelled";
export type ResultStatus = "Pending" | "Passed" | "Failed";
export type ScheduleType = "Always Open" | "Scheduled Window";
export type ScheduleStatus = "Draft" | "Active" | "Archived";
export type AttemptResultStatus = "Pending" | "Passed" | "Failed" | "Abandoned";

export const ASSESSMENT_TYPES: AssessmentType[] = ["Training", "Evaluation", "Certification", "Practice"];
export const ASSESSMENT_STATUSES: AssessmentStatus[] = ["draft", "active", "archived"];
export const ASSIGNMENT_STATUSES: AssignmentStatus[] = ["Assigned", "In Progress", "Completed", "Passed", "Failed", "Expired", "Cancelled"];
export const RESULT_STATUSES: ResultStatus[] = ["Pending", "Passed", "Failed"];
export const SCHEDULE_TYPES: ScheduleType[] = ["Always Open", "Scheduled Window"];
export const SCHEDULE_STATUSES: ScheduleStatus[] = ["Draft", "Active", "Archived"];

export interface AssessmentExerciseItem {
  id: number;
  exercise_id: number;
  exercise_uuid?: string | null;
  exercise_name?: string | null;
  exercise_code?: string | null;
  sequence_number: number;
  weightage: number;
  mandatory: boolean;
}

export interface Assessment {
  id: number;
  uuid: string;
  assessment_name: string;
  assessment_code: string;
  description?: string | null;
  instructions?: string | null;
  assessment_type: AssessmentType;
  duration_minutes?: number | null;
  passing_score?: number | null;
  max_attempts?: number | null;
  randomize_exercise_order: boolean;
  randomize_variant_selection: boolean;
  certificate_eligible: boolean;
  certificate_validity_months?: number | null;
  status: AssessmentStatus;
  is_active: boolean;
  exercises: AssessmentExerciseItem[];
  exercise_count: number;
  participant_count: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentListItem {
  id: number;
  uuid: string;
  assessment_name: string;
  assessment_code: string;
  assessment_type: AssessmentType;
  duration_minutes?: number | null;
  passing_score?: number | null;
  max_attempts?: number | null;
  certificate_eligible: boolean;
  status: AssessmentStatus;
  is_active: boolean;
  exercise_count: number;
  participant_count: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentPage {
  items: AssessmentListItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface AssessmentSchedule {
  id: number;
  uuid: string;
  assessment_id: number;
  schedule_type: ScheduleType;
  start_date?: string | null;
  end_date?: string | null;
  timezone: string;
  duration_override?: number | null;
  allow_late_start: boolean;
  grace_period_minutes?: number | null;
  schedule_status: ScheduleStatus;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentParticipant {
  id: number;
  uuid: string;
  assessment_id: number;
  user_id?: number | null;
  assigned_by?: string | null;
  assignment_status: AssignmentStatus;
  assigned_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  attempt_count: number;
  max_attempts_override?: number | null;
  result_status: ResultStatus;
  remarks?: string | null;
  user_full_name?: string | null;
  user_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentParticipantPage {
  items: AssessmentParticipant[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface BulkAssignResult {
  assigned: number;
  skipped: number;
  skipped_user_ids: number[];
}

export interface AssessmentAttempt {
  id: number;
  uuid: string;
  assessment_participant_id: number;
  attempt_number: number;
  started_at?: string | null;
  completed_at?: string | null;
  simulator_session_id?: number | null;
  score?: number | null;
  result_status: AttemptResultStatus;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentProgressSummary {
  total_participants: number;
  not_started: number;
  in_progress: number;
  completed: number;
  passed: number;
  failed: number;
  expired: number;
  cancelled: number;
}

export interface AssessmentExerciseCreate {
  exercise_id: number;
  sequence_number: number;
  weightage: number;
  mandatory: boolean;
}

export interface AssessmentCreatePayload {
  assessment_name: string;
  assessment_code: string;
  description?: string;
  instructions?: string;
  assessment_type: AssessmentType;
  duration_minutes?: number;
  passing_score?: number;
  max_attempts?: number;
  randomize_exercise_order: boolean;
  randomize_variant_selection: boolean;
  certificate_eligible: boolean;
  certificate_validity_months?: number;
  exercises: AssessmentExerciseCreate[];
}

export interface AssessmentUpdatePayload extends Partial<AssessmentCreatePayload> {}

export interface AssessmentParticipantCreatePayload {
  user_id: number;
  max_attempts_override?: number;
  remarks?: string;
}

export interface AssessmentParticipantUpdatePayload {
  assignment_status?: AssignmentStatus;
  max_attempts_override?: number;
  result_status?: ResultStatus;
  remarks?: string;
}

export interface AssessmentParticipantBulkAssignPayload {
  user_ids: number[];
  max_attempts_override?: number;
  remarks?: string;
}

export interface AssessmentScheduleUpsertPayload {
  schedule_type: ScheduleType;
  start_date?: string | null;
  end_date?: string | null;
  timezone: string;
  duration_override?: number | null;
  allow_late_start: boolean;
  grace_period_minutes?: number | null;
  schedule_status: ScheduleStatus;
  is_open: boolean;
}
