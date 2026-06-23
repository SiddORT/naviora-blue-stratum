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
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data!;
  },

  async listAssignments(token: string, params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<CandidateAssignment>>> {
    const res = await api.get<ApiResponse<PaginatedData<CandidateAssignment>>>(
      "/candidate/assignments",
      { params, headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async getAssignment(token: string, uuid: string): Promise<ApiResponse<CandidateAssignment>> {
    const res = await api.get<ApiResponse<CandidateAssignment>>(
      `/candidate/assignments/${uuid}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async listSessions(token: string, params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<CandidateSession>>> {
    const res = await api.get<ApiResponse<PaginatedData<CandidateSession>>>(
      "/candidate/sessions",
      { params, headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async startSession(token: string, assignmentUuid: string, runtimeMode?: string): Promise<ApiResponse<CandidateSession>> {
    const res = await api.post<ApiResponse<CandidateSession>>(
      "/candidate/sessions",
      { assignment_uuid: assignmentUuid, runtime_mode: runtimeMode },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  async getSession(token: string, uuid: string): Promise<ApiResponse<CandidateSession>> {
    const res = await api.get<ApiResponse<CandidateSession>>(
      `/candidate/sessions/${uuid}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};
