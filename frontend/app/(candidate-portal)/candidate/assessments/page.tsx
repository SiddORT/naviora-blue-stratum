import type { Metadata } from "next";
import { CandidateAssessmentsView } from "@/features/candidate-portal/CandidateAssessmentsView";

export const metadata: Metadata = { title: "My Assessments | Naviora" };

export default function CandidateAssessmentsPage() {
  return <CandidateAssessmentsView />;
}
