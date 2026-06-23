import type { Metadata } from "next";
import { SystemPreferencesForm } from "@/features/settings/SystemPreferencesForm";

export const metadata: Metadata = { title: "System Preferences" };

export default function SystemPreferencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">System Preferences</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Session security, authentication policy, and global defaults
        </p>
      </div>
      <SystemPreferencesForm />
    </div>
  );
}
