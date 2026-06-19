import type {
  Assessment,
  AssessmentAttempt,
  AssessmentCreatePayload,
  AssessmentListItem,
  AssessmentPage,
  AssessmentParticipant,
  AssessmentParticipantBulkAssignPayload,
  AssessmentParticipantCreatePayload,
  AssessmentParticipantPage,
  AssessmentParticipantUpdatePayload,
  AssessmentProgressSummary,
  AssessmentSchedule,
  AssessmentScheduleUpsertPayload,
  AssessmentUpdatePayload,
  BulkAssignResult,
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

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.set(k, String(v));
  });
  return q.toString();
}

export const assessmentService = {
  // ── Assessment CRUD ────────────────────────────────────────────────────────
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

  // ── Schedule ───────────────────────────────────────────────────────────────
  getSchedule: (uuid: string) =>
    request<{ data: AssessmentSchedule | null }>(`${BASE}/${uuid}/schedule`),

  upsertSchedule: (uuid: string, body: AssessmentScheduleUpsertPayload) =>
    request<{ data: AssessmentSchedule }>(`${BASE}/${uuid}/schedule`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  // ── Participants ───────────────────────────────────────────────────────────
  listParticipants: (
    uuid: string,
    params: Record<string, string | number | undefined> = {},
  ) =>
    request<{ data: AssessmentParticipantPage }>(
      `${BASE}/${uuid}/participants?${buildQuery(params)}`,
    ),

  addParticipant: (uuid: string, body: AssessmentParticipantCreatePayload) =>
    request<{ data: AssessmentParticipant }>(`${BASE}/${uuid}/participants`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  bulkAssign: (uuid: string, body: AssessmentParticipantBulkAssignPayload) =>
    request<{ data: BulkAssignResult }>(
      `${BASE}/${uuid}/participants/bulk-assign`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  updateParticipant: (
    assessmentUuid: string,
    participantUuid: string,
    body: AssessmentParticipantUpdatePayload,
  ) =>
    request<{ data: AssessmentParticipant }>(
      `${BASE}/${assessmentUuid}/participants/${participantUuid}`,
      { method: "PUT", body: JSON.stringify(body) },
    ),

  removeParticipant: (assessmentUuid: string, participantUuid: string) =>
    request<{ data: null }>(
      `${BASE}/${assessmentUuid}/participants/${participantUuid}`,
      { method: "DELETE" },
    ),

  // ── Progress ───────────────────────────────────────────────────────────────
  getProgressSummary: (uuid: string) =>
    request<{ data: AssessmentProgressSummary }>(`${BASE}/${uuid}/progress`),

  getProgressParticipants: (
    uuid: string,
    params: Record<string, string | number | undefined> = {},
  ) =>
    request<{ data: AssessmentParticipantPage }>(
      `${BASE}/${uuid}/progress/participants?${buildQuery(params)}`,
    ),

  // ── Attempts ───────────────────────────────────────────────────────────────
  listAttempts: (participantUuid: string) =>
    request<{ data: AssessmentAttempt[] }>(
      `${BASE}/participants/${participantUuid}/attempts`,
    ),

  getAttempt: (attemptUuid: string) =>
    request<{ data: AssessmentAttempt }>(`${BASE}/attempts/${attemptUuid}`),
};
