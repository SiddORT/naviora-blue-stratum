import type { Metadata } from "next";
import { EnquiryDetail } from "@/features/crm/EnquiryDetail";

export const metadata: Metadata = { title: "Enquiry Detail" };

export default async function EnquiryDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <EnquiryDetail uuid={uuid} />;
}
