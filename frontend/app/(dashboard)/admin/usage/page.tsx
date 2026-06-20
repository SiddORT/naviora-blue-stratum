import type { Metadata } from "next";
import { UsageDashboard } from "@/features/usage/UsageDashboard";

export const metadata: Metadata = { title: "Usage Dashboard — Naviora" };

export default function UsagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usage Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Live usage tracking across all organizations</p>
      </div>
      <UsageDashboard />
    </div>
  );
}
