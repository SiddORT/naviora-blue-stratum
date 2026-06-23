import type { Metadata } from "next";
import { RuntimeConfigsView } from "@/features/runtime/RuntimeConfigsView";

export const metadata: Metadata = { title: "Runtime Configurations | Naviora" };

export default function RuntimeConfigsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Runtime Configurations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure how each simulator vendor launches sessions — cloud API, desktop agent, or manual.
        </p>
      </div>
      <RuntimeConfigsView />
    </div>
  );
}
