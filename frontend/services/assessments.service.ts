import type {
  Assessment,
  AssessmentCreatePayload,
  AssessmentListItem,
  AssessmentPage,
  AssessmentSchedule,
  AssessmentUpdatePayload,
} from "@/types/assessment.types";
import { useAuthStore } from "@/store/auth.store";

const BASE = "/api/v1/assessments";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
  return q.toString();
}

export const assessmentService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    request<{ data: AssessmentPage }>(`${BASE}?${buildQuery(params)}`),

  listAllActive: () =>
    request<{ data: AssessmentListItem[] }>(`${BASE}/all-active`),

  get: (uuid: string) =>
    request<{ data: Assessment }>(`${BASE}/${uuid}`),

  create: (body: AssessmentCreatePayload) =>
    request<{ data: Assessment }>(`${BASE}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (uuid: string, body: AssessmentUpdatePayload) =>
    request<{ data: Assessment }>(`${BASE}/${uuid}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (uuid: string) =>
    request<{ data: null }>(`${BASE}/${uuid}`, { method: "DELETE" }),

  activate: (uuid: string) =>
    request<{ data: Assessment }>(`${BASE}/${uuid}/activate`, { method: "PATCH" }),

  archive: (uuid: string) =>
    request<{ data: Assessment }>(`${BASE}/${uuid}/archive`, { method: "PATCH" }),

  getSchedule: (uuid: string) =>
    request<{ data: AssessmentSchedule | null }>(`${BASE}/${uuid}/schedule`),

  upsertSchedule: (uuid: string, body: Partial<AssessmentSchedule>) =>
    request<{ data: AssessmentSchedule }>(`${BASE}/${uuid}/schedule`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};
