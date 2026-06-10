import type { Metadata } from "next";
import { OrganizationsTable } from "@/features/organizations/OrganizationsTable";

export const metadata: Metadata = { title: "Organizations" };

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Organizations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage tenant organizations and their subscriptions
        </p>
      </div>
      <OrganizationsTable />
    </div>
  );
}
