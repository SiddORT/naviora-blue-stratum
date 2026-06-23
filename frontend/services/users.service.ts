import api from "./api";
import type { ApiResponse, PaginatedData, PaginationParams } from "@/types/api.types";
import type { User } from "@/types/common.types";

export const usersService = {
  async list(params?: PaginationParams & { organization_id?: number; status?: string; user_type?: string }): Promise<ApiResponse<PaginatedData<User>>> {
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

  async update(uuid: string, data: Partial<User> & Record<string, unknown>): Promise<ApiResponse<User>> {
    const res = await api.put<ApiResponse<User>>(`/users/${uuid}`, data);
    return res.data;
  },

  async assignRoles(uuid: string, data: { role_slugs: string[]; organization_id?: number }): Promise<ApiResponse<User>> {
    const res = await api.post<ApiResponse<User>>(`/users/${uuid}/assign-roles`, data);
    return res.data;
  },

  async setStatus(uuid: string, status: string, reason?: string): Promise<ApiResponse<User>> {
    const res = await api.post<ApiResponse<User>>(`/users/${uuid}/set-status`, { status, reason });
    return res.data;
  },

  async adminResetPassword(uuid: string, new_password: string): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(`/users/${uuid}/reset-password`, { new_password });
    return res.data;
  },

  async delete(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/users/${uuid}`);
    return res.data;
  },
};
