import { WeatherTable } from "@/features/master-data/WeatherTable";

export const metadata = { title: "Weather Conditions | Naviora" };

export default function WeatherPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Weather Conditions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reusable weather templates for exercises and environment profiles.
        </p>
      </div>
      <WeatherTable />
    </div>
  );
}
