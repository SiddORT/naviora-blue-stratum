import type { Metadata } from "next";
import { TemplatesTable } from "@/features/assessments/TemplatesTable";

export const metadata: Metadata = { title: "Assessment Templates" };

export default function AssessmentTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assessment Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">Build and manage reusable assessment templates with exercises, scoring rules, and version history.</p>
      </div>
      <TemplatesTable />
    </div>
  );
}
