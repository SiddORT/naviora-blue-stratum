import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = { title: "Platform Administration — Naviora" };

export default function AdminLoginPage() {
  return <LoginForm />;
}
