import api from "./api";
import type {
  Feature, FeaturePage, FeatureCreatePayload, FeatureUpdatePayload,
  Plan, PlanPage, PlanCreatePayload, PlanUpdatePayload,
  PlanFeatureItem, PlanFeatureUpsert,
  PlanExerciseItem, PlanExerciseUpsert,
  PlanSimulatorItem, PlanSimulatorUpsert,
  Subscription, SubscriptionPage, SubscriptionCreatePayload, SubscriptionUpdatePayload,
  OrgUsage, UsagePage,
} from "@/types/plan.types";

const qs = (p: Record<string, string | number | boolean | undefined>) => {
  const params = Object.entries(p).filter(([, v]) => v !== undefined);
  if (!params.length) return "";
  return "?" + new URLSearchParams(params.map(([k, v]) => [k, String(v)])).toString();
};

// ── Features ──────────────────────────────────────────────────────────────────

export const featureService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    api.get<{ data: FeaturePage }>(`/features${qs(params)}`).then((r) => ({ data: r.data.data ?? r.data })),
  listAllActive: () =>
    api.get<{ data: Feature[] }>(`/features/all-active`).then((r) => ({ data: r.data.data ?? r.data })),
  get: (uuid: string) =>
    api.get<{ data: Feature }>(`/features/${uuid}`).then((r) => ({ data: r.data.data ?? r.data })),
  create: (body: FeatureCreatePayload) =>
    api.post<{ data: Feature }>(`/features`, body).then((r) => ({ data: r.data.data ?? r.data })),
  update: (uuid: string, body: FeatureUpdatePayload) =>
    api.put<{ data: Feature }>(`/features/${uuid}`, body).then((r) => ({ data: r.data.data ?? r.data })),
  delete: (uuid: string) =>
    api.delete(`/features/${uuid}`).then(() => ({ data: undefined })),
};

// ── Plans ─────────────────────────────────────────────────────────────────────

export const planService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    api.get<{ data: PlanPage }>(`/plans${qs(params)}`).then((r) => ({ data: r.data.data ?? r.data })),
  get: (uuid: string) =>
    api.get<{ data: Plan }>(`/plans/${uuid}`).then((r) => ({ data: r.data.data ?? r.data })),
  create: (body: PlanCreatePayload) =>
    api.post<{ data: Plan }>(`/plans`, body).then((r) => ({ data: r.data.data ?? r.data })),
  update: (uuid: string, body: PlanUpdatePayload) =>
    api.put<{ data: Plan }>(`/plans/${uuid}`, body).then((r) => ({ data: r.data.data ?? r.data })),
  delete: (uuid: string) =>
    api.delete(`/plans/${uuid}`).then(() => ({ data: undefined })),
  clone: (uuid: string, plan_name: string, plan_code: string) =>
    api.post<{ data: Plan }>(`/plans/${uuid}/clone`, { plan_name, plan_code }).then((r) => ({ data: r.data.data ?? r.data })),
  activate: (uuid: string) =>
    api.patch<{ data: Plan }>(`/plans/${uuid}/activate`).then((r) => ({ data: r.data.data ?? r.data })),
  archive: (uuid: string) =>
    api.patch<{ data: Plan }>(`/plans/${uuid}/archive`).then((r) => ({ data: r.data.data ?? r.data })),

  getFeatures: (uuid: string) =>
    api.get<{ data: PlanFeatureItem[] }>(`/plans/${uuid}/features`).then((r) => ({ data: r.data.data ?? r.data })),
  upsertFeature: (uuid: string, body: PlanFeatureUpsert) =>
    api.put<{ data: PlanFeatureItem }>(`/plans/${uuid}/features`, body).then((r) => ({ data: r.data.data ?? r.data })),
  removeFeature: (uuid: string, featureId: number) =>
    api.delete(`/plans/${uuid}/features/${featureId}`).then(() => ({ data: undefined })),

  getExercises: (uuid: string) =>
    api.get<{ data: PlanExerciseItem[] }>(`/plans/${uuid}/exercises`).then((r) => ({ data: r.data.data ?? r.data })),
  upsertExercise: (uuid: string, body: PlanExerciseUpsert) =>
    api.put(`/plans/${uuid}/exercises`, body).then(() => ({ data: undefined })),
  removeExercise: (uuid: string, exerciseId: number) =>
    api.delete(`/plans/${uuid}/exercises/${exerciseId}`).then(() => ({ data: undefined })),

  getSimulators: (uuid: string) =>
    api.get<{ data: PlanSimulatorItem[] }>(`/plans/${uuid}/simulators`).then((r) => ({ data: r.data.data ?? r.data })),
  upsertSimulator: (uuid: string, body: PlanSimulatorUpsert) =>
    api.put(`/plans/${uuid}/simulators`, body).then(() => ({ data: undefined })),
  removeSimulator: (uuid: string, vendorId: number) =>
    api.delete(`/plans/${uuid}/simulators/${vendorId}`).then(() => ({ data: undefined })),

  listAllActive: () =>
    api.get<{ data: PlanPage }>(`/plans${qs({ page_size: 200 })}`).then((r) => {
      const page = r.data.data ?? (r.data as any);
      return { data: (page as PlanPage)?.items ?? page };
    }),
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptionService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    api.get<{ data: SubscriptionPage }>(`/subscriptions${qs(params)}`).then((r) => ({ data: r.data.data ?? r.data })),
  get: (uuid: string) =>
    api.get<{ data: Subscription }>(`/subscriptions/${uuid}`).then((r) => ({ data: r.data.data ?? r.data })),
  getForOrg: (orgId: number) =>
    api.get<{ data: Subscription | null }>(`/subscriptions/org/${orgId}/active`).then((r) => ({ data: r.data.data ?? r.data })),
  create: (body: SubscriptionCreatePayload) =>
    api.post<{ data: Subscription }>(`/subscriptions`, body).then((r) => ({ data: r.data.data ?? r.data })),
  update: (uuid: string, body: SubscriptionUpdatePayload) =>
    api.put<{ data: Subscription }>(`/subscriptions/${uuid}`, body).then((r) => ({ data: r.data.data ?? r.data })),
};

// ── Usage ─────────────────────────────────────────────────────────────────────

export const usageService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    api.get<{ data: UsagePage }>(`/usage${qs(params)}`).then((r) => ({ data: r.data.data ?? r.data })),
  getForOrg: (orgId: number) =>
    api.get<{ data: OrgUsage }>(`/usage/org/${orgId}`).then((r) => ({ data: r.data.data ?? r.data })),
};
