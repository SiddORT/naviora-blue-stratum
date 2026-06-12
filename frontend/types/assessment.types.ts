export interface AssessmentCategory {
  id: number;
  uuid: string;
  category_name: string;
  category_code: string;
  description?: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface AssessmentTemplate {
  id: number;
  uuid: string;
  assessment_name: string;
  assessment_code: string;
  category_id?: number | null;
  category_name?: string | null;
  description?: string | null;
  instructions?: string | null;
  duration_minutes?: number | null;
  passing_score?: number | null;
  max_attempts?: number | null;
  variant_selection_mode: string;
  randomize_exercise_order: boolean;
  randomize_variant_selection: boolean;
  status: string;
  version_number: number;
  exercises_count: number;
  exercises: AssessmentExerciseItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentRule {
  id: number;
  uuid: string;
  assessment_id: number;
  assessment_name?: string | null;
  assessment_code?: string | null;
  minimum_pass_score?: number | null;
  max_attempts?: number | null;
  assessment_duration?: number | null;
  allow_reassessment: boolean;
  reassessment_wait_days?: number | null;
  variant_selection_mode: string;
  randomize_exercises: boolean;
  randomize_variants: boolean;
  auto_fail_on_collision: boolean;
  auto_fail_on_major_violation: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentVersion {
  id: number;
  assessment_id: number;
  version_number: number;
  change_summary?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface AssessmentPage<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
