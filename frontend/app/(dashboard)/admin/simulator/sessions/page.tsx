import { SessionsTable } from "@/features/simulators/SessionsTable";

export const metadata = { title: "Simulator Sessions | Naviora" };

export default function SimulatorSessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Simulator Sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all recorded simulator exercise sessions. Sessions are created automatically by simulator integrations.
        </p>
      </div>
      <SessionsTable />
    </div>
  );
}
