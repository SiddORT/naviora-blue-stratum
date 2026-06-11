import { ScenariosTable } from "@/features/exercises/ScenariosTable";

export const metadata = { title: "Training Scenarios | Naviora" };

export default function ExerciseScenariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Training Scenarios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reusable maritime encounter and situation templates used as the basis for exercises.
        </p>
      </div>
      <ScenariosTable />
    </div>
  );
}
