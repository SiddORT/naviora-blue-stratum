import type { Metadata } from "next";
import { OrgSessionDetailView } from "@/features/org-portal/OrgSessionDetailView";

export const metadata: Metadata = { title: "Session Detail | Naviora" };

export default function OrgSessionDetailPage({ params }: { params: { uuid: string } }) {
  return <OrgSessionDetailView uuid={params.uuid} />;
}
