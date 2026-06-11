export interface ExerciseCategory {
  id: number;
  uuid: string;
  category_name: string;
  category_code: string;
  description: string | null;
  status: string;
  is_active: boolean;
  updated_at: string;
  created_at?: string;
}

export interface Objective {
  id: number;
  uuid: string;
  objective_name: string;
  objective_code: string;
  competency_area: string | null;
  description: string | null;
  status: string;
  is_active: boolean;
  updated_at: string;
  created_at?: string;
}

export interface Scenario {
  id: number;
  uuid: string;
  scenario_name: string;
  scenario_code: string;
  scenario_type: string | null;
  difficulty: string | null;
  description: string | null;
  status: string;
  is_active: boolean;
  updated_at: string;
  created_at?: string;
}

export interface Exercise {
  id: number;
  uuid: string;
  exercise_name: string;
  exercise_code: string;
  category_id: number | null;
  scenario_id: number | null;
  category_name: string | null;
  scenario_name: string | null;
  description: string | null;
  difficulty: string | null;
  passing_score: number | null;
  max_attempts: number | null;
  estimated_duration: number | null;
  generation_mode: string;
  status: string;
  is_active: boolean;
  version_number: number;
  variant_count: number;
  objective_ids: number[];
  updated_at: string;
  created_at?: string;
}

export interface ExerciseVariant {
  id: number;
  uuid: string;
  variant_name: string;
  variant_code: string;
  exercise_id: number;
  exercise_name: string | null;
  port_id: number | null;
  environment_profile_id: number | null;
  primary_vessel_id: number | null;
  secondary_vessel_id: number | null;
  tertiary_vessel_id: number | null;
  port_name: string | null;
  environment_profile_name: string | null;
  primary_vessel_name: string | null;
  duration_minutes: number | null;
  passing_score: number | null;
  description: string | null;
  status: string;
  is_active: boolean;
  updated_at: string;
  created_at?: string;
}

export interface ExercisePage<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
