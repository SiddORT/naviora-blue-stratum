import type { Metadata } from "next";
import { FeaturesTable } from "@/features/features/FeaturesTable";

export const metadata: Metadata = { title: "Features — Naviora" };

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Features</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage reusable feature flags assigned to plans</p>
      </div>
      <FeaturesTable />
    </div>
  );
}
