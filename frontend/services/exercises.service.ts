import type {
  ExerciseCategory,
  Exercise,
  ExercisePage,
  ExerciseVariant,
  Objective,
  Scenario,
} from "@/types/exercise.types";
import { useAuthStore } from "@/store/auth.store";

const BASE = "/api/v1/exercises";

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
      request<{ data: ExercisePage<T> }>(`${BASE}/${prefix}?${buildQuery(params)}`),
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

export const categoryService = makeService<ExerciseCategory, Partial<ExerciseCategory>, Partial<ExerciseCategory>>("categories");
export const objectiveService = makeService<Objective, Partial<Objective>, Partial<Objective>>("objectives");
export const scenarioService = makeService<Scenario, Partial<Scenario>, Partial<Scenario>>("scenarios");
export const variantService = makeService<ExerciseVariant, Partial<ExerciseVariant>, Partial<ExerciseVariant>>("variants");

export const exerciseService = {
  ...makeService<Exercise, Partial<Exercise>, Partial<Exercise>>("library"),
  clone: (uuid: string, name: string) =>
    request<{ data: Exercise }>(`${BASE}/library/${uuid}/clone`, {
      method: "POST",
      body: JSON.stringify({ new_name: name }),
    }),
  archive: (uuid: string) =>
    request<{ data: Exercise }>(`${BASE}/library/${uuid}/archive`, { method: "PATCH" }),
};
