import type { Metadata } from "next";
import { OrgSessionsView } from "@/features/org-portal/OrgSessionsView";

export const metadata: Metadata = { title: "Sessions | Naviora" };

export default function OrgSessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor simulator sessions for candidates in your organization.
        </p>
      </div>
      <OrgSessionsView />
    </div>
  );
}
