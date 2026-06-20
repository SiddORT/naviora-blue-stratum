import type { Metadata } from "next";
import { PlanDetail } from "@/features/plans/PlanDetail";

export const metadata: Metadata = { title: "Plan Detail — Naviora" };

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  return <PlanDetail uuid={params.id} />;
}
