import type { Metadata } from "next";
export const metadata: Metadata = { title: "Simulator Management" };
export default function SimulatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Simulator Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage simulator integrations and sessions</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">Simulator Management module</div>
    </div>
  );
}
