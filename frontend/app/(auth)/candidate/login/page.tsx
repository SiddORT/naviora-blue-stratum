import type { Metadata } from "next";
import { CandidateLoginForm } from "@/features/auth/CandidateLoginForm";

export const metadata: Metadata = { title: "Candidate Login — Naviora" };

export default function CandidateLoginPage() {
  return <CandidateLoginForm />;
}
