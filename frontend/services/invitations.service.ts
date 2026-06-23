import api from "./api";
import type { ApiResponse, PaginatedData, PaginationParams } from "@/types/api.types";
import type { Invitation } from "@/types/common.types";

export const invitationsService = {
  async list(params?: PaginationParams & { status?: string }): Promise<ApiResponse<PaginatedData<Invitation>>> {
    const res = await api.get<ApiResponse<PaginatedData<Invitation>>>("/invitations", { params });
    return res.data;
  },

  async get(uuid: string): Promise<ApiResponse<Invitation>> {
    const res = await api.get<ApiResponse<Invitation>>(`/invitations/${uuid}`);
    return res.data;
  },

  async create(data: { email: string; full_name?: string; organization_id?: number; role_id?: number; message?: string }): Promise<ApiResponse<Invitation>> {
    const res = await api.post<ApiResponse<Invitation>>("/invitations", data);
    return res.data;
  },

  async revoke(uuid: string): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(`/invitations/${uuid}/revoke`);
    return res.data;
  },

  async resend(uuid: string): Promise<ApiResponse<Invitation>> {
    const res = await api.post<ApiResponse<Invitation>>(`/invitations/${uuid}/resend`);
    return res.data;
  },

  async delete(uuid: string): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/invitations/${uuid}`);
    return res.data;
  },
};
