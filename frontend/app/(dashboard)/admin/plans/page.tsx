import type { Metadata } from "next";
import { PlansTable } from "@/features/plans/PlansTable";

export const metadata: Metadata = { title: "Plans — Naviora" };

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Plans</h1>
        <p className="text-muted-foreground text-sm mt-1">Define and manage commercial subscription plans</p>
      </div>
      <PlansTable />
    </div>
  );
}
