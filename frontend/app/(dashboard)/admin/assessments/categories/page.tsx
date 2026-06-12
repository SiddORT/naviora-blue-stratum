import type { Metadata } from "next";
import { CategoriesTable } from "@/features/assessments/CategoriesTable";

export const metadata: Metadata = { title: "Assessment Categories" };

export default function AssessmentCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assessment Categories</h1>
        <p className="text-muted-foreground text-sm mt-1">Organise assessments into logical domains and competency areas.</p>
      </div>
      <CategoriesTable />
    </div>
  );
}
