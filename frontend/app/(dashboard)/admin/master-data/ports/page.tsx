import { PortsTable } from "@/features/master-data/PortsTable";

export const metadata = { title: "Port Library | Naviora" };

export default function PortsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Port Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Master port records available for exercise and scenario configuration.
        </p>
      </div>
      <PortsTable />
    </div>
  );
}
