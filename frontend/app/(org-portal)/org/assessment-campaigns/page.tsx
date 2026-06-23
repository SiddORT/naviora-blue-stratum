import type { Metadata } from "next";
import { OrgCampaignsView } from "@/features/org-portal/OrgCampaignsView";

export const metadata: Metadata = { title: "Assessment Campaigns" };

export default function OrgCampaignsPage() {
  return <OrgCampaignsView />;
}
