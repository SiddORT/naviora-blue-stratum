import type { Metadata } from "next";
import { OrgProgressView } from "@/features/org-portal/OrgProgressView";

export const metadata: Metadata = { title: "Candidate Progress" };

export default function OrgProgressPage() {
  return <OrgProgressView />;
}
