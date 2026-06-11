import type {
  EnvironmentProfile,
  MasterDataPage,
  Port,
  SeaState,
  TimeOfDay,
  Vessel,
  VisibilityCondition,
  WeatherCondition,
} from "@/types/master-data.types";

const BASE = "/api/v1/master-data";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json;
}

// ── Generic CRUD helpers ────────────────────────────────────────────────────

function makeService<T, CreateT, UpdateT>(prefix: string) {
  return {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
      return request<{ data: MasterDataPage<T> }>(`${BASE}/${prefix}?${q}`);
    },
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

// ── Module services ─────────────────────────────────────────────────────────

export const vesselService = makeService<Vessel, Partial<Vessel>, Partial<Vessel>>("vessels");
export const portService = makeService<Port, Partial<Port>, Partial<Port>>("ports");
export const weatherService = makeService<WeatherCondition, Partial<WeatherCondition>, Partial<WeatherCondition>>("weather-conditions");
export const seaStateService = makeService<SeaState, Partial<SeaState>, Partial<SeaState>>("sea-states");
export const visibilityService = makeService<VisibilityCondition, Partial<VisibilityCondition>, Partial<VisibilityCondition>>("visibility-conditions");
export const timeOfDayService = makeService<TimeOfDay, Partial<TimeOfDay>, Partial<TimeOfDay>>("time-of-day");
export const envProfileService = makeService<EnvironmentProfile, Partial<EnvironmentProfile>, Partial<EnvironmentProfile>>("environment-profiles");
