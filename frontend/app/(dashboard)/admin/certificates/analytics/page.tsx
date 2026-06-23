import type { Metadata } from "next";
import { AdminCertAnalyticsView } from "@/features/certificates/AdminCertAnalyticsView";

export const metadata: Metadata = { title: "Certificate Analytics | Naviora" };

export default function CertificateAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Certificate Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of certificate issuance, expiry, and compliance metrics.</p>
      </div>
      <AdminCertAnalyticsView />
    </div>
  );
}
