import api from "./api";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type { RuntimeSession, SessionDetail } from "./runtime.service";

const BASE = "/org/sessions";

export const orgSessionsService = {
  async listSessions(params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<RuntimeSession>>> {
    const res = await api.get<ApiResponse<PaginatedData<RuntimeSession>>>(BASE, { params });
    return res.data;
  },

  async listVendors(): Promise<ApiResponse<{ uuid: string; name: string }[]>> {
    const res = await api.get<ApiResponse<{ uuid: string; name: string }[]>>(`${BASE}/vendors`);
    return res.data;
  },

  async getSession(uuid: string): Promise<ApiResponse<SessionDetail>> {
    const res = await api.get<ApiResponse<SessionDetail>>(`${BASE}/${uuid}`);
    return res.data;
  },

  async getStats(): Promise<ApiResponse<{ total: number; by_status: Record<string, number> }>> {
    const res = await api.get<ApiResponse<{ total: number; by_status: Record<string, number> }>>(`${BASE}/stats`);
    return res.data;
  },

  async launchSession(sessionUuid: string, assignmentUuid: string, runtimeMode?: string): Promise<ApiResponse<{ uuid: string }>> {
    const res = await api.post<ApiResponse<{ uuid: string }>>(`${BASE}/${sessionUuid}/launch`, {
      assignment_uuid: assignmentUuid,
      runtime_mode: runtimeMode ?? "MANUAL",
    });
    return res.data;
  },

  async submitManualResult(uuid: string, data: { result: string; score?: number; remarks?: string }): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(`${BASE}/${uuid}/manual-result`, data);
    return res.data;
  },
};
