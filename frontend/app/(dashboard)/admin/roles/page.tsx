import type { Metadata } from "next";

export const metadata: Metadata = { title: "Roles & Permissions" };

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Roles & Permissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure role-based access control
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">
        Roles & Permissions management module
      </div>
    </div>
  );
}
