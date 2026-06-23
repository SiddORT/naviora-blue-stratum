import type { Metadata } from "next";
import { RuntimeDashboardView } from "@/features/runtime/RuntimeDashboardView";

export const metadata: Metadata = { title: "Runtime Dashboard | Naviora" };

export default function RuntimeDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Runtime Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live overview of simulator session activity, agent status, and runtime infrastructure.
        </p>
      </div>
      <RuntimeDashboardView />
    </div>
  );
}
