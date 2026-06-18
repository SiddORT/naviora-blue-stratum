import type { Metadata } from "next";
import { Suspense } from "react";
import { AssessmentBuilder } from "@/features/assessments/AssessmentBuilder";

export const metadata: Metadata = { title: "Assessment Builder" };

export default function AssessmentBuilderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assessment Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">Create a new maritime assessment using the step-by-step builder.</p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
        <AssessmentBuilder />
      </Suspense>
    </div>
  );
}
