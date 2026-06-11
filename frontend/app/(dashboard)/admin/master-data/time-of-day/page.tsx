import { TimeOfDayTable } from "@/features/master-data/TimeOfDayTable";

export const metadata = { title: "Time of Day | Naviora" };

export default function TimeOfDayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Time of Day</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Standardised time-of-day settings for exercises and environment profiles.
        </p>
      </div>
      <TimeOfDayTable />
    </div>
  );
}
