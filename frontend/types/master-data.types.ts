export interface Vessel {
  id: number;
  uuid: string;
  vessel_name: string;
  vessel_code: string;
  vessel_type: string;
  imo_category: string | null;
  length: number | null;
  beam: number | null;
  draft: number | null;
  max_speed: number | null;
  maneuverability_rating: string | null;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Port {
  id: number;
  uuid: string;
  port_name: string;
  port_code: string;
  country: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  traffic_density: string;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeatherCondition {
  id: number;
  uuid: string;
  name: string;
  wind_speed: number | null;
  precipitation_level: string | null;
  visibility_range: number | null;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeaState {
  id: number;
  uuid: string;
  name: string;
  wave_height_min: number | null;
  wave_height_max: number | null;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisibilityCondition {
  id: number;
  uuid: string;
  name: string;
  visibility_distance: number | null;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeOfDay {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentProfile {
  id: number;
  uuid: string;
  profile_name: string;
  weather_condition_id: number | null;
  sea_state_id: number | null;
  visibility_condition_id: number | null;
  time_of_day_id: number | null;
  weather_condition_name: string | null;
  sea_state_name: string | null;
  visibility_condition_name: string | null;
  time_of_day_name: string | null;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterDataPage<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
