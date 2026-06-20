import type { Metadata } from "next";
import { PlanFeaturesMatrix } from "@/features/plans/PlanFeaturesMatrix";

export const metadata: Metadata = { title: "Plan Features — Naviora" };

export default function PlanFeaturesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Plan Features</h1>
        <p className="text-muted-foreground text-sm mt-1">Assign features to plans. Select a plan to manage its feature access.</p>
      </div>
      <PlanFeaturesMatrix />
    </div>
  );
}
