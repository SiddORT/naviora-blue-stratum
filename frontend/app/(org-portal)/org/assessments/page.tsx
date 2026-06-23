import type { Metadata } from "next";
import { OrgAssessmentsView } from "@/features/org-portal/OrgAssessmentsView";

export const metadata: Metadata = { title: "Assessments" };

export default function OrgAssessmentsPage() {
  return <OrgAssessmentsView />;
}
