import { VariantsTable } from "@/features/exercises/VariantsTable";

export const metadata = { title: "Exercise Variants | Naviora" };

export default function ExerciseVariantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Exercise Variants</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure simulator-ready variants for each exercise — specifying vessel, port, environment profile, and passing criteria.
        </p>
      </div>
      <VariantsTable />
    </div>
  );
}
