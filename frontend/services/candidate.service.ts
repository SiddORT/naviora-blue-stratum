import api from "./api";
import type { ApiResponse, PaginatedData } from "@/types/api.types";

const CAND_AUTH_KEY = "naviora_candidate_token";
const CAND_USER_KEY = "naviora_candidate_user";

export interface CandidateProfile {
  uuid: string;
  full_name: string;
  email: string;
  phone: string | null;
  rank_or_designation: string | null;
  seafarer_id: string | null;
  nationality: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  status: string;
  organization_id: number | null;
  last_login: string | null;
}

export interface CandidateAssignment {
  uuid: string;
  assignment_status: string;
  result_status: string;
  attempt_count: number;
  final_score: number | null;
  due_date: string | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  campaign_name: string | null;
  campaign_code: string | null;
  assessment_name: string | null;
  assessment_code: string | null;
  assessment_type: string | null;
  exercise_count: number;
  can_start: boolean;
  active_session_uuid: string | null;
}

export interface CandidateSession {
  uuid: string;
  session_reference: string;
  status: string;
  runtime_mode: string;
  assessment_name: string | null;
  exercise_name: string | null;
  variant_name: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  result_received: boolean;
  raw_result: Record<string, unknown> | null;
  failure_reason: string | null;
  created_at: string;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const candidateService = {
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem(CAND_AUTH_KEY) : null),
  getUser: (): CandidateProfile | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(CAND_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession: (token: string, candidate: CandidateProfile) => {
    localStorage.setItem(CAND_AUTH_KEY, token);
    localStorage.setItem(CAND_USER_KEY, JSON.stringify(candidate));
  },
  clearSession: () => {
    localStorage.removeItem(CAND_AUTH_KEY);
    localStorage.removeItem(CAND_USER_KEY);
  },
  isLoggedIn: () => Boolean(candidateService.getToken()),

  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<{ token: string; candidate: CandidateProfile }> {
    const res = await api.post<ApiResponse<{ access_token: string; candidate: CandidateProfile }>>(
      "/candidate/auth/login",
      { email, password }
    );
    const data = res.data.data!;
    candidateService.setSession(data.access_token, data.candidate);
    return { token: data.access_token, candidate: data.candidate };
  },

  async getMe(token: string): Promise<CandidateProfile> {
    const res = await api.get<ApiResponse<CandidateProfile>>("/candidate/auth/me", {
      headers: authHeader(token),
    });
    return res.data.data!;
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboard(token: string): Promise<ApiResponse<{
    stats: {
      total_assignments: number; in_progress: number; completed: number;
      assigned: number; passed: number; total_sessions: number; total_certificates: number;
    };
    recent_assignments: CandidateAssignment[];
  }>> {
    const res = await api.get("/candidate/dashboard", { headers: authHeader(token) });
    return res.data;
  },

  // ── Assignments ───────────────────────────────────────────────────────────
  async listAssignments(token: string, params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<CandidateAssignment>>> {
    const res = await api.get<ApiResponse<PaginatedData<CandidateAssignment>>>(
      "/candidate/assignments",
      { params, headers: authHeader(token) }
    );
    return res.data;
  },

  async getAssignment(token: string, uuid: string): Promise<ApiResponse<CandidateAssignment>> {
    const res = await api.get<ApiResponse<CandidateAssignment>>(
      `/candidate/assignments/${uuid}`,
      { headers: authHeader(token) }
    );
    return res.data;
  },

  // ── Sessions ──────────────────────────────────────────────────────────────
  async listSessions(token: string, params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<CandidateSession>>> {
    const res = await api.get<ApiResponse<PaginatedData<CandidateSession>>>(
      "/candidate/sessions",
      { params, headers: authHeader(token) }
    );
    return res.data;
  },

  async startSession(token: string, assignmentUuid: string, runtimeMode?: string): Promise<ApiResponse<CandidateSession>> {
    const res = await api.post<ApiResponse<CandidateSession>>(
      "/candidate/sessions",
      { assignment_uuid: assignmentUuid, runtime_mode: runtimeMode },
      { headers: authHeader(token) }
    );
    return res.data;
  },

  async getSession(token: string, uuid: string): Promise<ApiResponse<CandidateSession>> {
    const res = await api.get<ApiResponse<CandidateSession>>(
      `/candidate/sessions/${uuid}`,
      { headers: authHeader(token) }
    );
    return res.data;
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  async getProfile(token: string): Promise<ApiResponse<CandidateProfile>> {
    const res = await api.get<ApiResponse<CandidateProfile>>(
      "/candidate/profile",
      { headers: authHeader(token) }
    );
    return res.data;
  },

  async updateProfile(token: string, data: {
    full_name?: string;
    phone?: string;
    nationality?: string;
    rank_or_designation?: string;
    date_of_birth?: string;
  }): Promise<ApiResponse<CandidateProfile>> {
    const res = await api.put<ApiResponse<CandidateProfile>>(
      "/candidate/profile",
      data,
      { headers: authHeader(token) }
    );
    return res.data;
  },

  async uploadPhoto(token: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<ApiResponse<{ avatar_url: string }>>(
      "/candidate/profile/photo",
      form,
      { headers: { ...authHeader(token), "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>(
      "/candidate/profile/change-password",
      { current_password: currentPassword, new_password: newPassword },
      { headers: authHeader(token) }
    );
    return res.data;
  },

  // ── Check-In ──────────────────────────────────────────────────────────────
  async submitCheckin(token: string, assignmentUuid: string, data: {
    identity_confirmed: boolean;
    rules_accepted: boolean;
    browser_name?: string;
    browser_version?: string;
    operating_system?: string;
    device_type?: string;
    screen_resolution?: string;
    timezone_name?: string;
  }): Promise<ApiResponse<{ uuid: string; checked_in_at: string }>> {
    const res = await api.post<ApiResponse<{ uuid: string; checked_in_at: string }>>(
      `/candidate/checkin/${assignmentUuid}`,
      data,
      { headers: authHeader(token) }
    );
    return res.data;
  },

  async getCheckin(token: string, assignmentUuid: string): Promise<ApiResponse<{
    uuid: string;
    identity_confirmed: boolean;
    rules_accepted: boolean;
    is_complete: boolean;
    checked_in_at: string | null;
  }>> {
    const res = await api.get(
      `/candidate/checkin/${assignmentUuid}`,
      { headers: authHeader(token) }
    );
    return res.data;
  },

  async uploadWebcam(token: string, assignmentUuid: string, file: File): Promise<ApiResponse<{ webcam_snapshot_path: string }>> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<ApiResponse<{ webcam_snapshot_path: string }>>(
      `/candidate/checkin/${assignmentUuid}/webcam`,
      form,
      { headers: { ...authHeader(token), "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  // ── Proctoring ────────────────────────────────────────────────────────────
  async logProctoringEvent(token: string, assignmentUuid: string, eventType: string, remarks?: string): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>(
      "/candidate/proctoring",
      { assignment_uuid: assignmentUuid, event_type: eventType, remarks },
      { headers: authHeader(token) }
    );
    return res.data;
  },

  // ── Activity ──────────────────────────────────────────────────────────────
  async getActivity(token: string, page = 1, pageSize = 20): Promise<ApiResponse<{
    items: Array<{
      id: number;
      assignment_id: number;
      activity_type: string;
      activity_description: string | null;
      icon: string;
      created_at: string;
    }>;
    total: number;
    page: number;
    pages: number;
  }>> {
    const res = await api.get(
      "/candidate/activity",
      { params: { page, page_size: pageSize }, headers: authHeader(token) }
    );
    return res.data;
  },
};
