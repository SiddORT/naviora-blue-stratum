import type { Metadata } from "next";
import { RuntimeSessionsView } from "@/features/runtime/RuntimeSessionsView";

export const metadata: Metadata = { title: "Runtime Sessions | Naviora" };

export default function RuntimeSessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Runtime Sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor all simulator sessions across all organizations, modes, and candidates.
        </p>
      </div>
      <RuntimeSessionsView />
    </div>
  );
}
