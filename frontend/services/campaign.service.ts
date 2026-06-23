import api from "@/services/api";
import type {
  ActiveAssessmentOption,
  AssignmentDetail,
  CampaignCreate,
  CampaignDetail,
  CampaignStats,
  CampaignUpdate,
  CalendarEvent,
  PaginatedAssignments,
  PaginatedCampaigns,
  PaginatedProgress,
  ProgressSummary,
} from "@/types/campaign.types";

const BASE = "/api/v1/org";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ── Campaigns ────────────────────────────────────────────────────────────────

export async function listCampaigns(
  token: string,
  params: { page?: number; page_size?: number; search?: string; status?: string } = {}
): Promise<PaginatedCampaigns> {
  const p = new URLSearchParams();
  if (params.page) p.set("page", String(params.page));
  if (params.page_size) p.set("page_size", String(params.page_size));
  if (params.search) p.set("search", params.search);
  if (params.status) p.set("status", params.status);
  const res = await api.get(`${BASE}/campaigns?${p.toString()}`, { headers: authHeaders(token) });
  return res.data.data;
}

export async function getCampaignStats(token: string): Promise<CampaignStats> {
  const res = await api.get(`${BASE}/campaigns/stats`, { headers: authHeaders(token) });
  return res.data.data;
}

export async function getCampaign(token: string, uuid: string): Promise<CampaignDetail> {
  const res = await api.get(`${BASE}/campaigns/${uuid}`, { headers: authHeaders(token) });
  return res.data.data;
}

export async function getActiveAssessments(token: string): Promise<ActiveAssessmentOption[]> {
  const res = await api.get(`${BASE}/campaigns/active-assessments`, { headers: authHeaders(token) });
  return res.data.data;
}

export async function createCampaign(token: string, body: CampaignCreate): Promise<CampaignDetail> {
  const res = await api.post(`${BASE}/campaigns`, body, { headers: authHeaders(token) });
  return res.data.data;
}

export async function updateCampaign(token: string, uuid: string, body: CampaignUpdate): Promise<CampaignDetail> {
  const res = await api.patch(`${BASE}/campaigns/${uuid}`, body, { headers: authHeaders(token) });
  return res.data.data;
}

export async function publishCampaign(token: string, uuid: string): Promise<void> {
  await api.post(`${BASE}/campaigns/${uuid}/publish`, {}, { headers: authHeaders(token) });
}

export async function activateCampaign(token: string, uuid: string): Promise<void> {
  await api.post(`${BASE}/campaigns/${uuid}/activate`, {}, { headers: authHeaders(token) });
}

export async function archiveCampaign(token: string, uuid: string): Promise<void> {
  await api.post(`${BASE}/campaigns/${uuid}/archive`, {}, { headers: authHeaders(token) });
}

export async function deleteCampaign(token: string, uuid: string): Promise<void> {
  await api.delete(`${BASE}/campaigns/${uuid}`, { headers: authHeaders(token) });
}

// ── Assignments ───────────────────────────────────────────────────────────────

export async function listCampaignAssignments(
  token: string,
  campaignUuid: string,
  params: { page?: number; page_size?: number; search?: string; status?: string } = {}
): Promise<PaginatedAssignments> {
  const p = new URLSearchParams();
  if (params.page) p.set("page", String(params.page));
  if (params.page_size) p.set("page_size", String(params.page_size));
  if (params.search) p.set("search", params.search);
  if (params.status) p.set("status", params.status);
  const res = await api.get(`${BASE}/campaigns/${campaignUuid}/assignments?${p.toString()}`, {
    headers: authHeaders(token),
  });
  return res.data.data;
}

export async function assignCandidate(
  token: string,
  campaignUuid: string,
  body: { candidate_id: number; due_date?: string; notes?: string }
): Promise<AssignmentDetail> {
  const res = await api.post(`${BASE}/campaigns/${campaignUuid}/assignments`, body, {
    headers: authHeaders(token),
  });
  return res.data.data;
}

export async function bulkAssignCandidates(
  token: string,
  campaignUuid: string,
  body: { candidate_ids: number[]; due_date?: string; notes?: string }
): Promise<{ assigned: number; skipped: number; errors: string[] }> {
  const res = await api.post(`${BASE}/campaigns/${campaignUuid}/assignments/bulk`, body, {
    headers: authHeaders(token),
  });
  return res.data.data;
}

export async function listAllAssignments(
  token: string,
  params: { page?: number; page_size?: number; search?: string; status?: string; campaign_uuid?: string } = {}
): Promise<PaginatedAssignments> {
  const p = new URLSearchParams();
  if (params.page) p.set("page", String(params.page));
  if (params.page_size) p.set("page_size", String(params.page_size));
  if (params.search) p.set("search", params.search);
  if (params.status) p.set("status", params.status);
  if (params.campaign_uuid) p.set("campaign_uuid", params.campaign_uuid);
  const res = await api.get(`${BASE}/assignments?${p.toString()}`, { headers: authHeaders(token) });
  return res.data.data;
}

export async function getAssignment(token: string, uuid: string): Promise<AssignmentDetail> {
  const res = await api.get(`${BASE}/assignments/${uuid}`, { headers: authHeaders(token) });
  return res.data.data;
}

export async function updateAssignmentStatus(token: string, uuid: string, status: string): Promise<void> {
  await api.patch(`${BASE}/assignments/${uuid}/status`, { status }, { headers: authHeaders(token) });
}

export async function cancelAssignment(token: string, uuid: string): Promise<void> {
  await api.delete(`${BASE}/assignments/${uuid}`, { headers: authHeaders(token) });
}

// ── Progress ─────────────────────────────────────────────────────────────────

export async function getProgress(
  token: string,
  params: { page?: number; page_size?: number; search?: string; status?: string; campaign_uuid?: string } = {}
): Promise<PaginatedProgress> {
  const p = new URLSearchParams();
  if (params.page) p.set("page", String(params.page));
  if (params.page_size) p.set("page_size", String(params.page_size));
  if (params.search) p.set("search", params.search);
  if (params.status) p.set("status", params.status);
  if (params.campaign_uuid) p.set("campaign_uuid", params.campaign_uuid);
  const res = await api.get(`${BASE}/progress?${p.toString()}`, { headers: authHeaders(token) });
  return res.data.data;
}

export async function getProgressSummary(token: string): Promise<ProgressSummary> {
  const res = await api.get(`${BASE}/progress/summary`, { headers: authHeaders(token) });
  return res.data.data;
}

// ── Calendar ─────────────────────────────────────────────────────────────────

export async function getCalendarEvents(
  token: string,
  params: { year?: number; month?: number } = {}
): Promise<{ events: CalendarEvent[]; total: number }> {
  const p = new URLSearchParams();
  if (params.year) p.set("year", String(params.year));
  if (params.month) p.set("month", String(params.month));
  const res = await api.get(`${BASE}/calendar?${p.toString()}`, { headers: authHeaders(token) });
  return res.data.data;
}
