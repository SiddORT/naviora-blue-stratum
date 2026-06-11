import { ConfigurationsTable } from "@/features/simulators/ConfigurationsTable";

export const metadata = { title: "Simulator Configurations | Naviora" };

export default function SimulatorConfigurationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Simulator Configurations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage connection settings and authentication for each simulator instance.
        </p>
      </div>
      <ConfigurationsTable />
    </div>
  );
}
