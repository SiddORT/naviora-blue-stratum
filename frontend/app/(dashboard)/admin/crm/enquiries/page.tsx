import type { Metadata } from "next";
import { EnquiriesTable } from "@/features/crm/EnquiriesTable";

export const metadata: Metadata = { title: "Enquiries" };

export default function EnquiriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Enquiries</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage all inbound contact, plan, and registration enquiries
        </p>
      </div>
      <EnquiriesTable />
    </div>
  );
}
