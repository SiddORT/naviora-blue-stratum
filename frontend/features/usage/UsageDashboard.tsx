"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Users, UserCheck, ClipboardList, HardDrive, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usageService } from "@/services/plans.service";
import type { OrgUsage } from "@/types/plan.types";

function UsageBar({ current, max, label }: { current: number; max?: number | null; label: string }) {
  const pct = max && max > 0 ? Math.min(100, Math.round((current / max) * 100)) : null;
  const color = pct === null ? "bg-[#2EA8FF]" : pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{current} {max != null && max >= 0 ? `/ ${max}` : "/ ∞"} {pct != null && `(${pct}%)`}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: pct != null ? `${pct}%` : "10%" }} />
      </div>
    </div>
  );
}

function UsageCard({ u }: { u: OrgUsage }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground text-sm">{u.organization_name ?? `Org #${u.organization_id}`}</span>
        <span className="text-xs text-muted-foreground">Updated {new Date(u.updated_at).toLocaleDateString()}</span>
      </div>
      <div className="space-y-2">
        <UsageBar current={u.current_users} max={u.max_users} label="Users" />
        <UsageBar current={u.current_candidates} max={u.max_candidates} label="Candidates" />
        <UsageBar current={u.assessments_this_month} max={u.max_assessments_per_month} label="Assessments this month" />
        <UsageBar current={u.storage_used_gb} max={u.max_storage_gb} label="Storage (GB)" />
        <UsageBar current={u.active_simulators} max={u.max_simulators} label="Active Simulators" />
      </div>
    </div>
  );
}

export function UsageDashboard() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["usage", page],
    queryFn: async () => {
      const res = await usageService.list({ page, page_size: 12 });
      return res.data;
    },
    staleTime: 60_000,
  });

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Total Orgs Tracked", value: data?.total ?? 0 },
          { icon: UserCheck, label: "Total Candidates", value: items.reduce((s, u) => s + u.current_candidates, 0) },
          { icon: ClipboardList, label: "Assessments This Month", value: items.reduce((s, u) => s + u.assessments_this_month, 0) },
          { icon: Monitor, label: "Active Simulators", value: items.reduce((s, u) => s + u.active_simulators, 0) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-4">
            <Icon className="h-4 w-4 text-muted-foreground mb-2" />
            <div className="text-xl font-semibold text-foreground">{value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4 h-40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground text-sm">
          No usage data yet. Usage is tracked automatically when organizations are active.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((u) => <UsageCard key={u.organization_id} u={u} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
          <span>Page {page} of {totalPages}</span>
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
