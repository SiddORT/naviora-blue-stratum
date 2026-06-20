import type { Metadata } from "next";
import { PlanExercisesMatrix } from "@/features/plans/PlanExercisesMatrix";

export const metadata: Metadata = { title: "Plan Exercises — Naviora" };

export default function PlanExercisesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Plan Exercises</h1>
        <p className="text-muted-foreground text-sm mt-1">Control which exercises are accessible per plan</p>
      </div>
      <PlanExercisesMatrix />
    </div>
  );
}
