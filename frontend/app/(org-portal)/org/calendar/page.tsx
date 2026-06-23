import type { Metadata } from "next";
import { OrgCalendarView } from "@/features/org-portal/OrgCalendarView";

export const metadata: Metadata = { title: "Assessment Calendar" };

export default function OrgCalendarPage() {
  return <OrgCalendarView />;
}
