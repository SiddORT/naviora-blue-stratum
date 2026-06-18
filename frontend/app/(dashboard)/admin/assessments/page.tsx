import type { Metadata } from "next";
import { AssessmentList } from "@/features/assessments/AssessmentList";

export const metadata: Metadata = { title: "Assessment Management" };

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assessment Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Build, manage, and deploy maritime assessments for competency evaluation.</p>
      </div>
      <AssessmentList />
    </div>
  );
}
