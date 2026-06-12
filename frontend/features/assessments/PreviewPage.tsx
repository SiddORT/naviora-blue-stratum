"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { assessmentTemplateService } from "@/services/assessments.service";
import { ClipboardList, Clock, Target, Layers, BookOpen, History, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AssessmentTemplate, AssessmentVersion } from "@/types/assessment.types";

interface PreviewData extends AssessmentTemplate {
  versions: AssessmentVersion[];
}

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  active: "bg-green-500/15 text-green-600 dark:text-green-400",
  archived: "bg-muted text-muted-foreground",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-xs">{value}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function PreviewPage({ uuid }: { uuid: string }) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["assessment-preview", uuid],
    queryFn: () => assessmentTemplateService.preview(uuid),
    enabled: !!uuid,
  });

  const assessment = data?.data as PreviewData | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading assessment...</div>
      </div>
    );
  }

  if (isError || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Assessment not found.</p>
        <button onClick={() => router.back()} className="text-sm text-primary hover:underline">Go back</button>
      </div>
    );
  }

  const totalWeight = assessment.exercises.reduce((s, e) => s + (e.weightage || 0), 0);
  const sortedExercises = [...assessment.exercises].sort((a, b) => a.sequence_number - b.sequence_number);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="border border-border rounded-xl bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">{assessment.assessment_name}</h2>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[assessment.status] ?? "bg-muted")}>{assessment.status}</span>
            </div>
            <p className="font-mono text-sm text-muted-foreground">{assessment.assessment_code}</p>
            {assessment.category_name && <p className="text-sm text-muted-foreground">Category: {assessment.category_name}</p>}
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Version</span>
            <p className="text-2xl font-bold text-primary">v{assessment.version_number}</p>
          </div>
        </div>
        {assessment.description && <p className="text-sm text-muted-foreground border-t border-border pt-3">{assessment.description}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Pass Score" value={assessment.passing_score != null ? `${assessment.passing_score}%` : "—"} />
        <StatCard icon={Clock} label="Duration" value={assessment.duration_minutes != null ? `${assessment.duration_minutes} min` : "—"} />
        <StatCard icon={BookOpen} label="Exercises" value={assessment.exercises_count} />
        <StatCard icon={Layers} label="Max Attempts" value={assessment.max_attempts ?? "—"} />
      </div>

      <div className="border border-border rounded-xl bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Assessment Configuration</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <div>
            <InfoRow label="Variant Selection Mode" value={<span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{assessment.variant_selection_mode}</span>} />
            <InfoRow label="Randomize Exercise Order" value={assessment.randomize_exercise_order ? "Yes" : "No"} />
            <InfoRow label="Randomize Variant Selection" value={assessment.randomize_variant_selection ? "Yes" : "No"} />
          </div>
        </div>
      </div>

      {assessment.instructions && (
        <div className="border border-border rounded-xl bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Candidate Instructions</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assessment.instructions}</p>
        </div>
      )}

      <div className="border border-border rounded-xl bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Exercise Breakdown</h3>
          <span className={cn("text-xs font-medium", Math.abs(totalWeight - 100) < 0.1 ? "text-green-500" : "text-yellow-500")}>
            Total weight: {totalWeight.toFixed(1)}%
          </span>
        </div>
        {sortedExercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exercises assigned.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {["Seq", "Exercise", "Code", "Weightage", "Mandatory", "Contribution"].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedExercises.map(ex => (
                  <tr key={ex.exercise_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3 text-muted-foreground">{ex.sequence_number}</td>
                    <td className="px-3 py-3 font-medium text-foreground">{ex.exercise_name ?? "—"}</td>
                    <td className="px-3 py-3"><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{ex.exercise_code ?? "—"}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(ex.weightage, 100)}%` }} />
                        </div>
                        <span>{ex.weightage}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">{ex.mandatory ? <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">Required</span> : <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Optional</span>}</td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">
                      {assessment.passing_score != null ? `${((ex.weightage / 100) * assessment.passing_score).toFixed(1)} pts` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {assessment.versions?.length > 0 && (
        <div className="border border-border rounded-xl bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Version History</h3>
          </div>
          <div className="space-y-2">
            {assessment.versions.map((v: AssessmentVersion) => (
              <div key={v.id} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-foreground">v{v.version_number}</span>
                  {v.change_summary && <span className="text-sm text-muted-foreground ml-3">{v.change_summary}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
