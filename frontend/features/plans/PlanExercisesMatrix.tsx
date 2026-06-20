"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { planService } from "@/services/plans.service";

async function fetchAllExercises() {
  const res = await fetch("/api/v1/exercises/library/all-active", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load exercises");
  const json = await res.json();
  return (json.data ?? json) as Array<{ id: number; uuid: string; exercise_name: string; exercise_code: string; difficulty?: string; status: string }>;
}

export function PlanExercisesMatrix() {
  const qc = useQueryClient();
  const [selectedPlanUuid, setSelectedPlanUuid] = useState<string>("");

  const { data: plansData } = useQuery({
    queryKey: ["plans", "all"],
    queryFn: async () => {
      const res = await planService.list({ page: 1, page_size: 100 });
      return res.data;
    },
  });

  const { data: allExercises = [] } = useQuery({
    queryKey: ["exercises", "all-active"],
    queryFn: fetchAllExercises,
  });

  const { data: planExercisesRes = [], isLoading: loadingPlanExercises } = useQuery({
    queryKey: ["plan-exercises", selectedPlanUuid],
    queryFn: () => planService.getExercises(selectedPlanUuid).then((r) => r.data),
    enabled: !!selectedPlanUuid,
  });

  const upsertMutation = useMutation({
    mutationFn: ({ exerciseId, enabled }: { exerciseId: number; enabled: boolean }) =>
      planService.upsertExercise(selectedPlanUuid, { exercise_id: exerciseId, is_enabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-exercises", selectedPlanUuid] }),
  });

  const removeMutation = useMutation({
    mutationFn: (exerciseId: number) => planService.removeExercise(selectedPlanUuid, exerciseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-exercises", selectedPlanUuid] }),
  });

  const plans = plansData?.items ?? [];
  const enabledIds = new Set(planExercisesRes.filter((e) => e.is_enabled).map((e) => e.exercise_id));

  const DIFF_COLORS: Record<string, string> = {
    easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    hard: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Select Plan</p>
          <Select value={selectedPlanUuid} onValueChange={setSelectedPlanUuid}>
            <SelectTrigger className="w-64 bg-background border-border">
              <SelectValue placeholder="Choose a plan..." />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border">
              {plans.map((p) => (
                <SelectItem key={p.uuid} value={p.uuid}>{p.plan_name} ({p.plan_code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedPlanUuid && (
          <div className="mt-5 text-sm text-muted-foreground">
            {enabledIds.size} of {allExercises.length} exercises enabled
          </div>
        )}
      </div>

      {!selectedPlanUuid ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">
          Select a plan above to manage exercise access.
        </div>
      ) : loadingPlanExercises ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 bg-surface rounded animate-pulse" />)}
        </div>
      ) : allExercises.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">
          No active exercises found.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                {["Exercise", "Code", "Difficulty", "Enabled"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allExercises.map((ex) => {
                const enabled = enabledIds.has(ex.id);
                return (
                  <tr key={ex.uuid} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium text-foreground">{ex.exercise_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ex.exercise_code}</td>
                    <td className="px-4 py-3">
                      {ex.difficulty && (
                        <Badge variant="outline" className={`text-xs ${DIFF_COLORS[ex.difficulty.toLowerCase()] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
                          {ex.difficulty}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={enabled}
                        onCheckedChange={(on) => {
                          if (on) upsertMutation.mutate({ exerciseId: ex.id, enabled: true });
                          else removeMutation.mutate(ex.id);
                        }}
                        disabled={upsertMutation.isPending || removeMutation.isPending}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
