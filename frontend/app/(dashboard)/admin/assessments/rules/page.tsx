import type { Metadata } from "next";
import { RulesTable } from "@/features/assessments/RulesTable";

export const metadata: Metadata = { title: "Assessment Rules" };

export default function AssessmentRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assessment Rules</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure pass criteria, attempt limits, variant selection, and auto-fail triggers per assessment.</p>
      </div>
      <RulesTable />
    </div>
  );
}
