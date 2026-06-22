import type { Metadata } from "next";
import { EnquiryDetail } from "@/features/crm/EnquiryDetail";

export const metadata: Metadata = { title: "Enquiry Detail" };

export default function EnquiryDetailPage({ params }: { params: { uuid: string } }) {
  return <EnquiryDetail uuid={params.uuid} />;
}
