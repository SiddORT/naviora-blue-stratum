"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { simulatorsService } from "@/services/simulators.service";
import { VendorForm } from "@/features/simulators/VendorForm";

export default function EditVendorPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ["simulator-vendor", uuid],
    queryFn: () => simulatorsService.getVendor(uuid),
  });

  const vendor = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-40" />
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-sm text-muted-foreground">Vendor not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Edit Simulator Vendor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update vendor details and connection information.
        </p>
      </div>
      <VendorForm vendor={vendor} />
    </div>
  );
}
