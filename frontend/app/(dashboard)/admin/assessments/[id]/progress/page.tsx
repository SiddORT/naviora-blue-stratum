import type { Metadata } from "next";
import { ProgressDashboard } from "@/features/assessments/ProgressDashboard";

export const metadata: Metadata = { title: "Assessment Progress" };

export default function ProgressPage({ params }: { params: { id: string } }) {
  return <ProgressDashboard assessmentUuid={params.id} />;
}
