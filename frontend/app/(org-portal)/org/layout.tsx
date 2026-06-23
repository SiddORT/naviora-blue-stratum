"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar } from "@/components/org/OrgSidebar";
import { OrgTopbar } from "@/components/org/OrgTopbar";
import { useOrgAuthStore } from "@/store/org-auth.store";

export default function OrgPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useOrgAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/org/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#0B0B0F" }}>
        <div className="text-sm" style={{ color: "#6B7280" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#0B0B0F" }}>
      <OrgSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <OrgTopbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
