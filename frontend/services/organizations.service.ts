import api from "./api";
import type { ApiResponse, PaginatedData, PaginationParams } from "@/types/api.types";
import type { Organization } from "@/types/common.types";

export const organizationsService = {
  async list(params?: PaginationParams): Promise<ApiResponse<PaginatedData<Organization>>> {
    const res = await api.get<ApiResponse<PaginatedData<Organization>>>("/organizations", { params });
    return res.data;
  },

  async get(uuid: string): Promise<ApiResponse<Organization>> {
    const res = await api.get<ApiResponse<Organization>>(`/organizations/${uuid}`);
    return res.data;
  },

  async create(data: Partial<Organization>): Promise<ApiResponse<Organization>> {
    const res = await api.post<ApiResponse<Organization>>("/organizations", data);
    return res.data;
  },

  async update(uuid: string, data: Partial<Organization>): Promise<ApiResponse<Organization>> {
    const res = await api.put<ApiResponse<Organization>>(`/organizations/${uuid}`, data);
    return res.data;
  },

  async delete(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/organizations/${uuid}`);
    return res.data;
  },
};
