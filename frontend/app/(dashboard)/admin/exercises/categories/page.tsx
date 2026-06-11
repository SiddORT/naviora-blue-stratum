import { CategoriesTable } from "@/features/exercises/CategoriesTable";

export const metadata = { title: "Exercise Categories | Naviora" };

export default function ExerciseCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Exercise Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organise exercises into domain-specific categories for structured curriculum management.
        </p>
      </div>
      <CategoriesTable />
    </div>
  );
}
