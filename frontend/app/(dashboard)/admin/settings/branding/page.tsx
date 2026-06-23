import type { Metadata } from "next";
import { BrandingSettingsForm } from "@/features/settings/BrandingSettingsForm";

export const metadata: Metadata = { title: "Branding Settings" };

export default function BrandingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Branding Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visual identity, colors, and platform branding configuration
        </p>
      </div>
      <BrandingSettingsForm />
    </div>
  );
}
