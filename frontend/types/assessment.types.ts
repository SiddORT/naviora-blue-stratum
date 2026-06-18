export type AssessmentType = "Training" | "Evaluation" | "Certification" | "Practice";
export type AssessmentStatus = "draft" | "active" | "archived";

export const ASSESSMENT_TYPES: AssessmentType[] = ["Training", "Evaluation", "Certification", "Practice"];
export const ASSESSMENT_STATUSES: AssessmentStatus[] = ["draft", "active", "archived"];

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
  start_date?: string | null;
  end_date?: string | null;
  timezone: string;
  duration_override?: number | null;
  is_open: boolean;
  created_at: string;
  updated_at: string;
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
