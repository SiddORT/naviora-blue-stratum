import type { Metadata } from "next";
export const metadata: Metadata = { title: "Audit Logs" };
export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">Immutable log of all platform actions</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">Audit Logs module</div>
    </div>
  );
}
