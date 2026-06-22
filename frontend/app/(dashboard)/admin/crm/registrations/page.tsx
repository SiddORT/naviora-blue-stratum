import type { Metadata } from "next";
import { RegistrationsTable } from "@/features/crm/RegistrationsTable";

export const metadata: Metadata = { title: "Registration Requests" };

export default function RegistrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Registration Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Approved enquiries pending organization or candidate provisioning
        </p>
      </div>
      <RegistrationsTable />
    </div>
  );
}
