import type { Metadata } from "next";
export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform configuration and preferences</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">Settings module</div>
    </div>
  );
}
