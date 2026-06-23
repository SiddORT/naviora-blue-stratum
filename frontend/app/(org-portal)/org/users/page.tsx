import type { Metadata } from "next";
import { OrgUsersView } from "@/features/org-portal/OrgUsersView";

export const metadata: Metadata = { title: "Users" };

export default function OrgUsersPage() {
  return <OrgUsersView />;
}
