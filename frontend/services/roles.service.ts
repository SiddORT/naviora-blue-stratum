import api from "./api";
import type { ApiResponse, PaginatedData, PaginationParams } from "@/types/api.types";
import type { Role, RoleDetail, Permission } from "@/types/common.types";

export const rolesService = {
  async list(params?: PaginationParams): Promise<ApiResponse<PaginatedData<Role>>> {
    const res = await api.get<ApiResponse<PaginatedData<Role>>>("/roles", { params });
    return res.data;
  },

  async get(uuid: string): Promise<ApiResponse<RoleDetail>> {
    const res = await api.get<ApiResponse<RoleDetail>>(`/roles/${uuid}`);
    return res.data;
  },

  async listAllPermissions(): Promise<ApiResponse<Permission[]>> {
    const res = await api.get<ApiResponse<Permission[]>>("/roles/permissions");
    return res.data;
  },

  async create(data: { name: string; slug: string; description?: string; permission_ids?: number[] }): Promise<ApiResponse<RoleDetail>> {
    const res = await api.post<ApiResponse<RoleDetail>>("/roles", data);
    return res.data;
  },

  async update(uuid: string, data: { name?: string; description?: string; permission_ids?: number[]; is_active?: boolean }): Promise<ApiResponse<RoleDetail>> {
    const res = await api.put<ApiResponse<RoleDetail>>(`/roles/${uuid}`, data);
    return res.data;
  },

  async clone(uuid: string, data: { name: string; slug: string; description?: string }): Promise<ApiResponse<RoleDetail>> {
    const res = await api.post<ApiResponse<RoleDetail>>(`/roles/${uuid}/clone`, data);
    return res.data;
  },

  async delete(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/roles/${uuid}`);
    return res.data;
  },
};

export const permissionsService = {
  async list(params?: PaginationParams & { module?: string }): Promise<ApiResponse<PaginatedData<Permission>>> {
    const res = await api.get<ApiResponse<PaginatedData<Permission>>>("/permissions", { params });
    return res.data;
  },

  async listModules(): Promise<ApiResponse<string[]>> {
    const res = await api.get<ApiResponse<string[]>>("/permissions/modules");
    return res.data;
  },
};
