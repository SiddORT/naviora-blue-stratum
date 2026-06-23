import type { Metadata } from "next";
import { NotificationSettingsForm } from "@/features/settings/NotificationSettingsForm";

export const metadata: Metadata = { title: "Notification Settings" };

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Notification Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enable or disable platform notification channels
        </p>
      </div>
      <NotificationSettingsForm />
    </div>
  );
}
