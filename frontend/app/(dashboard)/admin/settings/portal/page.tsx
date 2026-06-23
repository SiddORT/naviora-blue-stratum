import type { Metadata } from "next";
import { PortalSettingsForm } from "@/features/settings/PortalSettingsForm";

export const metadata: Metadata = { title: "Portal Settings" };

export default function PortalSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Portal Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure public-facing portal URLs and custom domain settings
        </p>
      </div>
      <PortalSettingsForm />
    </div>
  );
}
