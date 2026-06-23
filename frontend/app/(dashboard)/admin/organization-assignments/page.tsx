import type { Metadata } from "next";
import { OrgAssignmentsTable } from "@/features/org-assignments/OrgAssignmentsTable";

export const metadata: Metadata = { title: "Organization Assignments" };

export default function OrgAssignmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Organization Assignments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage cross-organization user access
        </p>
      </div>
      <OrgAssignmentsTable />
    </div>
  );
}
