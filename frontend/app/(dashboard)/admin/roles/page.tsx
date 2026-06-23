import type { Metadata } from "next";
import { RolesTable } from "@/features/roles/RolesTable";

export const metadata: Metadata = { title: "Roles" };

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Roles</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure platform roles and their permissions
        </p>
      </div>
      <RolesTable />
    </div>
  );
}
