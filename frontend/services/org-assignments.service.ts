import api from "./api";
import type { ApiResponse, PaginatedData, PaginationParams } from "@/types/api.types";
import type { OrgAssignment } from "@/types/common.types";

export const orgAssignmentsService = {
  async list(params?: PaginationParams & { user_id?: number; organization_id?: number }): Promise<ApiResponse<PaginatedData<OrgAssignment>>> {
    const res = await api.get<ApiResponse<PaginatedData<OrgAssignment>>>("/org-assignments", { params });
    return res.data;
  },

  async create(data: { user_id: number; organization_id: number; assignment_type?: string; notes?: string }): Promise<ApiResponse<OrgAssignment>> {
    const res = await api.post<ApiResponse<OrgAssignment>>("/org-assignments", data);
    return res.data;
  },

  async update(id: number, data: { assignment_type?: string; notes?: string; is_active?: boolean }): Promise<ApiResponse<OrgAssignment>> {
    const res = await api.put<ApiResponse<OrgAssignment>>(`/org-assignments/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`/org-assignments/${id}`);
    return res.data;
  },
};
