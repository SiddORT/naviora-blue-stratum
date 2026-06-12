import type {
  AssessmentCategory,
  AssessmentTemplate,
  AssessmentRule,
  AssessmentPage,
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

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
  return q.toString();
}

function makeService<T, CreateT, UpdateT>(prefix: string) {
  return {
    list: (params: Record<string, string | number | undefined> = {}) =>
      request<{ data: AssessmentPage<T> }>(`${BASE}/${prefix}?${buildQuery(params)}`),
    listAllActive: () =>
      request<{ data: T[] }>(`${BASE}/${prefix}/all-active`),
    get: (uuid: string) =>
      request<{ data: T }>(`${BASE}/${prefix}/${uuid}`),
    create: (body: CreateT) =>
      request<{ data: T }>(`${BASE}/${prefix}`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (uuid: string, body: UpdateT) =>
      request<{ data: T }>(`${BASE}/${prefix}/${uuid}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (uuid: string) =>
      request<{ data: null }>(`${BASE}/${prefix}/${uuid}`, { method: "DELETE" }),
    activate: (uuid: string) =>
      request<{ data: T }>(`${BASE}/${prefix}/${uuid}/activate`, { method: "PATCH" }),
    deactivate: (uuid: string) =>
      request<{ data: T }>(`${BASE}/${prefix}/${uuid}/deactivate`, { method: "PATCH" }),
  };
}

export const assessmentCategoryService = makeService<
  AssessmentCategory,
  Partial<AssessmentCategory>,
  Partial<AssessmentCategory>
>("categories");

export const assessmentRuleService = makeService<
  AssessmentRule,
  Partial<AssessmentRule>,
  Partial<AssessmentRule>
>("rules");

export const assessmentTemplateService = {
  ...makeService<AssessmentTemplate, Partial<AssessmentTemplate>, Partial<AssessmentTemplate>>("templates"),
  archive: (uuid: string) =>
    request<{ data: AssessmentTemplate }>(`${BASE}/templates/${uuid}/archive`, { method: "PATCH" }),
  clone: (uuid: string, body: { new_name: string; new_code?: string }) =>
    request<{ data: AssessmentTemplate }>(`${BASE}/templates/${uuid}/clone`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getVersions: (uuid: string) =>
    request<{ data: unknown[] }>(`${BASE}/templates/${uuid}/versions`),
  preview: (uuid: string) =>
    request<{ data: AssessmentTemplate & { versions: unknown[] } }>(`${BASE}/preview/${uuid}`),
};
