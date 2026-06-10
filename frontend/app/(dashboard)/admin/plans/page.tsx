import type { Metadata } from "next";

export const metadata: Metadata = { title: "Plans & Subscriptions" };

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Plans & Subscriptions</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage subscription plans and billing</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">
        Plans & Subscriptions module
      </div>
    </div>
  );
}
