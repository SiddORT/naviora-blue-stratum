import type { Metadata } from "next";
import { InvitationsTable } from "@/features/invitations/InvitationsTable";

export const metadata: Metadata = { title: "User Invitations" };

export default function InvitationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">User Invitations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Send and manage platform invitations
        </p>
      </div>
      <InvitationsTable />
    </div>
  );
}
