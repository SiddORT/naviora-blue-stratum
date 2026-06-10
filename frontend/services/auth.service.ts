import api from "./api";
import type { ApiResponse } from "@/types/api.types";
import type { LoginCredentials, TokenResponse, UserMe } from "@/types/auth.types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<TokenResponse>> {
    const res = await api.post<ApiResponse<TokenResponse>>("/auth/login", credentials);
    return res.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refresh_token: refreshToken });
  },

  async getMe(): Promise<ApiResponse<UserMe>> {
    const res = await api.get<ApiResponse<UserMe>>("/auth/me");
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return res.data;
  },
};
