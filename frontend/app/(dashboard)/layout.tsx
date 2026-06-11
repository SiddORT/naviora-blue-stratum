"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layouts/Sidebar";
import { TopNavbar } from "@/components/layouts/TopNavbar";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden">

      {/* ── Sea wave background photo ───────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sea-wave-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />

      {/* ── Theme-aware overlay ─────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background: isDark
            ? "linear-gradient(160deg, rgba(7,27,30,0.90) 0%, rgba(10,32,38,0.88) 50%, rgba(7,27,30,0.93) 100%)"
            : "linear-gradient(160deg, rgba(230,244,252,0.94) 0%, rgba(240,249,255,0.92) 50%, rgba(225,241,252,0.95) 100%)",
        }}
      />

      {/* ── App shell ───────────────────────────────────────── */}
      <div className="relative flex h-full w-full overflow-hidden" style={{ zIndex: 2 }}>
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto p-6" style={{ background: "transparent" }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
