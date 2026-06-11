import api from "./api";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type {
  SimulatorVendor,
  SimulatorConfiguration,
  SimulatorSession,
  IntegrationLog,
  VendorCreatePayload,
  VendorUpdatePayload,
  ConfigCreatePayload,
  ConfigUpdatePayload,
} from "@/types/simulator.types";

const BASE = "/simulators";

export const simulatorsService = {
  // ── Vendors ──────────────────────────────────────────────────────────────
  async listVendors(params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<SimulatorVendor>>> {
    const res = await api.get<ApiResponse<PaginatedData<SimulatorVendor>>>(`${BASE}/vendors`, { params });
    return res.data;
  },

  async getVendor(uuid: string): Promise<ApiResponse<SimulatorVendor>> {
    const res = await api.get<ApiResponse<SimulatorVendor>>(`${BASE}/vendors/${uuid}`);
    return res.data;
  },

  async createVendor(data: VendorCreatePayload): Promise<ApiResponse<SimulatorVendor>> {
    const res = await api.post<ApiResponse<SimulatorVendor>>(`${BASE}/vendors`, data);
    return res.data;
  },

  async updateVendor(uuid: string, data: VendorUpdatePayload): Promise<ApiResponse<SimulatorVendor>> {
    const res = await api.put<ApiResponse<SimulatorVendor>>(`${BASE}/vendors/${uuid}`, data);
    return res.data;
  },

  async deleteVendor(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`${BASE}/vendors/${uuid}`);
    return res.data;
  },

  // ── Configurations ────────────────────────────────────────────────────────
  async listConfigurations(params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<SimulatorConfiguration>>> {
    const res = await api.get<ApiResponse<PaginatedData<SimulatorConfiguration>>>(`${BASE}/configurations`, { params });
    return res.data;
  },

  async getConfiguration(uuid: string): Promise<ApiResponse<SimulatorConfiguration>> {
    const res = await api.get<ApiResponse<SimulatorConfiguration>>(`${BASE}/configurations/${uuid}`);
    return res.data;
  },

  async createConfiguration(data: ConfigCreatePayload): Promise<ApiResponse<SimulatorConfiguration>> {
    const res = await api.post<ApiResponse<SimulatorConfiguration>>(`${BASE}/configurations`, data);
    return res.data;
  },

  async updateConfiguration(uuid: string, data: ConfigUpdatePayload): Promise<ApiResponse<SimulatorConfiguration>> {
    const res = await api.put<ApiResponse<SimulatorConfiguration>>(`${BASE}/configurations/${uuid}`, data);
    return res.data;
  },

  async deleteConfiguration(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`${BASE}/configurations/${uuid}`);
    return res.data;
  },

  async testConnection(uuid: string): Promise<ApiResponse<{ success: boolean; message: string; latency_ms: number | null }>> {
    const res = await api.post<ApiResponse<{ success: boolean; message: string; latency_ms: number | null }>>(
      `${BASE}/configurations/${uuid}/test`
    );
    return res.data;
  },

  // ── Sessions (read-only) ──────────────────────────────────────────────────
  async listSessions(params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<SimulatorSession>>> {
    const res = await api.get<ApiResponse<PaginatedData<SimulatorSession>>>(`${BASE}/sessions`, { params });
    return res.data;
  },

  async getSession(uuid: string): Promise<ApiResponse<SimulatorSession>> {
    const res = await api.get<ApiResponse<SimulatorSession>>(`${BASE}/sessions/${uuid}`);
    return res.data;
  },

  // ── Integration Logs (read-only) ──────────────────────────────────────────
  async listLogs(params?: Record<string, unknown>): Promise<ApiResponse<PaginatedData<IntegrationLog>>> {
    const res = await api.get<ApiResponse<PaginatedData<IntegrationLog>>>(`${BASE}/logs`, { params });
    return res.data;
  },

  async getLog(uuid: string): Promise<ApiResponse<IntegrationLog>> {
    const res = await api.get<ApiResponse<IntegrationLog>>(`${BASE}/logs/${uuid}`);
    return res.data;
  },
};
