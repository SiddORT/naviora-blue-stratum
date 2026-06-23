import type { Metadata } from "next";
import { AdminTemplatesView } from "@/features/certificates/AdminTemplatesView";

export const metadata: Metadata = { title: "Certificate Templates | Naviora" };

export default function CertificateTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Certificate Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">Design and manage certificate templates for different assessment types.</p>
      </div>
      <AdminTemplatesView />
    </div>
  );
}
