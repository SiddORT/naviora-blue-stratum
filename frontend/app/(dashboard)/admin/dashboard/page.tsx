import type { Metadata } from "next";
import { DashboardCards } from "@/features/dashboard/DashboardCards";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform overview and key metrics
        </p>
      </div>
      <DashboardCards />
    </div>
  );
}
