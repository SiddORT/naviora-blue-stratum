import api from "./api";
import type { ApiResponse } from "@/types/api.types";
import type { DashboardStats } from "@/types/common.types";

export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    const res = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
    return res.data;
  },
};
