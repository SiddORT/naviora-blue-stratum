import type { Metadata } from "next";
import { PermissionsTable } from "@/features/permissions/PermissionsTable";

export const metadata: Metadata = { title: "Permissions" };

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Permissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse all platform permission definitions
        </p>
      </div>
      <PermissionsTable />
    </div>
  );
}
