import type { Metadata } from "next";
import { AdminCertificatesView } from "@/features/certificates/AdminCertificatesView";

export const metadata: Metadata = { title: "Certificate Management | Naviora" };

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Certificate Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Issue, manage, and track maritime competency certificates.</p>
      </div>
      <AdminCertificatesView />
    </div>
  );
}
