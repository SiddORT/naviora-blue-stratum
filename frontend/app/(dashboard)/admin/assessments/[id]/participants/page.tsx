import type { Metadata } from "next";
import { ParticipantsManager } from "@/features/assessments/ParticipantsManager";

export const metadata: Metadata = { title: "Assessment Participants" };

export default function ParticipantsPage({ params }: { params: { id: string } }) {
  return <ParticipantsManager assessmentUuid={params.id} />;
}
