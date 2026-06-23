import type { Metadata } from "next";
import { OrganizationEditForm } from "@/features/organizations/OrganizationEditForm";

export const metadata: Metadata = { title: "Edit Organization | Naviora" };

interface Props { params: Promise<{ uuid: string }> }

export default async function EditOrganizationPage({ params }: Props) {
  const { uuid } = await params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Edit Organization</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update organization details, contact information, and plan assignment.
        </p>
      </div>
      <OrganizationEditForm uuid={uuid} />
    </div>
  );
}
