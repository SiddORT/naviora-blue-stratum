import type { Metadata } from "next";
import { DesktopAgentsView } from "@/features/runtime/DesktopAgentsView";

export const metadata: Metadata = { title: "Desktop Agents | Naviora" };

export default function DesktopAgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Desktop Agent Registry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage registered desktop agent clients for offline simulator execution.
        </p>
      </div>
      <DesktopAgentsView />
    </div>
  );
}
