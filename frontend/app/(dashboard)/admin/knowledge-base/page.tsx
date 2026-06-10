import type { Metadata } from "next";
export const metadata: Metadata = { title: "Maritime Knowledge Base" };
export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Maritime Knowledge Base</h1>
        <p className="text-muted-foreground text-sm mt-1">Maritime incident library and reference materials</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">Maritime Knowledge Base module</div>
    </div>
  );
}
