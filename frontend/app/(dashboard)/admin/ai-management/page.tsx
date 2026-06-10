import type { Metadata } from "next";
export const metadata: Metadata = { title: "AI Management" };
export default function AiManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">AI Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure AI assessment and reporting settings</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">AI Management module</div>
    </div>
  );
}
