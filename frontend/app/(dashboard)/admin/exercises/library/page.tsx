import { ExerciseLibraryTable } from "@/features/exercises/ExerciseLibraryTable";

export const metadata = { title: "Exercise Library | Naviora" };

export default function ExerciseLibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Exercise Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build and manage assessment exercises. Each exercise defines objectives, difficulty, and versioning rules.
        </p>
      </div>
      <ExerciseLibraryTable />
    </div>
  );
}
