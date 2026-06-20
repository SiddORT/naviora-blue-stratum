"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Puzzle, BookOpen, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { planService, featureService } from "@/services/plans.service";
import { PlanFormDialog } from "./PlanFormDialog";

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Draft: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

type Tab = "overview" | "features" | "exercises" | "simulators";

interface Props { uuid: string }

export function PlanDetail({ uuid }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);

  const { data: planRes, isLoading } = useQuery({
    queryKey: ["plan", uuid],
    queryFn: () => planService.get(uuid).then((r) => r.data),
  });

  const { data: planFeaturesRes } = useQuery({
    queryKey: ["plan-features", uuid],
    queryFn: () => planService.getFeatures(uuid).then((r) => r.data),
    enabled: tab === "features",
  });

  const { data: allFeaturesRes } = useQuery({
    queryKey: ["features", "all-active"],
    queryFn: () => featureService.listAllActive().then((r) => r.data),
    enabled: tab === "features",
  });

  const { data: planExercisesRes } = useQuery({
    queryKey: ["plan-exercises", uuid],
    queryFn: () => planService.getExercises(uuid).then((r) => r.data),
    enabled: tab === "exercises",
  });

  const { data: planSimulatorsRes } = useQuery({
    queryKey: ["plan-simulators", uuid],
    queryFn: () => planService.getSimulators(uuid).then((r) => r.data),
    enabled: tab === "simulators",
  });

  const upsertFeatureMutation = useMutation({
    mutationFn: ({ featureId, enabled, config }: { featureId: number; enabled: boolean; config?: Record<string, unknown> | null }) =>
      planService.upsertFeature(uuid, { feature_id: featureId, is_enabled: enabled, configuration_json: config }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-features", uuid] }),
  });

  const removeFeatureMutation = useMutation({
    mutationFn: (featureId: number) => planService.removeFeature(uuid, featureId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-features", uuid] }),
  });

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Loading plan...</div>;
  }

  const plan = planRes;
  if (!plan) return <div className="text-destructive p-4">Plan not found</div>;

  const planFeatureIds = new Set((planFeaturesRes ?? []).filter((f) => f.is_enabled).map((f) => f.feature_id));
  const allFeatures = allFeaturesRes ?? [];

  const tabs: { key: Tab; label: string; icon: typeof Puzzle }[] = [
    { key: "overview", label: "Overview", icon: Puzzle },
    { key: "features", label: "Features", icon: Puzzle },
    { key: "exercises", label: "Exercises", icon: BookOpen },
    { key: "simulators", label: "Simulators", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{plan.plan_name}</h1>
            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[plan.status] ?? ""}`}>{plan.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1 font-mono">{plan.plan_code}</p>
        </div>
        <Button onClick={() => setEditing(true)} variant="outline" className="border-border">
          <Pencil className="h-4 w-4 mr-1.5" /> Edit
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-semibold text-foreground">${plan.monthly_price.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">per month</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">${plan.yearly_price.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">per year</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">Billing: {plan.billing_cycle}</div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Limits</h3>
            {[
              ["Users", plan.max_users],
              ["Candidates", plan.max_candidates],
              ["Assessments/month", plan.max_assessments_per_month],
              ["Storage (GB)", plan.max_storage_gb],
              ["Simulators", plan.max_simulators],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-medium">{Number(val) < 0 ? "Unlimited" : Number(val).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-surface p-5 md:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Feature Flags</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ["Certificates", plan.certificate_enabled],
                ["AI Features", plan.ai_enabled],
                ["Offline Mode", plan.offline_enabled],
                ["Custom Exercises", plan.custom_exercises_enabled],
                ["Public Plan", plan.is_public],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${val ? "bg-emerald-500" : "bg-zinc-600"}`} />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features Tab */}
      {tab === "features" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Toggle features on or off for this plan. Changes take effect immediately.</p>
          {allFeatures.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">
              No active features found. Create features first.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    {["Feature", "Code", "Category", "Enabled"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allFeatures.map((f) => {
                    const enabled = planFeatureIds.has(f.id);
                    return (
                      <tr key={f.uuid} className="hover:bg-surface/50">
                        <td className="px-4 py-3 font-medium text-foreground">{f.feature_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.feature_code}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.category}</td>
                        <td className="px-4 py-3">
                          <Switch
                            checked={enabled}
                            onCheckedChange={(on) => {
                              if (on) {
                                upsertFeatureMutation.mutate({ featureId: f.id, enabled: true });
                              } else {
                                removeFeatureMutation.mutate(f.id);
                              }
                            }}
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
      )}

      {/* Exercises Tab */}
      {tab === "exercises" && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm space-y-2">
          <BookOpen className="h-8 w-8 mx-auto opacity-40" />
          <p>Exercise access management for this plan.</p>
          <p className="text-xs">
            {planExercisesRes && planExercisesRes.length > 0
              ? `${planExercisesRes.filter((e) => e.is_enabled).length} exercises enabled.`
              : "No exercises assigned. Use the Plan Exercises page to bulk-assign exercises."}
          </p>
        </div>
      )}

      {/* Simulators Tab */}
      {tab === "simulators" && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm space-y-2">
          <Monitor className="h-8 w-8 mx-auto opacity-40" />
          <p>Simulator access management for this plan.</p>
          <p className="text-xs">
            {planSimulatorsRes && planSimulatorsRes.length > 0
              ? `${planSimulatorsRes.filter((s) => s.is_enabled).length} simulators enabled.`
              : "No simulators assigned."}
          </p>
        </div>
      )}

      <PlanFormDialog open={editing} onClose={() => { setEditing(false); qc.invalidateQueries({ queryKey: ["plan", uuid] }); }} plan={plan} />
    </div>
  );
}
