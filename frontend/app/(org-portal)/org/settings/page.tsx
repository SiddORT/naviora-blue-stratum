import type { Metadata } from "next";
import { OrgSettingsView } from "@/features/org-portal/OrgSettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function OrgSettingsPage() {
  return <OrgSettingsView />;
}
