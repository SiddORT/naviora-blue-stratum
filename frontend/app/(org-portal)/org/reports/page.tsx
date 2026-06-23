import type { Metadata } from "next";
import { OrgReportsView } from "@/features/org-portal/OrgReportsView";

export const metadata: Metadata = { title: "Reports" };

export default function OrgReportsPage() {
  return <OrgReportsView />;
}
