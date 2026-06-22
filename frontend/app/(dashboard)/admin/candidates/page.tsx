import { CandidatesTable } from "@/features/candidates/CandidatesTable";

export const metadata = { title: "Candidates — Naviora" };

export default function CandidatesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage candidates who take assessments on the platform.
        </p>
      </div>
      <CandidatesTable />
    </div>
  );
}
