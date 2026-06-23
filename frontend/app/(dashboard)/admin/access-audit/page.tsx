import type { Metadata } from "next";
import { AccessAuditTable } from "@/features/access-audit/AccessAuditTable";

export const metadata: Metadata = { title: "Access Audit" };

export default function AccessAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Access Audit</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Immutable log of all user and permission activity
        </p>
      </div>
      <AccessAuditTable />
    </div>
  );
}
