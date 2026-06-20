// ── Feature ──────────────────────────────────────────────────────────────────

export type FeatureCategory =
  | "Simulator" | "Assessment" | "Reporting" | "AI"
  | "User Management" | "Offline" | "Integration" | "General";

export type FeatureStatus = "active" | "inactive";

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  "Simulator", "Assessment", "Reporting", "AI",
  "User Management", "Offline", "Integration", "General",
];

export interface Feature {
  id: number;
  uuid: string;
  feature_name: string;
  feature_code: string;
  description?: string | null;
  category: FeatureCategory;
  status: FeatureStatus;
  created_at: string;
  updated_at: string;
}

export interface FeaturePage {
  items: Feature[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FeatureCreatePayload {
  feature_name: string;
  feature_code: string;
  description?: string;
  category: FeatureCategory;
  status: FeatureStatus;
}

export interface FeatureUpdatePayload {
  feature_name?: string;
  description?: string;
  category?: FeatureCategory;
  status?: FeatureStatus;
}

// ── Plan ─────────────────────────────────────────────────────────────────────

export type PlanStatus = "Draft" | "Active" | "Archived";
export type BillingCycle = "Monthly" | "Yearly" | "Custom";

export const PLAN_STATUSES: PlanStatus[] = ["Draft", "Active", "Archived"];
export const BILLING_CYCLES: BillingCycle[] = ["Monthly", "Yearly", "Custom"];

export interface Plan {
  id: number;
  uuid: string;
  plan_name: string;
  plan_code: string;
  description?: string | null;
  monthly_price: number;
  yearly_price: number;
  billing_cycle: BillingCycle;
  max_users: number;
  max_candidates: number;
  max_assessments_per_month: number;
  max_storage_gb: number;
  max_simulators: number;
  certificate_enabled: boolean;
  ai_enabled: boolean;
  offline_enabled: boolean;
  custom_exercises_enabled: boolean;
  status: PlanStatus;
  is_public: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanPage {
  items: Plan[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PlanCreatePayload {
  plan_name: string;
  plan_code: string;
  description?: string;
  monthly_price: number;
  yearly_price: number;
  billing_cycle: BillingCycle;
  max_users: number;
  max_candidates: number;
  max_assessments_per_month: number;
  max_storage_gb: number;
  max_simulators: number;
  certificate_enabled: boolean;
  ai_enabled: boolean;
  offline_enabled: boolean;
  custom_exercises_enabled: boolean;
  status: PlanStatus;
  is_public: boolean;
  display_order: number;
}

export type PlanUpdatePayload = Partial<Omit<PlanCreatePayload, "plan_code">>;

// ── Plan Feature ──────────────────────────────────────────────────────────────

export interface PlanFeatureItem {
  feature_id: number;
  feature_uuid: string;
  feature_name: string;
  feature_code: string;
  category: FeatureCategory;
  is_enabled: boolean;
  configuration_json?: Record<string, unknown> | null;
}

export interface PlanFeatureUpsert {
  feature_id: number;
  is_enabled: boolean;
  configuration_json?: Record<string, unknown> | null;
}

// ── Plan Exercise ─────────────────────────────────────────────────────────────

export interface PlanExerciseItem {
  exercise_id: number;
  exercise_uuid: string;
  exercise_name: string;
  exercise_code: string;
  is_enabled: boolean;
}

export interface PlanExerciseUpsert {
  exercise_id: number;
  is_enabled: boolean;
}

// ── Plan Simulator ────────────────────────────────────────────────────────────

export interface PlanSimulatorItem {
  simulator_vendor_id: number;
  vendor_uuid: string;
  vendor_name: string;
  is_enabled: boolean;
}

export interface PlanSimulatorUpsert {
  simulator_vendor_id: number;
  is_enabled: boolean;
}

// ── Subscription ──────────────────────────────────────────────────────────────

export type SubscriptionStatus = "Trial" | "Active" | "Expired" | "Suspended" | "Cancelled";

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "Trial", "Active", "Expired", "Suspended", "Cancelled",
];

export interface Subscription {
  id: number;
  uuid: string;
  organization_id: number;
  organization_name?: string | null;
  plan_id: number;
  plan_name?: string | null;
  plan_code?: string | null;
  start_date: string;
  end_date?: string | null;
  subscription_status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  auto_renew: boolean;
  custom_limits_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPage {
  items: Subscription[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SubscriptionCreatePayload {
  organization_id: number;
  plan_id: number;
  billing_cycle: BillingCycle;
  start_date?: string;
  end_date?: string;
  auto_renew: boolean;
  custom_limits_json?: Record<string, unknown>;
}

export interface SubscriptionUpdatePayload {
  plan_id?: number;
  billing_cycle?: BillingCycle;
  end_date?: string;
  subscription_status?: SubscriptionStatus;
  auto_renew?: boolean;
  custom_limits_json?: Record<string, unknown>;
}

// ── Usage ─────────────────────────────────────────────────────────────────────

export interface OrgUsage {
  organization_id: number;
  organization_name?: string | null;
  current_users: number;
  current_candidates: number;
  assessments_this_month: number;
  storage_used_gb: number;
  active_simulators: number;
  updated_at: string;
  max_users?: number | null;
  max_candidates?: number | null;
  max_assessments_per_month?: number | null;
  max_storage_gb?: number | null;
  max_simulators?: number | null;
}

export interface UsagePage {
  items: OrgUsage[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
