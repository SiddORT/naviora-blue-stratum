"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import type { LoginCredentials } from "@/types/auth.types";

export function useAuth() {
  const router = useRouter();
  const { setTokens, setUser, logout: storeLogout, user, isAuthenticated } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: async (response) => {
      if (response.success && response.data) {
        setTokens(response.data.access_token, response.data.refresh_token);
        // Fetch user profile
        try {
          const meRes = await authService.getMe();
          if (meRes.success && meRes.data) {
            setUser(meRes.data);
          }
        } catch {
          // Non-fatal — user will be fetched on next request
        }
        router.replace("/admin/dashboard");
      }
    },
  });

  const logout = useCallback(async () => {
    try {
      const rt = useAuthStore.getState().refreshToken;
      if (rt) await authService.logout(rt);
    } catch {
      // Ignore — always clear local state
    }
    storeLogout();
    router.replace("/login");
  }, [storeLogout, router]);

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
