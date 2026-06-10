import type { Metadata } from "next";
export const metadata: Metadata = { title: "Exercise Management" };
export default function ExercisesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Exercise Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Create and manage training exercises</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">Exercise Management module</div>
    </div>
  );
}
