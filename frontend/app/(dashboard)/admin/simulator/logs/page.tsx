import { LogsTable } from "@/features/simulators/LogsTable";

export const metadata = { title: "Integration Logs | Naviora" };

export default function IntegrationLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Integration Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Communication log between Naviora and connected simulator systems.
        </p>
      </div>
      <LogsTable />
    </div>
  );
}
