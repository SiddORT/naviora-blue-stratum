import api from "./api";
import type { ApiResponse, PaginatedData, PaginationParams } from "@/types/api.types";
import type { User } from "@/types/common.types";

export const usersService = {
  async list(params?: PaginationParams & { organization_id?: number; status?: string }): Promise<ApiResponse<PaginatedData<User>>> {
    const res = await api.get<ApiResponse<PaginatedData<User>>>("/users", { params });
    return res.data;
  },

  async get(uuid: string): Promise<ApiResponse<User>> {
    const res = await api.get<ApiResponse<User>>(`/users/${uuid}`);
    return res.data;
  },

  async create(data: Record<string, unknown>): Promise<ApiResponse<User>> {
    const res = await api.post<ApiResponse<User>>("/users", data);
    return res.data;
  },

  async update(uuid: string, data: Partial<User>): Promise<ApiResponse<User>> {
    const res = await api.put<ApiResponse<User>>(`/users/${uuid}`, data);
    return res.data;
  },

  async delete(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/users/${uuid}`);
    return res.data;
  },
};
