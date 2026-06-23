import type { Metadata } from "next";
import { PlatformSettingsForm } from "@/features/settings/PlatformSettingsForm";

export const metadata: Metadata = { title: "Platform Settings" };

export default function PlatformSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Global company information and locale configuration
        </p>
      </div>
      <PlatformSettingsForm />
    </div>
  );
}
