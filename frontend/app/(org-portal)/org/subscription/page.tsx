import type { Metadata } from "next";
import { OrgSubscriptionView } from "@/features/org-portal/OrgSubscriptionView";

export const metadata: Metadata = { title: "Subscription" };

export default function OrgSubscriptionPage() {
  return <OrgSubscriptionView />;
}
