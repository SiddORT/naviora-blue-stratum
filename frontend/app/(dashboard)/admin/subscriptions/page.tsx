import type { Metadata } from "next";
import { SubscriptionsTable } from "@/features/subscriptions/SubscriptionsTable";

export const metadata: Metadata = { title: "Organization Subscriptions — Naviora" };

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Organization Subscriptions</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage active and historical plan subscriptions per organization</p>
      </div>
      <SubscriptionsTable />
    </div>
  );
}
