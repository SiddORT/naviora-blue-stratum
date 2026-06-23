import type { Metadata } from "next";
import { OrgCampaignCreateView } from "@/features/org-portal/OrgCampaignCreateView";

export const metadata: Metadata = { title: "Create Campaign" };

export default function OrgCampaignCreatePage() {
  return <OrgCampaignCreateView />;
}
