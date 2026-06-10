import type { Metadata } from "next";
export const metadata: Metadata = { title: "Assessment Management" };
export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Assessment Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage candidate assessments</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">Assessment Management module</div>
    </div>
  );
}
