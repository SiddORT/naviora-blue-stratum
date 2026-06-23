import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterPage } from "@/components/landing/RegisterPage";

export const metadata: Metadata = {
  title: "Register | Naviora by Blue Stratum",
  description: "Register your organization or apply as a candidate for the Naviora maritime assessment platform.",
};

export default function Register() {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}
