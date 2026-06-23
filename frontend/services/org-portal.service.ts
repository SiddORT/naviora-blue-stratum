import api from "./api";
import type {
  OrgUser,
  OrgDashboardStats,
  OrgUserListItem,
  OrgCandidate,
  OrgCandidateListItem,
  OrgSubscription,
  OrgProfile,
  OrgSettingsUpdate,
  PaginatedResponse,
} from "@/types/org-portal.types";

function orgApi(token: string) {
  return {
    get: (url: string, params?: object) =>
      api.get(url, { headers: { Authorization: `Bearer ${token}` }, params }),
    post: (url: string, data?: object) =>
      api.post(url, data, { headers: { Authorization: `Bearer ${token}` } }),
    put: (url: string, data?: object) =>
      api.put(url, data, { headers: { Authorization: `Bearer ${token}` } }),
    patch: (url: string, data?: object) =>
      api.patch(url, data, { headers: { Authorization: `Bearer ${token}` } }),
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function orgLogin(email: string, password: string) {
  const res = await api.post("/org/auth/login", { email, password });
  return res.data;
}

export async function orgLogout(refreshToken: string, token: string) {
  const res = await orgApi(token).post("/org/auth/logout", { refresh_token: refreshToken });
  return res.data;
}

export async function getOrgMe(token: string): Promise<OrgUser> {
  const res = await orgApi(token).get("/org/auth/me");
  return res.data.data as OrgUser;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getOrgDashboard(token: string): Promise<OrgDashboardStats> {
  const res = await orgApi(token).get("/org/dashboard");
  return res.data.data as OrgDashboardStats;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function listOrgUsers(
  token: string,
  params?: { page?: number; page_size?: number; search?: string; user_type?: string; status?: string }
): Promise<PaginatedResponse<OrgUserListItem>> {
  const res = await orgApi(token).get("/org/users", params);
  return res.data.data as PaginatedResponse<OrgUserListItem>;
}

export async function createOrgUser(
  token: string,
  data: { email: string; full_name: string; user_type: string; phone?: string }
) {
  const res = await orgApi(token).post("/org/users", data);
  return res.data;
}

export async function updateOrgUserStatus(token: string, uuid: string, status: string) {
  const res = await orgApi(token).patch(`/org/users/${uuid}/status`, { status });
  return res.data;
}

// ── Candidates ────────────────────────────────────────────────────────────────

export async function listOrgCandidates(
  token: string,
  params?: { page?: number; page_size?: number; search?: string; status?: string }
): Promise<PaginatedResponse<OrgCandidateListItem>> {
  const res = await orgApi(token).get("/org/candidates", params);
  return res.data.data as PaginatedResponse<OrgCandidateListItem>;
}

export async function getOrgCandidate(token: string, uuid: string): Promise<OrgCandidate> {
  const res = await orgApi(token).get(`/org/candidates/${uuid}`);
  return res.data.data as OrgCandidate;
}

export async function createOrgCandidate(
  token: string,
  data: {
    email: string;
    full_name: string;
    phone?: string;
    nationality?: string;
    rank_or_designation?: string;
    seafarer_id?: string;
    notes?: string;
  }
) {
  const res = await orgApi(token).post("/org/candidates", data);
  return res.data;
}

export async function updateOrgCandidate(token: string, uuid: string, data: object) {
  const res = await orgApi(token).patch(`/org/candidates/${uuid}`, data);
  return res.data;
}

export async function updateOrgCandidateStatus(token: string, uuid: string, status: string) {
  const res = await orgApi(token).patch(`/org/candidates/${uuid}/status`, { status });
  return res.data;
}

// ── Subscription ──────────────────────────────────────────────────────────────

export async function getOrgSubscription(token: string): Promise<OrgSubscription> {
  const res = await orgApi(token).get("/org/subscription");
  return res.data.data as OrgSubscription;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getOrgSettings(token: string): Promise<OrgProfile> {
  const res = await orgApi(token).get("/org/settings");
  return res.data.data as OrgProfile;
}

export async function updateOrgSettings(token: string, data: OrgSettingsUpdate) {
  const res = await orgApi(token).put("/org/settings", data);
  return res.data;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getOrgProfile(token: string) {
  const res = await orgApi(token).get("/org/profile");
  return res.data.data;
}
