import type { Metadata } from "next";
export const metadata: Metadata = { title: "Certificates" };
export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Certificates</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and issue competency certificates</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">Certificates module</div>
    </div>
  );
}
