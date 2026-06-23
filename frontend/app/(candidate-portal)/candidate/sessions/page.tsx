import type { Metadata } from "next";
import { CandidateSessionsView } from "@/features/candidate-portal/CandidateSessionsView";

export const metadata: Metadata = { title: "My Sessions | Naviora" };

export default function CandidateSessionsPage() {
  return <CandidateSessionsView />;
}
