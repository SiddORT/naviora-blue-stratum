import { ObjectivesTable } from "@/features/exercises/ObjectivesTable";

export const metadata = { title: "Competency Objectives | Naviora" };

export default function ExerciseObjectivesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Competency Objectives</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define reusable competency objectives that can be mapped to exercises and assessments.
        </p>
      </div>
      <ObjectivesTable />
    </div>
  );
}
