import type { Metadata } from "next";
import { OrgDashboardView } from "@/features/org-portal/OrgDashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default function OrgDashboardPage() {
  return <OrgDashboardView />;
}
