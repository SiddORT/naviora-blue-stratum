import type { Metadata } from "next";
import { OrgCandidatesView } from "@/features/org-portal/OrgCandidatesView";

export const metadata: Metadata = { title: "Candidates" };

export default function OrgCandidatesPage() {
  return <OrgCandidatesView />;
}
