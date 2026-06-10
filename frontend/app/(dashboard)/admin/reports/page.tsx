import type { Metadata } from "next";
export const metadata: Metadata = { title: "Reports & Analytics" };
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform analytics and exportable reports</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">Reports & Analytics module</div>
    </div>
  );
}
