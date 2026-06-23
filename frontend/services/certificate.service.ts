import api from "./api";
import { useOrgAuthStore } from "@/store/org-auth.store";
import type {
  Certificate,
  CertificateAnalytics,
  CertificateListItem,
  CertificateRule,
  CertificateSettings,
  CertificateTemplate,
  PaginatedResponse,
  VerifyResult,
} from "@/types/certificate.types";

const CAND_AUTH_KEY = "naviora_candidate_token";

function orgApi() {
  const token = useOrgAuthStore.getState().accessToken;
  return {
    get:   (url: string, params?: object) => api.get(url,     { headers: { Authorization: `Bearer ${token}` }, params }),
    post:  (url: string, data?: object)   => api.post(url,    data,  { headers: { Authorization: `Bearer ${token}` } }),
    patch: (url: string, data?: object)   => api.patch(url,   data,  { headers: { Authorization: `Bearer ${token}` } }),
  };
}

function candidateToken() {
  if (typeof window !== "undefined") return localStorage.getItem(CAND_AUTH_KEY);
  return null;
}

async function candFetch<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = candidateToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  return res.json();
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  return q.toString();
}

type ApiResp<T> = { success: boolean; data?: T; message?: string };

async function unwrap<T>(promise: Promise<{ data: ApiResp<T> }>): Promise<ApiResp<T>> {
  const res = await promise;
  return res.data;
}

export const certificateService = {
  // ── Admin — Certificates ────────────────────────────────────────────────────
  list: (p: Record<string, unknown> = {}) =>
    unwrap<PaginatedResponse<CertificateListItem>>(api.get("/certificates", { params: p })),

  get: (uuid: string) =>
    unwrap<Certificate>(api.get(`/certificates/${uuid}`)),

  generate: (body: object) =>
    unwrap<Certificate>(api.post("/certificates/generate", body)),

  issue: (uuid: string, remarks?: string) =>
    unwrap<Certificate>(api.post(`/certificates/${uuid}/issue`, { remarks })),

  revoke: (uuid: string, remarks: string) =>
    unwrap<Certificate>(api.post(`/certificates/${uuid}/revoke`, { remarks })),

  suspend: (uuid: string, remarks: string) =>
    unwrap<Certificate>(api.post(`/certificates/${uuid}/suspend`, { remarks })),

  reinstate: (uuid: string) =>
    unwrap<Certificate>(api.post(`/certificates/${uuid}/reinstate`, {})),

  renew: (uuid: string, remarks?: string) =>
    unwrap<Certificate>(api.post(`/certificates/${uuid}/renew`, { remarks: remarks ?? "" })),

  downloadUrl: (uuid: string) => `/api/v1/certificates/${uuid}/download`,

  // ── Admin — Analytics ────────────────────────────────────────────────────────
  analytics: () =>
    unwrap<CertificateAnalytics>(api.get("/certificates/analytics/summary")),

  // ── Admin — Settings ─────────────────────────────────────────────────────────
  getSettings: () =>
    unwrap<CertificateSettings>(api.get("/certificates/settings/config")),

  updateSettings: (body: Partial<CertificateSettings>) =>
    unwrap<CertificateSettings>(api.patch("/certificates/settings/config", body)),

  // ── Admin — Templates ────────────────────────────────────────────────────────
  listTemplates: (p: Record<string, unknown> = {}) =>
    unwrap<PaginatedResponse<CertificateTemplate>>(api.get("/certificates/templates", { params: p })),

  createTemplate: (body: object) =>
    unwrap<CertificateTemplate>(api.post("/certificates/templates", body)),

  updateTemplate: (uuid: string, body: object) =>
    unwrap<CertificateTemplate>(api.patch(`/certificates/templates/${uuid}`, body)),

  deleteTemplate: (uuid: string) =>
    unwrap<null>(api.delete(`/certificates/templates/${uuid}`)),

  // ── Admin — Rules ────────────────────────────────────────────────────────────
  listRules: (p: Record<string, unknown> = {}) =>
    unwrap<PaginatedResponse<CertificateRule>>(api.get("/certificates/rules", { params: p })),

  createRule: (body: object) =>
    unwrap<CertificateRule>(api.post("/certificates/rules", body)),

  updateRule: (uuid: string, body: object) =>
    unwrap<CertificateRule>(api.patch(`/certificates/rules/${uuid}`, body)),

  deleteRule: (uuid: string) =>
    unwrap<null>(api.delete(`/certificates/rules/${uuid}`)),

  // ── Org Portal ───────────────────────────────────────────────────────────────
  orgList: (p: Record<string, unknown> = {}) =>
    unwrap<PaginatedResponse<CertificateListItem>>(orgApi().get("/org/certificates", p)),

  orgGet: (uuid: string) =>
    unwrap<Certificate>(orgApi().get(`/org/certificates/${uuid}`)),

  orgAnalytics: () =>
    unwrap<{ total_issued: number; total_active: number; total_expiring_soon: number; total_expired: number; total_revoked: number; total_suspended: number }>(
      orgApi().get("/org/certificates/analytics")
    ),

  orgRevoke: (uuid: string, remarks: string) =>
    unwrap<Certificate>(orgApi().post(`/org/certificates/${uuid}/revoke`, { remarks })),

  orgRenew: (uuid: string, remarks?: string) =>
    unwrap<Certificate>(orgApi().post(`/org/certificates/${uuid}/renew`, { remarks: remarks ?? "" })),

  orgDownloadUrl: (uuid: string) => `/api/v1/org/certificates/${uuid}/download`,

  // ── Candidate Portal ─────────────────────────────────────────────────────────
  myCertificates: (p: Record<string, unknown> = {}) =>
    candFetch<PaginatedResponse<CertificateListItem>>(`/api/v1/candidate/certificates?${buildQuery(p as Record<string, string>)}`),

  myGet: (uuid: string) =>
    candFetch<Certificate>(`/api/v1/candidate/certificates/${uuid}`),

  myDownloadUrl: (uuid: string) => `/api/v1/candidate/certificates/${uuid}/download`,

  // ── Public Verify ─────────────────────────────────────────────────────────────
  verify: (certificateNumber: string) =>
    fetch(`/api/v1/verify/${encodeURIComponent(certificateNumber)}`).then(r => r.json()) as Promise<{ success: boolean; data?: VerifyResult; message?: string }>,
};
