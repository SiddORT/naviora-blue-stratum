import api from "./api";
import type { ApiResponse, PaginatedData } from "@/types/api.types";

export interface RuntimeConfig {
  id: number;
  uuid: string;
  simulator_vendor_id: number;
  vendor_name: string | null;
  vendor_code: string | null;
  config_name: string;
  runtime_mode: string;
  api_endpoint: string | null;
  executable_path: string | null;
  working_directory: string | null;
  launch_arguments: string | null;
  result_directory: string | null;
  auto_sync: boolean;
  is_default: boolean;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RuntimeSession {
  uuid: string;
  session_reference: string;
  status: string;
  runtime_mode: string;
  candidate_name: string | null;
  candidate_email: string | null;
  campaign_name: string | null;
  assessment_name: string | null;
  exercise_name: string | null;
  variant_name: string | null;
  organization_name: string | null;
  started_at: string | null;
  completed_at: string | null;
  result_received: boolean;
  created_at: string;
}

export interface SessionLog {
  id: number;
  log_level: string;
  event_type: string;
  event_message: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface SessionDetail extends RuntimeSession {
  failure_reason: string | null;
  raw_result: Record<string, unknown> | null;
  launch_payload: Record<string, unknown> | null;
  launched_by: string | null;
  cancelled_at: string | null;
  updated_at: string;
  logs: SessionLog[];
}

export interface DesktopAgent {
  uuid: string;
  agent_name: string;
  machine_name: string;
  version: string | null;
  status: string;
  ip_address: string | null;
  last_heartbeat: string | null;
  runtime_mode: string;
  created_at: string;
  updated_at: string;
}

export interface RuntimeStats {
  sessions: {
    total: number;
    today: number;
    by_status: Record<string, number>;
    by_mode: Record<string, number>;
    active: RuntimeSession[];
  };
  agents: { total: number; online: number; offline: number };
  configurations: { active: number };
  vendors: { active: number };
}

export const runtimeService = {
  // Dashboard
  async getDashboard(): Promise<ApiResponse<RuntimeStats>> {
    const res = await api.get<ApiResponse<RuntimeStats>>("/runtime/dashboard");
    return res.data;
  },

  // Sessions
  async listSessions(params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<RuntimeSession>>> {
    const res = await api.get<ApiResponse<PaginatedData<RuntimeSession>>>("/runtime/sessions", { params });
    return res.data;
  },
  async getSession(uuid: string): Promise<ApiResponse<SessionDetail>> {
    const res = await api.get<ApiResponse<SessionDetail>>(`/runtime/sessions/${uuid}`);
    return res.data;
  },
  async cancelSession(uuid: string): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(`/runtime/sessions/${uuid}/cancel`);
    return res.data;
  },
  async submitManualResult(uuid: string, data: { result: string; score?: number; remarks?: string }): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(`/runtime/sessions/${uuid}/manual-result`, data);
    return res.data;
  },
  async getSessionStats(): Promise<ApiResponse<Record<string, unknown>>> {
    const res = await api.get<ApiResponse<Record<string, unknown>>>("/runtime/sessions/stats");
    return res.data;
  },

  // Runtime configs
  async listConfigs(params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<RuntimeConfig>>> {
    const res = await api.get<ApiResponse<PaginatedData<RuntimeConfig>>>("/runtime/configs", { params });
    return res.data;
  },
  async createConfig(data: Partial<RuntimeConfig>): Promise<ApiResponse<RuntimeConfig>> {
    const res = await api.post<ApiResponse<RuntimeConfig>>("/runtime/configs", data);
    return res.data;
  },
  async updateConfig(uuid: string, data: Partial<RuntimeConfig>): Promise<ApiResponse<RuntimeConfig>> {
    const res = await api.put<ApiResponse<RuntimeConfig>>(`/runtime/configs/${uuid}`, data);
    return res.data;
  },
  async deleteConfig(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/runtime/configs/${uuid}`);
    return res.data;
  },

  // Agents
  async listAgents(params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<DesktopAgent>>> {
    const res = await api.get<ApiResponse<PaginatedData<DesktopAgent>>>("/runtime/agents", { params });
    return res.data;
  },
  async getAgent(uuid: string): Promise<ApiResponse<DesktopAgent>> {
    const res = await api.get<ApiResponse<DesktopAgent>>(`/runtime/agents/${uuid}`);
    return res.data;
  },
  async updateAgentStatus(uuid: string, status: string): Promise<ApiResponse<DesktopAgent>> {
    const res = await api.patch<ApiResponse<DesktopAgent>>(`/runtime/agents/${uuid}/status`, { status });
    return res.data;
  },
  async deleteAgent(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/runtime/agents/${uuid}`);
    return res.data;
  },
};
