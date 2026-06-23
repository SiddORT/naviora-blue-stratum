import type { Metadata } from "next";
import { EmailTemplatesTable } from "@/features/settings/EmailTemplatesTable";

export const metadata: Metadata = { title: "Email Templates" };

export default function EmailTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Email Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage HTML email templates with dynamic variable substitution
        </p>
      </div>
      <EmailTemplatesTable />
    </div>
  );
}
