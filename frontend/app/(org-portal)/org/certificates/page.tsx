import type { Metadata } from "next";
import { OrgCertificatesView } from "@/features/org-portal/OrgCertificatesView";

export const metadata: Metadata = { title: "Certificates | Naviora" };

export default function OrgCertificatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Certificates</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage certificates issued to your organization's candidates.</p>
      </div>
      <OrgCertificatesView />
    </div>
  );
}
