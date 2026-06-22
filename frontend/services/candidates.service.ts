import api from "./api";
import type { ApiResponse, PaginatedData, PaginationParams } from "@/types/api.types";
import type { Candidate } from "@/types/common.types";

export const candidatesService = {
  async list(params?: PaginationParams & { organization_id?: number; status?: string }): Promise<ApiResponse<PaginatedData<Candidate>>> {
    const res = await api.get<ApiResponse<PaginatedData<Candidate>>>("/candidates", { params });
    return res.data;
  },

  async get(uuid: string): Promise<ApiResponse<Candidate>> {
    const res = await api.get<ApiResponse<Candidate>>(`/candidates/${uuid}`);
    return res.data;
  },

  async create(data: Partial<Candidate> & { password: string }): Promise<ApiResponse<Candidate>> {
    const res = await api.post<ApiResponse<Candidate>>("/candidates", data);
    return res.data;
  },

  async update(uuid: string, data: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    const res = await api.put<ApiResponse<Candidate>>(`/candidates/${uuid}`, data);
    return res.data;
  },

  async delete(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/candidates/${uuid}`);
    return res.data;
  },
};
