import type { Metadata } from "next";
import { OrgAssignmentsView } from "@/features/org-portal/OrgAssignmentsView";

export const metadata: Metadata = { title: "Assignments" };

export default function OrgAssignmentsPage() {
  return <OrgAssignmentsView />;
}
