import { VesselsTable } from "@/features/master-data/VesselsTable";

export const metadata = { title: "Vessel Library | Naviora" };

export default function VesselsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Vessel Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Master vessel types used across exercises and assessments.
        </p>
      </div>
      <VesselsTable />
    </div>
  );
}
