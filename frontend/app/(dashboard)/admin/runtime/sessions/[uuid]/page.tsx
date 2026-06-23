import type { Metadata } from "next";
import { RuntimeSessionDetailView } from "@/features/runtime/RuntimeSessionDetailView";

export const metadata: Metadata = { title: "Session Detail | Naviora" };

export default function RuntimeSessionDetailPage({ params }: { params: { uuid: string } }) {
  return <RuntimeSessionDetailView uuid={params.uuid} />;
}
