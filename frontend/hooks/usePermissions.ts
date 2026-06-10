"use client";

import { useAuthStore } from "@/store/auth.store";

export function usePermissions() {
  const { hasPermission, hasRole, user } = useAuthStore();

  return {
    can: hasPermission,
    hasRole,
    isSupAdmin: hasRole("super_admin"),
    isOrgAdmin: hasRole("org_admin"),
    isCandidate: hasRole("candidate"),
    permissions: user?.permissions ?? [],
    roles: user?.roles ?? [],
  };
}
