import type { Metadata } from "next";
import { CandidateCertificatesView } from "@/features/candidate-portal/CandidateCertificatesView";

export const metadata: Metadata = { title: "My Certificates | Naviora" };

export default function CandidateCertificatesPage() {
  return <CandidateCertificatesView />;
}
