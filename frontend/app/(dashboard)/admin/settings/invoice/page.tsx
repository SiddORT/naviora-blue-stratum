import type { Metadata } from "next";
import { InvoiceSettingsForm } from "@/features/settings/InvoiceSettingsForm";

export const metadata: Metadata = { title: "Invoice Settings" };

export default function InvoiceSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Invoice Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invoice and quotation numbering, currency, and tax configuration
        </p>
      </div>
      <InvoiceSettingsForm />
    </div>
  );
}
