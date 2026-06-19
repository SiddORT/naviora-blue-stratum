import type { Metadata } from "next";
import { ScheduleManager } from "@/features/assessments/ScheduleManager";

export const metadata: Metadata = { title: "Assessment Schedule" };

export default function SchedulePage({ params }: { params: { id: string } }) {
  return <ScheduleManager assessmentUuid={params.id} />;
}
