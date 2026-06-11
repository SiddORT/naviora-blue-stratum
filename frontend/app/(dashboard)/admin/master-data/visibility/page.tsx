import { VisibilityTable } from "@/features/master-data/VisibilityTable";

export const metadata = { title: "Visibility Conditions | Naviora" };

export default function VisibilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Visibility Conditions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reusable visibility presets defined by distance range.
        </p>
      </div>
      <VisibilityTable />
    </div>
  );
}
