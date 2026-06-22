import type { Metadata } from "next";
import { ConsentRecordsTable } from "@/features/crm/ConsentRecordsTable";

export const metadata: Metadata = { title: "Consent Records" };

export default function ConsentRecordsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Consent Records</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Immutable GDPR consent audit trail for all enquiry submissions
        </p>
      </div>
      <ConsentRecordsTable />
    </div>
  );
}
