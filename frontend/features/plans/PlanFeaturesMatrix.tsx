"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planService, featureService } from "@/services/plans.service";

export function PlanFeaturesMatrix() {
  const qc = useQueryClient();
  const [selectedPlanUuid, setSelectedPlanUuid] = useState<string>("");

  const { data: plansData } = useQuery({
    queryKey: ["plans", "all"],
    queryFn: async () => {
      const res = await planService.list({ page: 1, page_size: 100 });
      return res.data;
    },
  });

  const { data: allFeaturesRes } = useQuery({
    queryKey: ["features", "all-active"],
    queryFn: () => featureService.listAllActive().then((r) => r.data),
  });

  const { data: planFeaturesRes, isLoading: loadingPlanFeatures } = useQuery({
    queryKey: ["plan-features", selectedPlanUuid],
    queryFn: () => planService.getFeatures(selectedPlanUuid).then((r) => r.data),
    enabled: !!selectedPlanUuid,
  });

  const upsertMutation = useMutation({
    mutationFn: ({ featureId, enabled }: { featureId: number; enabled: boolean }) =>
      planService.upsertFeature(selectedPlanUuid, { feature_id: featureId, is_enabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-features", selectedPlanUuid] }),
  });

  const removeMutation = useMutation({
    mutationFn: (featureId: number) => planService.removeFeature(selectedPlanUuid, featureId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-features", selectedPlanUuid] }),
  });

  const plans = plansData?.items ?? [];
  const allFeatures = allFeaturesRes ?? [];
  const enabledIds = new Set((planFeaturesRes ?? []).filter((f) => f.is_enabled).map((f) => f.feature_id));

  // Group features by category
  const byCategory: Record<string, typeof allFeatures> = {};
  for (const f of allFeatures) {
    if (!byCategory[f.category]) byCategory[f.category] = [];
    byCategory[f.category].push(f);
  }

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
        {selectedPlanUuid && planFeaturesRes && (
          <div className="mt-5 text-sm text-muted-foreground">
            {planFeaturesRes.filter((f) => f.is_enabled).length} of {allFeatures.length} features enabled
          </div>
        )}
      </div>

      {!selectedPlanUuid && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">
          Select a plan above to manage its feature access.
        </div>
      )}

      {selectedPlanUuid && loadingPlanFeatures && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface rounded animate-pulse" />
          ))}
        </div>
      )}

      {selectedPlanUuid && !loadingPlanFeatures && Object.entries(byCategory).map(([cat, features]) => (
        <div key={cat} className="rounded-lg border border-border overflow-hidden">
          <div className="bg-surface px-4 py-2 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</span>
          </div>
          <div className="divide-y divide-border">
            {features.map((f) => {
              const enabled = enabledIds.has(f.id);
              return (
                <div key={f.uuid} className="flex items-center justify-between px-4 py-3 hover:bg-surface/50">
                  <div>
                    <div className="text-sm font-medium text-foreground">{f.feature_name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{f.feature_code}</div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(on) => {
                      if (on) upsertMutation.mutate({ featureId: f.id, enabled: true });
                      else removeMutation.mutate(f.id);
                    }}
                    disabled={upsertMutation.isPending || removeMutation.isPending}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
