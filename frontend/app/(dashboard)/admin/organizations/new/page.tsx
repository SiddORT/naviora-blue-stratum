import type { Metadata } from "next";
import { OrganizationForm } from "@/features/organizations/OrganizationForm";

export const metadata: Metadata = { title: "Add Organization | Naviora" };

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Add Organization</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new tenant organization and configure its plan and contact details.
        </p>
      </div>
      <OrganizationForm />
    </div>
  );
}
