import type { Metadata } from "next";
import { OrgCampaignDetailView } from "@/features/org-portal/OrgCampaignDetailView";

export const metadata: Metadata = { title: "Campaign Detail" };

export default function OrgCampaignDetailPage({ params }: { params: { id: string } }) {
  return <OrgCampaignDetailView campaignUuid={params.id} />;
}
