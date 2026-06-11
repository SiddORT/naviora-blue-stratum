"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layouts/Sidebar";
import { TopNavbar } from "@/components/layouts/TopNavbar";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center"
           style={{ background: "#071B1E" }}>
        <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</div>
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

      {/* ── Dark teal overlay ───────────────────────────────── */}
      <div className="absolute inset-0" style={{
        zIndex: 1,
        background: "linear-gradient(160deg, rgba(7,27,30,0.90) 0%, rgba(10,32,38,0.88) 50%, rgba(7,27,30,0.93) 100%)",
      }} />

      {/* ── App shell on top ────────────────────────────────── */}
      <div className="relative flex h-full w-full overflow-hidden" style={{ zIndex: 2 }}>
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto p-6"
                style={{ background: "transparent" }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
