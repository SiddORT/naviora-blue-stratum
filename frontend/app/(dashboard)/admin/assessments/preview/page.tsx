"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PreviewPage } from "@/features/assessments/PreviewPage";

function PreviewContent() {
  const params = useSearchParams();
  const uuid = params.get("uuid") ?? "";

  if (!uuid) {
    return (
      <div className="border border-border rounded-xl bg-card p-12 text-center space-y-2">
        <p className="text-muted-foreground text-sm">No assessment selected.</p>
        <p className="text-xs text-muted-foreground">Navigate here via the Assessment Templates preview button.</p>
      </div>
    );
  }

  return <PreviewPage uuid={uuid} />;
}

export default function AssessmentPreviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assessment Preview</h1>
        <p className="text-muted-foreground text-sm mt-1">Full read-only view of an assessment template including exercises, rules, and version history.</p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
        <PreviewContent />
      </Suspense>
    </div>
  );
}
