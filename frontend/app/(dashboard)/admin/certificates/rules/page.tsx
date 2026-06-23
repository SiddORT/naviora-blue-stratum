import type { Metadata } from "next";
import { AdminRulesView } from "@/features/certificates/AdminRulesView";

export const metadata: Metadata = { title: "Certificate Rules | Naviora" };

export default function CertificateRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Certificate Rules</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure issuance criteria and eligibility rules per assessment.</p>
      </div>
      <AdminRulesView />
    </div>
  );
}
