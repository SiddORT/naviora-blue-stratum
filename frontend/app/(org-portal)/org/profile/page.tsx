import type { Metadata } from "next";
import { OrgProfileView } from "@/features/org-portal/OrgProfileView";

export const metadata: Metadata = { title: "Organization Profile" };

export default function OrgProfilePage() {
  return <OrgProfileView />;
}
