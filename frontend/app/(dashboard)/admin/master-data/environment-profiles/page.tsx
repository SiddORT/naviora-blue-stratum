import { EnvironmentProfilesTable } from "@/features/master-data/EnvironmentProfilesTable";

export const metadata = { title: "Environment Profiles | Naviora" };

export default function EnvironmentProfilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Environment Profiles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Composite environmental presets combining weather, sea state, visibility, and time of day.
        </p>
      </div>
      <EnvironmentProfilesTable />
    </div>
  );
}
