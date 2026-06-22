import type { Metadata } from "next";
import { OrgLoginForm } from "@/features/auth/OrgLoginForm";

export const metadata: Metadata = { title: "Organization Login — Naviora" };

export default function OrgLoginPage() {
  return <OrgLoginForm />;
}
