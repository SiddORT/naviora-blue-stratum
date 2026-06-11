import { SeaStatesTable } from "@/features/master-data/SeaStatesTable";

export const metadata = { title: "Sea States | Naviora" };

export default function SeaStatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Sea States</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reusable sea condition definitions with wave height ranges.
        </p>
      </div>
      <SeaStatesTable />
    </div>
  );
}
