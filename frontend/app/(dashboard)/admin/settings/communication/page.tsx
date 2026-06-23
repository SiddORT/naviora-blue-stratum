import type { Metadata } from "next";
import { CommunicationSettingsForm } from "@/features/settings/CommunicationSettingsForm";

export const metadata: Metadata = { title: "Communication Settings" };

export default function CommunicationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Communication Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          SMTP outbound email configuration and connection verification
        </p>
      </div>
      <CommunicationSettingsForm />
    </div>
  );
}
