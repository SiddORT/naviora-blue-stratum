import { VendorsTable } from "@/features/simulators/VendorsTable";

export const metadata = { title: "Simulator Vendors | Naviora" };

export default function SimulatorVendorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Simulator Vendors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage supported simulator vendors and their integration types.
        </p>
      </div>
      <VendorsTable />
    </div>
  );
}
